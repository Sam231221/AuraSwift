interface QuickActionButtonsProps {
  onWeightModalOpen?: () => void;
  onLogOff?: () => void;
}

const topButtons = [
  { label: "Quantity" },
  { label: "Line void" },
  { label: "Price override" },
];

const bottomButtons = [
  { label: "Lock till" },
  { label: "Void basket" },
  { label: "Save basket" },
  { label: "Item enquiry" },
];

const footerButtons = [
  { label: "Log off" },
  { label: "Receipts" },
  { label: "Refund" },
  { label: "More" },
];

export function QuickActionButtons({
  onWeightModalOpen,
  onLogOff,
}: QuickActionButtonsProps) {
  return (
    <div className="space-y-2 sm:space-y-3 mt-2">
      {/* Top Row */}

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {topButtons.map((btn) => (
          <button
            key={btn.label}
            className="bg-slate-200 text-slate-700 font-semibold py-2 sm:py-2.5 lg:py-3 rounded text-xs sm:text-sm hover:bg-slate-300 transition-colors touch-manipulation"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Middle Row */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {bottomButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={
              btn.label === "Item enquiry"
                ? onWeightModalOpen
                : btn.label === "Log off"
                ? onLogOff
                : undefined
            }
            className="bg-sky-600 text-white font-semibold py-2 sm:py-2.5 lg:py-3 rounded text-xs sm:text-sm hover:bg-sky-700 transition-colors touch-manipulation"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Footer Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {footerButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.label === "Log off" ? onLogOff : undefined}
            className="bg-slate-100 text-slate-700 font-semibold py-2 sm:py-2.5 lg:py-3 rounded text-xs sm:text-sm hover:bg-slate-200 transition-colors touch-manipulation"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
