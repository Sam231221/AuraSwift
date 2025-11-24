import { BatteryFull, Bell, Store, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

// Header component for banner and time
export function AuthHeader() {
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
    <header className="w-full flex items-center justify-between px-2 sm:px-4 lg:px-6 py-2 sm:py-3 border-b border-gray-200 bg-white/90 shadow-sm select-none">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
            AuraSwift
          </h1>
          <p className="text-[10px] sm:text-[12px] text-muted-foreground truncate">
            Point of Sale System
          </p>
        </div>
      </div>
      {/* Center: Store/Terminal Name - Hidden on small screens */}
      <div className="hidden sm:flex flex-1 justify-center items-center min-w-0 px-2">
        <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-700 truncate max-w-xs text-center"></span>
      </div>

      {/* Right: Status Area */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
        <span className="hidden md:inline-flex items-center gap-1.5 lg:gap-2 text-gray-400">
          <Wifi className="w-4 h-4 lg:w-5 lg:h-5" aria-label="Network Status" />
          <BatteryFull
            className="w-4 h-4 lg:w-5 lg:h-5"
            aria-label="Battery Status"
          />
          <Bell className="w-4 h-4 lg:w-5 lg:h-5" aria-label="Notifications" />
        </span>
        <span
          className="text-xs sm:text-sm font-mono text-gray-700 whitespace-nowrap"
          aria-label="Current Time"
        >
          {timeString}
        </span>
      </div>
    </header>
  );
}
