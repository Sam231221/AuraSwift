import { useEffect, useState } from "react";
import { useAuth } from "@/shared/hooks";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";
import { UserSelectionGrid } from "./user-selection-grid";
import { PinEntryScreen } from "./pin-entry-screen";
import { getUserColor } from "./utils";
import type { UserForLogin } from "../types/auth.types";

import { getLogger } from '@/shared/utils/logger';
const logger = getLogger('auth-user-selection');

export function AuthUserSelection() {
  const [users, setUsers] = useState<UserForLogin[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserForLogin | null>(null);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [clockMessage, setClockMessage] = useState("");
  const { login, isLoading, clockIn, clockOut } = useAuth();

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await window.authAPI.getAllActiveUsers();
        if (response.success && response.users) {
          // Map users and assign colors
          const cashierCount = { count: 0 };
          const mappedUsers = response.users.map((user) => {
            const roleName = getUserRoleName(user);
            const color = getUserColor(roleName, cashierCount.count);
            if (roleName === "cashier") {
              cashierCount.count++;
            }
            return {
              id: user.id,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              role: roleName as "admin" | "manager" | "cashier",
              color,
            };
          });
          setUsers(mappedUsers);
        }
      } catch (error) {
        logger.error("Failed to fetch users:", error);
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

  const handleClockIn = async () => {
    if (!selectedUser) return;

    setIsClockingIn(true);
    setClockMessage("");
    try {
      const response = await window.authAPI.getUserById(selectedUser.id);
      if (response.success && response.user?.businessId) {
        const result = await clockIn(selectedUser.id, response.user.businessId);
        if (result.success) {
          setClockMessage("✓ Clocked in successfully");
        } else {
          setClockMessage(result.message || "Failed to clock in");
        }
      }
    } catch {
      setClockMessage("Failed to clock in");
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedUser) return;

    setIsClockingOut(true);
    setClockMessage("");
    try {
      const result = await clockOut(selectedUser.id);
      if (result.success) {
        setClockMessage("✓ Clocked out successfully");
      } else {
        setClockMessage(result.message || "Failed to clock out");
      }
    } catch {
      setClockMessage("Failed to clock out");
    } finally {
      setIsClockingOut(false);
    }
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
    <div className="w-full flex items-center justify-center lg:w-auto">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto">
        {!selectedUser ? (
          <UserSelectionGrid
            users={users}
            isLoading={isLoadingUsers}
            onUserSelect={setSelectedUser}
          />
        ) : (
          <PinEntryScreen
            user={selectedUser}
            pin={pin}
            loginError={loginError}
            isLoading={isLoading}
            isClockingIn={isClockingIn}
            isClockingOut={isClockingOut}
            clockMessage={clockMessage}
            onPinInput={handlePinInput}
            onDeletePin={handleDeletePin}
            onBack={handleBack}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
        )}
      </div>
    </div>
  );
}
