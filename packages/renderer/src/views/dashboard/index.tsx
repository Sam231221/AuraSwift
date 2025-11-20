import { useAuth } from "@/shared/hooks";
import { AdminDashboard } from "./admin-view";
import { CashierDashboard } from "./cashier-view";
import { ManagerDashboard } from "./manager-view";

type Role = "admin" | "manager" | "cashier";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <svg
          className="animate-spin h-8 w-8 text-sky-600 mr-3"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <span className="text-slate-600 text-lg">Loading...</span>
      </div>
    );
  }

  // Exhaustive type checking for roles
  const role = user.role as Role;
  switch (role) {
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
