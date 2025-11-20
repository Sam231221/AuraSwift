/**
 * Receipt options modal component
 * Shown after cash payment completion
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Printer,
  Download,
  Mail,
  X,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { TransactionData } from "@/types/printer";

interface ReceiptOptionsModalProps {
  isOpen: boolean;
  transactionData: TransactionData | null;
  onPrint: () => void;
  onDownload: () => void;
  onEmail: () => void;
  onClose: () => void;
  onCancel: () => void;
}

export function ReceiptOptionsModal({
  isOpen,
  transactionData,
  onPrint,
  onDownload,
  onEmail,
  onClose,
  onCancel,
}: ReceiptOptionsModalProps) {
  if (!isOpen || !transactionData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          toast.warning(
            "Please select an option or click the X to skip receipt"
          );
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-linear-to-r from-green-500 to-emerald-600 p-6 relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:rotate-90 duration-200"
            aria-label="Skip receipt"
            title="Skip receipt"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4 text-white pr-12">
            <div className="p-3 bg-white/20 rounded-full">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-green-100 text-sm mt-1">
                Receipt #{transactionData.receiptNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Transaction Summary */}
          <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-slate-600 font-medium">Total Paid:</span>
              <span className="text-3xl font-bold text-slate-900">
                £{transactionData.total.toFixed(2)}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Cash Received:</span>
                <span className="font-semibold text-slate-700">
                  £{transactionData.amountPaid.toFixed(2)}
                </span>
              </div>
              {transactionData.change > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Change Given:</span>
                  <span className="font-bold text-green-600 text-lg">
                    £{transactionData.change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Options */}
          <div className="space-y-3">
            <p className="text-sm text-slate-600 font-medium mb-4 text-center">
              How would you like to receive the receipt?
            </p>

            {/* Print Receipt Button */}
            <Button
              onClick={onPrint}
              className="w-full h-16 bg-linear-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white flex items-center justify-between px-6 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Printer className="h-5 w-5" />
                </div>
                <span>Print Receipt</span>
              </div>
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Download Receipt Button */}
            <Button
              onClick={onDownload}
              variant="outline"
              className="w-full h-16 border-2 border-slate-300 hover:border-sky-400 hover:bg-sky-50 flex items-center justify-between px-6 text-base font-semibold transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-100 rounded-lg">
                  <Download className="h-5 w-5 text-sky-600" />
                </div>
                <span className="text-slate-700">Download PDF</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Button>

            {/* Email Receipt Button */}
            <Button
              onClick={onEmail}
              variant="outline"
              className="w-full h-16 border-2 border-slate-300 hover:border-purple-400 hover:bg-purple-50 flex items-center justify-between px-6 text-base font-semibold transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-slate-700">Email Receipt</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500">or</span>
              </div>
            </div>

            {/* Skip / Complete Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full h-14 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium transition-all"
            >
              No Receipt - Continue to Next Customer
            </Button>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-center text-slate-500">
              Transaction saved. You can print this receipt later from{" "}
              <span className="font-semibold">Transaction History</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
