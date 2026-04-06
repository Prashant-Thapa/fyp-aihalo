import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById, confirmDelivery } from "../api/order.api";
import useSocket from "../hooks/useSocket";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    ArrowLeft,
    Package,
    CheckCircle2,
    Truck,
    MapPin,
    User,
    Clock,
    Store,
    Timer,
    Navigation,
} from "lucide-react";
import Header from "../components/Header";

/* ──────────────────────────────────
   Leaflet Icon helpers
─────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Customer (destination) pin – red
const customerIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Store pin – green
const storeIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Animated bike DivIcon
const makeBikeIcon = () =>
    new L.DivIcon({
        html: `
      <div style="
        width:44px; height:44px; 
        background:linear-gradient(135deg,#0B4E3C,#1a7a5e);
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 14px rgba(11,78,60,0.45);
        border:3px solid white;
        font-size:22px;
        animation: pulse 1.6s ease-in-out infinite;
      ">🛵</div>
      <style>
        @keyframes pulse {
          0%,100% { transform: scale(1); box-shadow:0 4px 14px rgba(11,78,60,0.45); }
          50%     { transform: scale(1.12); box-shadow:0 6px 20px rgba(11,78,60,0.65); }
        }
      </style>
    `,
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -22],
    });

/* ──────────────────────────────────
   Map auto-pan when rider moves
─────────────────────────────────── */
const MapController = ({ riderLocation }) => {
    const map = useMap();
    useEffect(() => {
        if (riderLocation) {
            map.panTo([riderLocation.lat, riderLocation.lng], { animate: true, duration: 1 });
        }
    }, [riderLocation, map]);
    return null;
};

/* ──────────────────────────────────
   Haversine ETA helper
─────────────────────────────────── */
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getETA = (riderLoc, customerLat, customerLng) => {
    if (!riderLoc) return null;
    const km = haversineKm(riderLoc.lat, riderLoc.lng, customerLat, customerLng);
    const mins = Math.round((km / 20) * 60); // 20 km/h avg
    if (mins <= 1) return "Arriving now!";
    return `~${mins} min away`;
};

/* ──────────────────────────────────
   Status timeline config
─────────────────────────────────── */
const statusSteps = [
    { key: "confirmed", label: "Order Confirmed", icon: CheckCircle2, desc: "Your order has been received" },
    { key: "rider_assigned", label: "Rider Assigned", icon: User, desc: "A rider is on the way to the store" },
    { key: "accepted", label: "Preparing", icon: Package, desc: "Store is packing your groceries" },
    { key: "picked_up", label: "Picked Up", icon: Truck, desc: "Rider has collected your order" },
    { key: "on_the_way", label: "On The Way", icon: Navigation, desc: "Rider is heading to you" },
    { key: "delivered", label: "Delivered", icon: MapPin, desc: "Rider has delivered your order" },
    { key: "completed", label: "Completed", icon: CheckCircle2, desc: "Delivery confirmed! 🎉" },
];

const statusOrder = [
    "pending", "confirmed", "rider_assigned", "accepted",
    "picked_up", "on_the_way", "delivered", "completed",
];

/* ──────────────────────────────────
   Main Component
─────────────────────────────────── */
const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riderLocation, setRiderLocation] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const bikeIconRef = useRef(makeBikeIcon());

    const { onStatusUpdate, onLocationUpdate } = useSocket(id);

    useEffect(() => { fetchOrder(); }, [id]);

    useEffect(() => {
        onStatusUpdate((data) => {
            setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
        });
        onLocationUpdate((data) => {
            setRiderLocation({ lat: data.latitude, lng: data.longitude });
        });
    }, [onStatusUpdate, onLocationUpdate]);

    const fetchOrder = async () => {
        try {
            const response = await getOrderById(id);
            if (response.success) setOrder(response.data);
        } catch (err) {
            console.error("Failed to fetch order:", err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentStepIndex = useCallback(() => {
        if (!order) return -1;
        return statusOrder.indexOf(order.status);
    }, [order]);

    /* ── Loading ── */
    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0B4E3C] border-t-transparent" />
                        <p className="text-gray-500 font-medium">Loading tracking info…</p>
                    </div>
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <Header />
                <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
                    <div className="text-center">
                        <Package size={64} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">Order not found</h2>
                    </div>
                </div>
            </>
        );
    }

    const currentStepIndex = getCurrentStepIndex();
    const customerLat = parseFloat(order.latitude) || 27.7172;
    const customerLng = parseFloat(order.longitude) || 85.324;

    // Store location from the first order item's product
    const storeLocation = order.items?.[0]?.product?.storeLocation;
    const storeLat = storeLocation ? parseFloat(storeLocation.latitude) : null;
    const storeLng = storeLocation ? parseFloat(storeLocation.longitude) : null;

    // Default map center: rider if known, else customer
    const mapCenter = riderLocation
        ? [riderLocation.lat, riderLocation.lng]
        : [customerLat, customerLng];

    // Build blue polyline: Rider → Customer only
    const routePoints = [];
    if (riderLocation) routePoints.push([riderLocation.lat, riderLocation.lng]);
    routePoints.push([customerLat, customerLng]);

    const eta = getETA(riderLocation, customerLat, customerLng);
    const isDelivered = order.status === "delivered";
    const isCompleted = order.status === "completed";
    const isCancelled = order.status === "cancelled";

    const handleConfirmDelivery = async () => {
        try {
            setConfirming(true);
            const res = await confirmDelivery(order.id);
            if (res.success) {
                setOrder((prev) => prev ? { ...prev, status: "completed" } : prev);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to confirm delivery");
        } finally {
            setConfirming(false);
        }
    };

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(14px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                .fade-up { animation: fadeUp 0.4s ease both; }
                .step-line { transition: background 0.5s ease; }
            `}</style>

            <Header />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">

                {/* ─── Hero banner ─── */}
                <div className="bg-gradient-to-r from-[#0B4E3C] to-[#1a7a5e] text-white">
                    <div className="max-w-5xl mx-auto px-4 py-8">
                        <button
                            onClick={() => navigate("/orders")}
                            className="flex items-center gap-2 text-green-200 hover:text-white transition-colors mb-4 text-sm font-medium"
                        >
                            <ArrowLeft size={18} /> Back to My Orders
                        </button>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">Order #{order.id}</h1>
                                <p className="text-green-200 text-sm flex items-center gap-1 mt-1">
                                    <Clock size={14} />
                                    {new Date(order.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {/* ETA Badge */}
                            {eta && order.status === "on_the_way" && (
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-2xl px-5 py-3">
                                    <Timer size={20} className="text-yellow-300" />
                                    <div>
                                        <p className="text-xs text-green-200 font-medium uppercase tracking-wide">ETA</p>
                                        <p className="font-bold text-lg text-white">{eta}</p>
                                    </div>
                                </div>
                            )}
                            {isDelivered && (
                                <div className="flex items-center gap-2 bg-amber-400/30 backdrop-blur rounded-2xl px-5 py-3">
                                    <Package size={20} className="text-amber-200" />
                                    <p className="font-bold text-lg text-white">Awaiting Your Confirmation</p>
                                </div>
                            )}
                            {isCompleted && (
                                <div className="flex items-center gap-2 bg-emerald-400/30 backdrop-blur rounded-2xl px-5 py-3">
                                    <CheckCircle2 size={20} className="text-emerald-200" />
                                    <p className="font-bold text-lg text-white">Completed!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Content grid ─── */}
                <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ── Left: Status Timeline + Details ── */}
                    <div className="space-y-5 fade-up">

                        {/* Status card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Truck size={18} className="text-[#0B4E3C]" /> Delivery Progress
                            </h2>

                            {isCancelled ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Package size={30} className="text-red-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-red-600">Order Cancelled</h3>
                                    <p className="text-sm text-gray-500 mt-1">This order was cancelled.</p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {statusSteps.map((step, idx) => {
                                        const stepIdx = statusOrder.indexOf(step.key);
                                        const completed = currentStepIndex >= stepIdx;
                                        const current = currentStepIndex === stepIdx;
                                        const StepIcon = step.icon;
                                        const isLast = idx === statusSteps.length - 1;

                                        return (
                                            <div key={step.key} className="flex gap-4">
                                                {/* icon + connector */}
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                                                            ${completed
                                                                ? "bg-[#0B4E3C] text-white shadow-lg shadow-green-200"
                                                                : "bg-gray-100 text-gray-400"}
                                                            ${current ? "ring-4 ring-[#0B4E3C]/20 scale-110" : ""}
                                                        `}
                                                    >
                                                        <StepIcon size={18} />
                                                    </div>
                                                    {!isLast && (
                                                        <div
                                                            className={`step-line w-0.5 flex-1 min-h-[2rem] mt-1 mb-1 rounded
                                                                ${completed ? "bg-[#0B4E3C]" : "bg-gray-200"}`}
                                                        />
                                                    )}
                                                </div>
                                                {/* label */}
                                                <div className={`pt-1.5 pb-4 ${isLast ? "" : ""}`}>
                                                    <p className={`font-semibold text-sm transition-colors ${completed ? "text-gray-900" : "text-gray-400"}`}>
                                                        {step.label}
                                                    </p>
                                                    <p className={`text-xs mt-0.5 ${current ? "text-[#0B4E3C] font-medium" : "text-gray-400"}`}>
                                                        {current ? `▸ ${step.desc}` : step.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Rider info */}
                        {order.rider && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 fade-up">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <User size={16} className="text-[#0B4E3C]" /> Your Rider
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-gradient-to-br from-[#0B4E3C] to-[#1a7a5e] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {order.rider.user?.name?.[0]?.toUpperCase() || "R"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{order.rider.user?.name}</p>
                                        <p className="text-sm text-gray-500">{order.rider.user?.email}</p>
                                    </div>
                                    <span className="ml-auto text-2xl">🛵</span>
                                </div>
                            </div>
                        )}

                        {/* Confirm Delivery Button (shown when rider marks delivered) */}
                        {isDelivered && (
                            <div className="bg-gradient-to-r from-amber-50 to-green-50 rounded-2xl shadow-sm border-2 border-amber-200 p-6 fade-up">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Package size={20} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Delivery Received?</h3>
                                        <p className="text-sm text-gray-600 mt-0.5">Your rider has marked this order as delivered. Please confirm you have received it.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConfirmDelivery}
                                    disabled={confirming}
                                    className="w-full flex items-center justify-center gap-2 bg-[#0B4E3C] text-white py-3 px-6 rounded-xl font-semibold text-base hover:bg-[#0a4534] transition-all disabled:opacity-60 shadow-lg"
                                >
                                    {confirming ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Confirm Delivery
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Completed confirmation message */}
                        {isCompleted && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm border-2 border-green-200 p-6 fade-up text-center">
                                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={28} className="text-green-600" />
                                </div>
                                <h3 className="font-bold text-green-800 text-lg">Delivery Confirmed!</h3>
                                <p className="text-sm text-green-600 mt-1">Thank you for confirming. Your order is now complete.</p>
                            </div>
                        )}

                        {/* Order items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 fade-up">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Package size={16} className="text-[#0B4E3C]" /> Order Items
                            </h3>
                            <div className="space-y-2">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-2">
                                            {item.product?.imageUrl ? (
                                                <img
                                                    src={item.product.imageUrl}
                                                    alt={item.product.name}
                                                    className="w-8 h-8 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-[#0B4E3C]">
                                                    <Package size={14} />
                                                </div>
                                            )}
                                            <span className="text-gray-700">
                                                {item.product?.name}{" "}
                                                <span className="text-gray-400">×{item.quantity}</span>
                                            </span>
                                        </div>
                                        <span className="font-semibold text-gray-800">
                                            रु {(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2 font-bold text-base">
                                    <span className="text-gray-700">Total</span>
                                    <span className="text-[#0B4E3C]">रु {parseFloat(order.totalPrice).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Map ── */}
                    <div className="fade-up" style={{ animationDelay: "120ms" }}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Map header */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Navigation size={18} className="text-[#0B4E3C]" /> Live Tracking
                                </h2>
                                {riderLocation ? (
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        Live
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-400 font-medium">Waiting for rider…</span>
                                )}
                            </div>

                            {/* Map */}
                            <div style={{ height: "380px" }}>
                                <MapContainer
                                    center={mapCenter}
                                    zoom={14}
                                    style={{ height: "100%", width: "100%" }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />

                                    {/* Auto-pan when rider moves */}
                                    <MapController riderLocation={riderLocation} />

                                    {/* Blue route polyline */}
                                    {routePoints.length >= 2 && (
                                        <Polyline
                                            positions={routePoints}
                                            color="#2563EB"
                                            weight={4}
                                            opacity={0.8}
                                            dashArray={riderLocation ? null : "8 6"}
                                        />
                                    )}

                                    {/* Store marker */}
                                    {storeLat && storeLng && (
                                        <Marker position={[storeLat, storeLng]} icon={storeIcon}>
                                            <Popup>
                                                <strong>🏪 {storeLocation?.name || "Store"}</strong>
                                                <br />
                                                {storeLocation?.address}
                                            </Popup>
                                        </Marker>
                                    )}

                                    {/* Customer (destination) marker */}
                                    <Marker position={[customerLat, customerLng]} icon={customerIcon}>
                                        <Popup>
                                            <strong>📍 Delivery Location</strong>
                                            <br />
                                            {order.deliveryAddress}
                                        </Popup>
                                    </Marker>

                                    {/* Animated rider/bike marker */}
                                    {riderLocation && (
                                        <Marker
                                            position={[riderLocation.lat, riderLocation.lng]}
                                            icon={bikeIconRef.current}
                                        >
                                            <Popup>
                                                <strong>🛵 Your Rider</strong>
                                                <br />
                                                {order.rider?.user?.name || "Rider"}
                                                {eta && <><br /><span style={{ color: "#0B4E3C", fontWeight: 600 }}>{eta}</span></>}
                                            </Popup>
                                        </Marker>
                                    )}
                                </MapContainer>
                            </div>

                            {/* Map legend */}
                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Store
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-sm">🛵</span> Rider
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> You
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block w-8 h-0.5 bg-blue-600 rounded" /> Route
                                    </span>
                                </div>
                                <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                                    <MapPin size={12} className="text-[#0B4E3C] mt-0.5 flex-shrink-0" />
                                    <span>{order.deliveryAddress}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderTracking;
