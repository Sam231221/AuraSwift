const ROLE_COLORS: Record<string, string> = {
  admin: "bg-blue-500",
  manager: "bg-green-500",
  cashier: "bg-purple-500",
};

export const getUserColor = (role: string, index: number): string => {
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

export const getDemoPin = (role: string): string => {
  switch (role) {
    case "admin":
      return "1234";
    case "manager":
      return "5678";
    case "cashier":
      return "9999";
    default:
      return "0000";
  }
};

