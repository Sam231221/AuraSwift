/**
 * Barcode scanner input component
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface BarcodeScannerInputProps {
  barcodeInput: string;
  onBarcodeInputChange: (value: string) => void;
  onBarcodeScan: () => void;
}

export function BarcodeScannerInput({
  barcodeInput,
  onBarcodeInputChange,
  onBarcodeScan,
}: BarcodeScannerInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        placeholder="Scan/Enter barcode or PLU code"
        value={barcodeInput}
        onChange={(e) => onBarcodeInputChange(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && onBarcodeScan()}
        className="bg-white text-sm border-slate-300"
      />
      <Button
        onClick={onBarcodeScan}
        className="bg-sky-600 hover:bg-sky-700"
      >
        Scan
      </Button>
    </div>
  );
}

