/**
 * Scale Display Component
 * Shows real-time weight readings, stability status, and scale controls
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Scale,
  AlertTriangle,
  CheckCircle,
  X,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { useScaleManager } from "@/shared/hooks/use-scale-manager";
import { Progress } from "@/components/ui/progress";

// =============================================================================
// TYPES
// =============================================================================

interface ScaleDisplayProps {
  selectedProduct?: {
    id: string;
    name: string;
    productType: "STANDARD" | "WEIGHTED" | "GENERIC";
    basePrice?: number;
    pricePerUnit?: number;
    unitOfMeasure?: string;
  } | null;
  onWeightConfirmed?: (weight: number) => void;
  onCancel?: () => void;
  autoAddOnStable?: boolean;
  minWeight?: number;
  maxWeight?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ScaleDisplay: React.FC<ScaleDisplayProps> = ({
  selectedProduct,
  onWeightConfirmed,
  onCancel,
  autoAddOnStable = false,
  minWeight,
  maxWeight,
}) => {
  const {
    currentReading,
    isConnected,
    isStable,
    hasWeight,
    tareScale,
    reconnectScale,
  } = useScaleManager();

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualWeight, setManualWeight] = useState("");
  const [manualUnit, setManualUnit] = useState<"g" | "kg">("kg");
  const [weightConfirmed, setWeightConfirmed] = useState(false);

  // Convert weight to display unit
  const getDisplayWeight = (weightKg: number, unit: "g" | "kg"): number => {
    return unit === "g" ? weightKg * 1000 : weightKg;
  };

  // Format weight for display
  const formatWeight = (weightKg: number, unit: "g" | "kg"): string => {
    const displayWeight = getDisplayWeight(weightKg, unit);
    if (unit === "g") {
      return `${displayWeight.toFixed(1)}g`;
    }
    return `${displayWeight.toFixed(3)}kg`;
  };

  // Calculate price for weighted product
  const calculatePrice = (): number => {
    if (!selectedProduct || !currentReading || !selectedProduct.pricePerUnit) {
      return 0;
    }
    return currentReading.weight * selectedProduct.pricePerUnit;
  };

  // Get status color
  const getStatusColor = (): string => {
    if (!isConnected) return "text-gray-500";
    if (!hasWeight) return "text-gray-400";
    if (isStable) return "text-green-600";
    return "text-yellow-600";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!isConnected) return <Scale className="h-5 w-5 text-gray-500" />;
    if (!hasWeight) return <Scale className="h-5 w-5 text-gray-400" />;
    if (isStable) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  // Get stability progress (0-100)
  const getStabilityProgress = (): number => {
    if (!currentReading || !currentReading.rawReadings) return 0;
    if (currentReading.rawReadings.length < 3) {
      return (currentReading.rawReadings.length / 3) * 100;
    }
    return isStable ? 100 : 50;
  };

  // Handle manual weight entry
  const handleManualEntry = () => {
    const weight = parseFloat(manualWeight);
    if (isNaN(weight) || weight <= 0) {
      return;
    }

    // Convert to kg if needed
    const weightKg = manualUnit === "g" ? weight / 1000 : weight;

    // Check min/max limits
    if (minWeight && weightKg < minWeight) {
      alert(`Weight must be at least ${minWeight}kg`);
      return;
    }
    if (maxWeight && weightKg > maxWeight) {
      alert(`Weight must not exceed ${maxWeight}kg`);
      return;
    }

    if (onWeightConfirmed) {
      onWeightConfirmed(weightKg);
    }
    setShowManualEntry(false);
    setManualWeight("");
  };

  // Auto-add when stable (if enabled)
  React.useEffect(() => {
    if (
      autoAddOnStable &&
      isStable &&
      hasWeight &&
      currentReading &&
      selectedProduct &&
      !weightConfirmed
    ) {
      const weight = currentReading.weight;

      // Check min/max limits
      if (minWeight && weight < minWeight) {
        return; // Don't add if below minimum
      }
      if (maxWeight && weight > maxWeight) {
        return; // Don't add if above maximum
      }

      setWeightConfirmed(true);
      if (onWeightConfirmed) {
        onWeightConfirmed(weight);
      }
    }
  }, [
    autoAddOnStable,
    isStable,
    hasWeight,
    currentReading,
    selectedProduct,
    weightConfirmed,
    onWeightConfirmed,
    minWeight,
    maxWeight,
  ]);

  // Reset confirmation when product changes
  React.useEffect(() => {
    setWeightConfirmed(false);
  }, [selectedProduct?.id]);

  if (!selectedProduct) {
    return null;
  }

  const displayUnit = selectedProduct.unitOfMeasure === "g" ? "g" : "kg";
  const displayWeight = currentReading
    ? formatWeight(currentReading.weight, displayUnit)
    : "0" + displayUnit;
  const price = calculatePrice();

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Weighing: {selectedProduct.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reconnectScale}
                className="h-8"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reconnect
              </Button>
            )}
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          {!isConnected && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Scale not connected. Please connect a scale or use manual entry.
              </AlertDescription>
            </Alert>
          )}

          {/* Weight Display */}
          <div className="text-center space-y-2">
            <div className={`text-4xl font-bold ${getStatusColor()}`}>
              {displayWeight}
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {getStatusIcon()}
              <span className={getStatusColor()}>
                {!isConnected
                  ? "Not Connected"
                  : !hasWeight
                    ? "Waiting for item..."
                    : isStable
                      ? "Weight Stable"
                      : "Stabilizing..."}
              </span>
            </div>

            {/* Stability Progress */}
            {isConnected && hasWeight && !isStable && (
              <div className="space-y-1">
                <Progress value={getStabilityProgress()} className="h-2" />
                <p className="text-xs text-gray-500">
                  Waiting for stable reading...
                </p>
              </div>
            )}

            {/* Price Display */}
            {hasWeight && selectedProduct.pricePerUnit && (
              <div className="pt-2 border-t">
                <div className="text-sm text-gray-600">
                  Price: <span className="font-semibold">${price.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {currentReading?.weight.toFixed(3)}kg × $
                  {selectedProduct.pricePerUnit.toFixed(2)}/
                  {selectedProduct.unitOfMeasure || "kg"}
                </div>
              </div>
            )}

            {/* Auto-add notification */}
            {autoAddOnStable && isStable && hasWeight && weightConfirmed && (
              <Alert className="mt-2">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Item added to cart automatically
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowManualEntry(true)}
              className="flex-1"
            >
              📝 Enter Weight Manually
            </Button>
            {isConnected && (
              <Button
                variant="outline"
                onClick={tareScale}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Tare
              </Button>
            )}
            {hasWeight && isStable && !autoAddOnStable && onWeightConfirmed && (
              <Button
                onClick={() => {
                  if (currentReading) {
                    onWeightConfirmed(currentReading.weight);
                  }
                }}
                className="flex-1"
              >
                Add to Cart
              </Button>
            )}
          </div>

          {/* Weight Limits Warning */}
          {hasWeight && currentReading && (
            <>
              {minWeight && currentReading.weight < minWeight && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Weight below minimum ({minWeight}kg). Please add more.
                  </AlertDescription>
                </Alert>
              )}
              {maxWeight && currentReading.weight > maxWeight && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Weight exceeds maximum ({maxWeight}kg). Please remove some.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Weight Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Weight Manually</DialogTitle>
            <DialogDescription>
              Enter the weight for {selectedProduct.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.001"
                  min={minWeight || 0}
                  max={maxWeight || 100}
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  placeholder="0.000"
                />
                <select
                  value={manualUnit}
                  onChange={(e) =>
                    setManualUnit(e.target.value as "g" | "kg")
                  }
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
              {manualWeight && !isNaN(parseFloat(manualWeight)) && (
                <div className="text-sm text-gray-600">
                  Price: $
                  {(
                    (manualUnit === "g"
                      ? parseFloat(manualWeight) / 1000
                      : parseFloat(manualWeight)) *
                    (selectedProduct.pricePerUnit || 0)
                  ).toFixed(2)}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualEntry(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualEntry} disabled={!manualWeight}>
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

