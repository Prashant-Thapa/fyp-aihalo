const crypto = require("crypto");
const { Order, OrderItem, Product, User } = require("../models/index");

// eSewa sandbox config
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_PAYMENT_URL = process.env.ESEWA_PAYMENT_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_VERIFY_URL = process.env.ESEWA_VERIFY_URL || "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Generate HMAC SHA256 signature for eSewa
const generateSignature = (message) => {
  const hmac = crypto.createHmac("sha256", ESEWA_SECRET_KEY);
  hmac.update(message);
  return hmac.digest("base64");
};

// POST /api/payment/esewa/initiate — generate eSewa payment form data
const initiateEsewaPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Order already paid" });
    }

    const amount = parseFloat(order.totalPrice);
    const taxAmount = 0;
    const totalAmount = amount + taxAmount;
    const transactionUuid = `AIHALO-${order.id}-${Date.now()}`;

    // eSewa requires signature of: total_amount,transaction_uuid,product_code
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const signature = generateSignature(signatureMessage);

    const formData = {
      amount: amount.toString(),
      tax_amount: taxAmount.toString(),
      total_amount: totalAmount.toString(),
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${FRONTEND_URL}/payment/success`,
      failure_url: `${FRONTEND_URL}/payment/failed`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    };

    // Store the transaction UUID on the order
    await order.update({ esewaTransactionId: transactionUuid });

    return res.status(200).json({
      success: true,
      data: {
        paymentUrl: ESEWA_PAYMENT_URL,
        formData,
      },
    });
  } catch (err) {
    console.error("[PAYMENT] Error initiating eSewa payment:", err);
    return res.status(500).json({ success: false, message: "Internal server error", debug: err.message });
  }
};

// GET /api/payment/esewa/verify — verify eSewa payment callback
const verifyEsewaPayment = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({ success: false, message: "Missing payment data" });
    }

    // Decode the base64 encoded response from eSewa
    let decodedData;
    try {
      decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid payment data" });
    }

    console.log("[PAYMENT] eSewa response:", decodedData);

    const { transaction_uuid, status, total_amount } = decodedData;

    if (status !== "COMPLETE") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    // Find the order by transaction UUID
    const order = await Order.findOne({
      where: { esewaTransactionId: transaction_uuid },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found for this transaction" });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Payment already verified", data: { orderId: order.id } });
    }

    // Verify the signature
    const signatureMessage = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${ESEWA_PRODUCT_CODE}`;
    const expectedSignature = generateSignature(signatureMessage);

    if (decodedData.signature && decodedData.signature !== expectedSignature) {
      console.error("[PAYMENT] Signature mismatch");
      await order.update({ paymentStatus: "failed" });
      return res.status(400).json({ success: false, message: "Payment verification failed - signature mismatch" });
    }

    // Update order status
    await order.update({
      paymentStatus: "paid",
      status: "confirmed",
    });

    console.log(`[PAYMENT] ✓ Order ${order.id} payment verified and confirmed`);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: { orderId: order.id },
    });
  } catch (err) {
    console.error("[PAYMENT] Error verifying eSewa payment:", err);
    return res.status(500).json({ success: false, message: "Internal server error", debug: err.message });
  }
};

// POST /api/payment/esewa/failed — handle payment failure
const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (orderId) {
      const order = await Order.findByPk(orderId);
      if (order && order.paymentStatus !== "paid") {
        await order.update({ paymentStatus: "failed" });
        console.log(`[PAYMENT] ✗ Order ${orderId} payment marked as failed`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment failure recorded",
    });
  } catch (err) {
    console.error("[PAYMENT] Error handling failure:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  initiateEsewaPayment,
  verifyEsewaPayment,
  handlePaymentFailure,
};
