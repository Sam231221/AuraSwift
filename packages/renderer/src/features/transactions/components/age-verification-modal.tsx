import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/features/products/types/product.types";

interface AgeVerificationModalProps {
  isOpen: boolean;
  product: Product;
  onVerify: (verified: boolean) => void;
  onCancel: () => void;
  currentUser: { id: string; role: string } | null;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  isOpen,
  product,
  onVerify,
  onCancel,
  currentUser,
}) => {
  const [verificationMethod, setVerificationMethod] = useState<
    "manual" | "scan" | "override"
  >("manual");
  const [birthdate, setBirthdate] = useState("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  // Get minimum age from restriction level
  const getMinimumAge = (level: string): number => {
    switch (level) {
      case "AGE_16":
        return 16;
      case "AGE_18":
        return 18;
      case "AGE_21":
        return 21;
      default:
        return 0;
    }
  };

  const requiredAge = getMinimumAge(product.ageRestrictionLevel || "NONE");

  const calculateAge = (dateString: string): number | null => {
    if (!dateString) return null;

    const birth = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const handleDateChange = (date: string) => {
    setBirthdate(date);
    const age = calculateAge(date);
    setCalculatedAge(age);
  };

  const handleVerify = () => {
    if (verificationMethod === "manual") {
      if (!birthdate || !calculatedAge) {
        toast.error("Please enter customer date of birth");
        return;
      }

      if (calculatedAge < requiredAge) {
        toast.error(
          `Customer is ${calculatedAge} years old. Minimum age required: ${requiredAge}`
        );
        return;
      }

      onVerify(true);
    } else if (verificationMethod === "scan") {
      // TODO: Implement ID scanner integration
      toast.info("ID scanner integration coming soon");
      // For now, allow manual entry
      if (!birthdate || !calculatedAge) {
        toast.error("Please enter customer date of birth");
        return;
      }
      onVerify(true);
    } else if (verificationMethod === "override") {
      if (!overrideReason.trim()) {
        toast.error("Please provide a reason for override");
        return;
      }

      if (currentUser?.role !== "manager" && currentUser?.role !== "admin") {
        toast.error("Only managers can override age verification");
        return;
      }

      onVerify(true);
    }
  };

  const isEligible = calculatedAge !== null && calculatedAge >= requiredAge;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            This product requires age verification ({requiredAge}+)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Info */}
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="font-semibold text-slate-900">{product.name}</p>
            <Badge
              variant="outline"
              className="mt-1 bg-orange-50 text-orange-700 border-orange-200"
            >
              {product.ageRestrictionLevel}
            </Badge>
            {product.restrictionReason && (
              <p className="text-sm text-slate-600 mt-1">
                {product.restrictionReason}
              </p>
            )}
          </div>

          {/* Verification Method Selection */}
          <div className="space-y-2">
            <Label>Verification Method</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={verificationMethod === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setVerificationMethod("manual")}
              >
                Manual
              </Button>
              <Button
                variant={verificationMethod === "scan" ? "default" : "outline"}
                size="sm"
                onClick={() => setVerificationMethod("scan")}
                disabled={true} // TODO: Enable when ID scanner is integrated
              >
                ID Scan
              </Button>
              <Button
                variant={
                  verificationMethod === "override" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setVerificationMethod("override")}
                disabled={
                  currentUser?.role !== "manager" &&
                  currentUser?.role !== "admin"
                }
              >
                Override
              </Button>
            </div>
          </div>

          {/* Manual Entry */}
          {verificationMethod === "manual" && (
            <div className="space-y-2">
              <Label htmlFor="birthdate">Customer Date of Birth</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full"
              />

              {calculatedAge !== null && (
                <div
                  className={`p-3 rounded-lg ${
                    isEligible
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isEligible ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-semibold">
                        Age: {calculatedAge} years
                      </span>
                    </div>
                    <Badge
                      variant={isEligible ? "default" : "destructive"}
                      className={
                        isEligible
                          ? "bg-green-600"
                          : "bg-red-600"
                      }
                    >
                      {isEligible
                        ? "Eligible to purchase"
                        : "Below required age"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ID Scan */}
          {verificationMethod === "scan" && (
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-slate-600">
                ID Scanner integration coming soon. Please use manual entry for
                now.
              </p>
              <div className="mt-3 space-y-2">
                <Label htmlFor="scan-birthdate">Customer Date of Birth</Label>
                <Input
                  id="scan-birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full"
                />
                {calculatedAge !== null && (
                  <p className="text-sm font-semibold">
                    Age: {calculatedAge} years
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manager Override */}
          {verificationMethod === "override" && (
            <div className="space-y-2">
              <Label htmlFor="override-reason">Override Reason</Label>
              <Input
                id="override-reason"
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Parent present, Valid ID shown, etc."
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Manager override will be logged for audit purposes.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={
              verificationMethod === "manual" && !isEligible
            }
            className={
              verificationMethod === "override"
                ? "bg-orange-600 hover:bg-orange-700"
                : ""
            }
          >
            {verificationMethod === "override"
              ? "Override & Continue"
              : "Verify & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

