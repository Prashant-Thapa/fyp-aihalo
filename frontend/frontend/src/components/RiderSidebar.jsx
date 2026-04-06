import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Package, Map, User, LogOut } from "lucide-react";

const RiderSidebar = () => {
    const { logout, user } = useAuth();

    const navItems = [
        { to: "/rider", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/rider/orders", icon: Package, label: "My Orders" },
        { to: "/rider/map", icon: Map, label: "Delivery Map" },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-xl font-bold text-[#0B4E3C]">🏍️ AI Halo Rider</h1>
                <p className="text-sm text-gray-500 mt-1">{user?.name}</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                ? "bg-[#0B4E3C] text-white shadow-lg shadow-[#0B4E3C]/20"
                                : "text-gray-600 hover:bg-gray-100"
                            }`
                        }
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default RiderSidebar;
