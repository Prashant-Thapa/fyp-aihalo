import api from "./axios";

// Initiate eSewa payment for an order
export const initiateEsewaPayment = async (orderId) => {
  const response = await api.post("/payment/esewa/initiate", { orderId });
  return response.data;
};

// Verify eSewa payment (called with the data from eSewa redirect)
export const verifyEsewaPayment = async (data) => {
  const response = await api.get("/payment/esewa/verify", { params: { data } });
  return response.data;
};

// Report payment failure
export const reportPaymentFailure = async (orderId) => {
  const response = await api.post("/payment/esewa/failed", { orderId });
  return response.data;
};
