import { Outlet } from "react-router-dom";
import RiderSidebar from "../../components/RiderSidebar";

const RiderLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <RiderSidebar />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default RiderLayout;
