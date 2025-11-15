"use client";

interface PaymentPanelProps {
  subtotal: number;
}

const quickAmounts = [
  { value: 5.2, label: "£5.20", color: "#8b9b9b" },
  { value: 5, label: "£5", color: "#8b9b9b" },
  { value: 10, label: "£10", color: "#8b9b9b" },
  { value: 20, label: "£20", color: "#8b9b9b" },
];

const paymentMethods = [
  { label: "£50", color: "#6b7373" },
  { label: "CASH", color: "#4a4a4a" },
  { label: "CHEQUE", color: "#5a5a5a" },
  { label: "VOUCHER", color: "#6a6a6a" },
  { label: "CARD", color: "#4a5a5a" },
];

export function PaymentPanel({ subtotal }: PaymentPanelProps) {
  return (
    <div className="space-y-3">
      {/* Quick Amounts */}
      <div className="grid grid-cols-4 gap-2">
        {quickAmounts.map((amount) => (
          <button
            key={amount.value}
            className={`bg-[${amount.color}] text-[#2d2d2d] font-bold py-4 rounded hover:bg-opacity-90 transition-colors`}
          >
            {amount.label}
          </button>
        ))}
      </div>

      {/* Payment Methods - Row 1 */}
      <div className="grid grid-cols-4 gap-2">
        {paymentMethods.slice(0, 4).map((method) => (
          <button
            key={method.label}
            className={`bg-[${method.color}] text-${
              method.label === "CASH" ? "white" : "#2d2d2d"
            } font-bold py-6 rounded hover:bg-opacity-90 transition-colors`}
          >
            {method.label}
          </button>
        ))}
      </div>

      {/* Payment Methods - Row 2 */}
      <div className="grid grid-cols-4 gap-2">
        {paymentMethods.slice(4).map((method) => (
          <button
            key={method.label}
            className={`bg-[${method.color}] text-white font-bold py-6 rounded hover:bg-opacity-90 transition-colors col-span-4`}
          >
            {method.label}
          </button>
        ))}
      </div>
    </div>
  );
}
