import { useState, useEffect } from "react";
import { getRiderOrders } from "../../api/rider.api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Package } from "lucide-react";

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const deliveryIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const statusLabels = {
    rider_assigned: "Assigned",
    accepted: "Accepted",
    picked_up: "Picked Up",
    on_the_way: "On The Way",
};

const RiderMap = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await getRiderOrders();
            if (response.success) {
                // Only show active orders on map
                const activeOrders = response.data.filter(
                    (o) => !["delivered", "cancelled"].includes(o.status)
                );
                setOrders(activeOrders);
            }
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Default center: Kathmandu
    const defaultCenter = [27.7172, 85.324];
    const center =
        orders.length > 0
            ? [parseFloat(orders[0].latitude) || 27.7172, parseFloat(orders[0].longitude) || 85.324]
            : defaultCenter;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Delivery Map</h1>

            {orders.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No active deliveries to show on map</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="rounded-xl overflow-hidden" style={{ height: "600px" }}>
                        <MapContainer
                            center={center}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {orders.map((order) => (
                                <Marker
                                    key={order.id}
                                    position={[parseFloat(order.latitude) || 27.7172, parseFloat(order.longitude) || 85.324]}
                                    icon={deliveryIcon}
                                >
                                    <Popup>
                                        <div className="min-w-[180px]">
                                            <strong className="text-[#0B4E3C]">Order #{order.id}</strong>
                                            <p className="text-sm mt-1">{order.deliveryAddress}</p>
                                            <p className="text-sm mt-1">Customer: {order.user?.name}</p>
                                            <p className="text-sm mt-1">Status: {statusLabels[order.status]}</p>
                                            <p className="text-sm font-bold mt-1">रु {parseFloat(order.totalPrice).toFixed(2)}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Showing {orders.length} active delivery location{orders.length !== 1 ? "s" : ""}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiderMap;
