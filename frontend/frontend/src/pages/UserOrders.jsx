import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserOrders, reorderItems, confirmDelivery } from "../api/order.api";
import {
    Package,
    Clock,
    MapPin,
    ChevronRight,
    ShoppingBag,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    X,
} from "lucide-react";
import Header from "../components/Header";

/* ───────── Status helpers ───────── */
const statusColors = {
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border border-blue-200",
    rider_assigned: "bg-purple-100 text-purple-700 border border-purple-200",
    accepted: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    picked_up: "bg-orange-100 text-orange-700 border border-orange-200",
    on_the_way: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    delivered: "bg-amber-100 text-amber-700 border border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border border-red-200",
};

const statusLabels = {
    pending: "Pending",
    confirmed: "Confirmed",
    rider_assigned: "Rider Assigned",
    accepted: "Accepted",
    picked_up: "Picked Up",
    on_the_way: "On The Way",
    delivered: "Awaiting Confirmation",
    completed: "Completed",
    cancelled: "Cancelled",
};

/* ───────── Toast ───────── */
const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;
    const isSuccess = toast.type === "success";
    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl max-w-sm animate-slide-in
                ${isSuccess ? "bg-emerald-600" : "bg-red-600"} text-white`}
            style={{ animation: "slideIn 0.3s ease" }}
        >
            {isSuccess
                ? <CheckCircle2 size={22} className="flex-shrink-0 mt-0.5" />
                : <AlertTriangle size={22} className="flex-shrink-0 mt-0.5" />}
            <div className="flex-1 text-sm leading-snug">
                <p className="font-semibold mb-0.5">{toast.title}</p>
                {toast.body && <p className="opacity-90">{toast.body}</p>}
            </div>
            <button onClick={onDismiss} className="opacity-70 hover:opacity-100 mt-0.5">
                <X size={18} />
            </button>
        </div>
    );
};

/* ───────── Main Component ───────── */
const UserOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reordering, setReordering] = useState(null); // orderId being reordered
    const [confirming, setConfirming] = useState(null); // orderId being confirmed
    const [toast, setToast] = useState(null);

    useEffect(() => { fetchOrders(); }, []);

    /* Auto-dismiss toast after 5 s */
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(t);
    }, [toast]);

    const fetchOrders = async () => {
        try {
            const response = await getUserOrders();
            if (response.success) setOrders(response.data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = useCallback(async (e, orderId) => {
        e.preventDefault();   // don't follow the Link
        e.stopPropagation();
        setReordering(orderId);
        try {
            const res = await reorderItems(orderId);
            if (res.success) {
                const { addedCount, outOfStock } = res.data;
                if (outOfStock.length > 0) {
                    setToast({
                        type: "warning",
                        title: `${addedCount} item${addedCount !== 1 ? "s" : ""} added — ${outOfStock.length} out of stock`,
                        body: `Out of stock: ${outOfStock.join(", ")}`,
                    });
                } else {
                    setToast({
                        type: "success",
                        title: `${addedCount} item${addedCount !== 1 ? "s" : ""} added to cart!`,
                        body: "Review and edit quantities before checkout.",
                    });
                }
                // Small delay so user can read the toast, then go to cart
                setTimeout(() => navigate("/cart"), 900);
            }
        } catch (err) {
            setToast({ type: "warning", title: "Reorder failed", body: "Please try again." });
        } finally {
            setReordering(null);
        }
    }, [navigate]);

    /* ── Loading ── */
    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0B4E3C] border-t-transparent" />
                        <p className="text-gray-500 font-medium">Loading your orders…</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(40px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .order-card { animation: fadeUp 0.35s ease both; }
            `}</style>

            <Header />
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
                {/* Hero header */}
                <div className="bg-gradient-to-r from-[#0B4E3C] to-[#1a7a5e] text-white">
                    <div className="max-w-4xl mx-auto px-4 py-10">
                        <div className="flex items-center gap-3 mb-1">
                            <Package size={28} />
                            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
                        </div>
                        <p className="text-green-100 text-sm mt-1">
                            {orders.length > 0
                                ? `${orders.length} order${orders.length !== 1 ? "s" : ""} — click Reorder to quickly re-add items to your cart`
                                : "Your past orders will appear here"}
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-8">
                    {orders.length === 0 ? (
                        /* Empty state */
                        <div className="bg-white rounded-3xl shadow-sm p-14 text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                <ShoppingBag size={36} className="text-[#0B4E3C]" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
                            <p className="text-gray-500 mb-7">Your order history will show up here once you place your first order.</p>
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-2 bg-[#0B4E3C] text-white px-7 py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors shadow"
                            >
                                <ShoppingBag size={18} />
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order, idx) => (
                                <div
                                    key={order.id}
                                    className="order-card bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                >
                                    {/* Top strip */}
                                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                                        <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
                                            Order #{order.id}
                                        </span>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                                            {statusLabels[order.status] || order.status}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <Link to={`/orders/${order.id}/track`}>
                                        <div className="px-5 py-4">
                                            {/* Date + address */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric", month: "short", day: "numeric",
                                                        hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {order.deliveryAddress?.substring(0, 32)}{order.deliveryAddress?.length > 32 ? "…" : ""}
                                                </span>
                                            </div>

                                            {/* Items preview */}
                                            <p className="text-sm text-gray-600 mb-0.5">
                                                <span className="font-medium text-gray-800">
                                                    {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}:
                                                </span>{" "}
                                                {order.items?.map((it) => it.product?.name).filter(Boolean).join(", ")}
                                            </p>

                                            {/* Rider */}
                                            {order.rider && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    🏍️ Rider: {order.rider.user?.name}
                                                </p>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Footer: total + actions */}
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
                                        <p className="font-bold text-[#0B4E3C] text-lg">
                                            रु {parseFloat(order.totalPrice).toFixed(2)}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {/* Confirm Delivery button (for delivered orders) */}
                                            {order.status === "delivered" && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setConfirming(order.id);
                                                        try {
                                                            const res = await confirmDelivery(order.id);
                                                            if (res.success) {
                                                                setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "completed" } : o));
                                                                setToast({ type: "success", title: "Delivery confirmed!", body: "Order marked as completed." });
                                                            }
                                                        } catch (err) {
                                                            setToast({ type: "warning", title: "Failed to confirm", body: err.response?.data?.message || "Please try again." });
                                                        } finally {
                                                            setConfirming(null);
                                                        }
                                                    }}
                                                    disabled={confirming === order.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                                >
                                                    {confirming === order.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                    ) : (
                                                        <CheckCircle2 size={15} />
                                                    )}
                                                    {confirming === order.id ? "Confirming…" : "Confirm Delivery"}
                                                </button>
                                            )}
                                            {/* Reorder button */}
                                            <button
                                                onClick={(e) => handleReorder(e, order.id)}
                                                disabled={reordering === order.id}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4E3C] text-white text-sm font-semibold hover:bg-[#0a4534] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                <RefreshCw
                                                    size={15}
                                                    className={reordering === order.id ? "animate-spin" : ""}
                                                />
                                                {reordering === order.id ? "Adding…" : "Reorder"}
                                            </button>
                                            {/* Track link */}
                                            <Link
                                                to={`/orders/${order.id}/track`}
                                                className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                                            >
                                                Track
                                                <ChevronRight size={15} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserOrders;
