import { BatteryFull, Bell, Store, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

// Header component for banner and time
export default function AuthHeader() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time as HH:mm:ss
  const timeString = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="w-full flex items-center justify-between px-2 sm:px-4 py-2 border-b border-gray-200 bg-white/90 shadow-sm select-none">
      <div className="flex py-2 items-center gap-2 min-w-0">
        <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
          <Store className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">AuraSwift</h1>
          <p className="text-[12px] text-muted-foreground">
            Point of Sale System
          </p>
        </div>
      </div>
      {/* Center: Store/Terminal Name */}
      <div className="flex-1 flex justify-center items-center min-w-0">
        <span className="text-base sm:text-lg font-semibold text-gray-700 truncate max-w-xs text-center"></span>
      </div>

      {/* Right: Status Area */}
      <div className="flex items-center gap-4 min-w-0">
        <span className="hidden md:inline-flex items-center gap-2 text-gray-400">
          <Wifi className="w-5 h-5" aria-label="Network Status" />
          <BatteryFull className="w-5 h-5" aria-label="Battery Status" />
          <Bell className="w-5 h-5" aria-label="Notifications" />
        </span>
        <span
          className="text-sm font-mono text-gray-700"
          aria-label="Current Time"
        >
          {timeString}
        </span>
      </div>
    </header>
  );
}
