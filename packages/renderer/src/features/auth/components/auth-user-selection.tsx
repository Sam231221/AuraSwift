import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft, Delete } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks";

interface UserForLogin {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "cashier";
  color: string;
}
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-500",
  manager: "bg-green-500",
  cashier: "bg-purple-500",
};

const getUserColor = (role: string, index: number): string => {
  const baseColor = ROLE_COLORS[role] || "bg-gray-500";
  if (role === "cashier") {
    const colors = [
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    return colors[index % colors.length];
  }
  return baseColor;
};
export function AuthUserSelection() {
  const [users, setUsers] = useState<UserForLogin[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserForLogin | null>(null);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { login, isLoading } = useAuth();

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await window.authAPI.getAllActiveUsers();
        if (response.success && response.users) {
          // Map users and assign colors
          const cashierCount = { count: 0 };
          const mappedUsers = response.users.map((user) => {
            const color = getUserColor(user.role, cashierCount.count);
            if (user.role === "cashier") {
              cashierCount.count++;
            }
            return {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role as "admin" | "manager" | "cashier",
              color,
            };
          });
          setUsers(mappedUsers);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleDeletePin = () => {
    setPin(pin.slice(0, -1));
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPin("");
    setLoginError("");
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    const handleLogin = async () => {
      if (!selectedUser || pin.length !== 4) return;

      setLoginError("");
      const result = await login(selectedUser.username, pin, false);
      if (!result.success) {
        setLoginError(result.message);
        setPin("");
      }
    };

    if (pin.length === 4 && selectedUser) {
      handleLogin();
    }
  }, [pin, selectedUser, login]);

  return (
    <div className="w-full max-w-lg">
      {!selectedUser ? (
        // User Selection Screen
        <Card className="border-0 shadow-none bg-transparent rounded-3xl overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Select User
              </h2>
              <p className="text-gray-600 text-sm">
                {isLoadingUsers
                  ? "Loading users..."
                  : "Tap your profile to login"}
              </p>
            </div>

            {isLoadingUsers ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p>No users found. Please contact administrator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="group relative flex flex-col items-center p-2 hover:rounded-full hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                  >
                    <div
                      className={`w-14 h-14 ${user.color} rounded-full flex items-center justify-center mb-2 transition-shadow`}
                    >
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-0.5">
                      {user.firstName} {user.lastName}
                    </h3>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        // PIN Entry Screen
        <Card className="border-0 shadow-none bg-transparent rounded-3xl overflow-hidden">
          <div className="p-6">
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 ${selectedUser.color} rounded-full flex items-center justify-center mx-auto mb-3`}
              >
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedUser.firstName} {selectedUser.lastName}
              </h2>

              <p className="text-orange-600 text-xs font-medium mt-1 tracking-wide">
                {selectedUser.role === "admin"
                  ? "Demo Pin: 1234"
                  : selectedUser.role === "manager"
                  ? "Demo Pin: 5678"
                  : "Demo Pin:9999"}
              </p>
            </div>

            {/* PIN Input Display */}
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-1 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600 text-xs uppercase tracking-wider font-medium">
                  Enter PIN
                </span>
              </div>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      pin.length > i
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-gray-300 text-transparent"
                    }`}
                  >
                    {pin.length > i ? "●" : "○"}
                  </div>
                ))}
              </div>
              {loginError && (
                <p className="text-red-500 text-xs text-center mt-2">
                  {loginError}
                </p>
              )}
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  onClick={() => handlePinInput(num.toString())}
                  disabled={isLoading || pin.length >= 4}
                  className="h-14 text-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-900 border-0 rounded-lg transition-all disabled:opacity-50"
                >
                  {num}
                </Button>
              ))}
              <Button
                onClick={() => handlePinInput("0")}
                disabled={isLoading || pin.length >= 4}
                className="h-14 text-xl font-semibold bg-gray-200 hover:bg-gray-300 text-gray-900 border-0 rounded-lg transition-all col-span-3 disabled:opacity-50"
              >
                0
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleBack}
                disabled={isLoading}
                variant="outline"
                className="h-12 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-900 border-0 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK
              </Button>
              <Button
                onClick={handleDeletePin}
                disabled={isLoading || pin.length === 0}
                className="h-12 text-sm font-medium bg-red-100 hover:bg-red-200 text-red-700 border-0 rounded-lg disabled:opacity-50"
              >
                <Delete className="w-4 h-4 mr-2" />
                DELETE
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
