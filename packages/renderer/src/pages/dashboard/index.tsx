import { AdminDashboard } from "./admin";
import ManagerDashboard from "./manager";
import CashierDashboard from "./cashier";
import { useAuth } from "@/shared/hooks";

export default function DashboardPage() {
  const { user } = useAuth();
  console.log("Current User:", user);
  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "cashier":
      return <CashierDashboard />;
    default:
      return <div>Unauthorized</div>;
  }
}
