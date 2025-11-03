import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ScanBarcode,
  ShoppingCart,
  Calculator,
  CreditCard,
  CheckCircle,
  Search,
  Plus,
  Minus,
  Trash2,
  Scale,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/use-auth";
import type { Product } from "@/types/product.types";
import { toast } from "sonner";
import { useProductionScanner } from "@/hooks/useProductionScanner";
import {
  ScannerStatusBar,
  ScanHistory,
} from "@/components/scanner/ScannerStatusComponents";
import { ScannerAudio } from "@/utils/scannerAudio";
import {
  useReceiptPrintingFlow,
  useThermalPrinter,
} from "@/hooks/useThermalPrinter";
import { ReceiptPrinterStatus } from "@/components/printer/ReceiptPrinterComponents";
import type { TransactionData, PrinterConfig } from "@/types/printer";
import { useCardPayment } from "@/hooks/useStripeTerminal";
import { PaymentStatusModal } from "@/components/payment/PaymentComponents";

interface CartItem {
  product: Product;
  quantity: number;
  weight?: number;
}

interface PaymentMethod {
  type: "cash" | "card" | "mobile" | "voucher" | "split";
  amount?: number;
}

const NewTransactionView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [cashAmount, setCashAmount] = useState(0);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [selectedWeightProduct, setSelectedWeightProduct] =
    useState<Product | null>(null);

  // Products from backend
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Scanner state
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Thermal printer integration for printing flow
  const {
    isShowingStatus,
    printStatus,
    printerInfo,
    // isConnected: printerConnected, // Unused variable
    startPrintingFlow,
    handleRetryPrint,
    handleSkipReceipt,
    handleEmailReceipt,
    handleNewSale,
  } = useReceiptPrintingFlow();

  // Separate hook for printer connection management
  const { connectPrinter: connectPrinterInternal } = useThermalPrinter();

  // Wrapper for connect printer with localStorage save
  const connectPrinter = useCallback(
    async (config: PrinterConfig): Promise<boolean> => {
      const result = await connectPrinterInternal(config);
      if (result) {
        // Save config for auto-reconnect
        localStorage.setItem("printer_config", JSON.stringify(config));
      }
      return result;
    },
    [connectPrinterInternal]
  );

  // Card payment integration
  const {
    // readerStatus, // Unused variable
    paymentState,
    isReady: cardReaderReady,
    processQuickPayment,
    cancelPayment,
    isProcessing: cardProcessing,
  } = useCardPayment();

  // Card payment modal state
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [_cardPaymentResult, setCardPaymentResult] = useState<{
    success: boolean;
    paymentIntent?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };
    error?: string;
  } | null>(null);

  // Hardware barcode scanner integration
  const handleHardwareScan = useCallback(
    async (barcode: string): Promise<boolean> => {
      console.log("🔍 Hardware scanner detected barcode:", barcode);

      // Search by barcode, PLU, or SKU
      const product = products.find(
        (p) =>
          p.id === barcode ||
          p.sku === barcode ||
          p.plu === barcode ||
          p.sku.toLowerCase() === barcode.toLowerCase()
      );

      if (product) {
        if (product.requiresWeight) {
          // For weight-based products, we need to handle this specially
          if (
            selectedWeightProduct?.id === product.id &&
            weightInput &&
            parseFloat(weightInput) > 0
          ) {
            // If we already have the weight input for this product
            addToCart(product, parseFloat(weightInput));
            setWeightInput("");
            setSelectedWeightProduct(null);
            return true;
          } else {
            // Set as selected weight product and prompt for weight
            setSelectedWeightProduct(product);
            toast.warning(
              `⚖️ Weight required for ${product.name}. Enter weight in ${
                product.unit || "units"
              } and scan again.`
            );
            return false; // Return false to play error sound and indicate incomplete scan
          }
        } else {
          // Normal product, add directly to cart
          addToCart(product);
          console.log("✅ Product added to cart:", product.name);
          return true; // Success!
        }
      } else {
        console.warn("❌ Product not found for barcode:", barcode);
        toast.error(`Product not found: ${barcode}`);
        return false; // Product not found
      }
    },
    [products, selectedWeightProduct, weightInput]
  );

  // Initialize scanner hook
  const {
    scannerStatus,
    scanLog,
    clearScanLog,
    reset: resetScanner,
  } = useProductionScanner({
    onScan: handleHardwareScan,
    enableAudio: audioEnabled,
    minBarcodeLength: 4, // Allow shorter codes for PLU
    maxBarcodeLength: 20, // Allow longer codes for various barcode formats
    scanTimeout: 250, // Slightly longer timeout for reliability
  });

  // Initialize audio on component mount
  useEffect(() => {
    if (audioEnabled) {
      ScannerAudio.init().catch(console.warn);
    }
  }, [audioEnabled]);

  // Load products from backend
  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await window.productAPI.getByBusiness(user.businessId);

      if (response.success && response.products) {
        // Filter to only active products
        const activeProducts = response.products.filter(
          (product) => product.isActive
        );
        setProducts(activeProducts);
      } else {
        const errorMessage =
          "message" in response
            ? String(response.message)
            : "Failed to load products";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Failed to load products");
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-connect to printer on component mount
  useEffect(() => {
    const initPrinter = async () => {
      try {
        // Check if printer config exists in local storage
        const savedConfig = localStorage.getItem("printer_config");

        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          const status = await window.printerAPI.getStatus();

          if (!status.connected) {
            console.log("🖨️ Auto-connecting to saved printer configuration...");
            const result = await connectPrinter(config);
            if (result) {
              console.log("✅ Printer auto-connected successfully");
            } else {
              console.warn("⚠️ Failed to auto-connect printer");
            }
          } else {
            console.log("✅ Printer already connected");
          }
        } else {
          console.log(
            "ℹ️ No saved printer configuration. Manual setup required."
          );
          // Show a one-time info message
          const hasSeenPrinterInfo = localStorage.getItem("printer_info_shown");
          if (!hasSeenPrinterInfo) {
            toast.info(
              "💡 Tip: Configure your receipt printer in Settings → Hardware for automatic printing",
              {
                duration: 8000,
              }
            );
            localStorage.setItem("printer_info_shown", "true");
          }
        }
      } catch (error) {
        console.error("❌ Printer auto-connect failed:", error);
        // Don't show error toast on startup - it's not critical
      }
    };

    initPrinter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - connectPrinter is stable

  // Filtered products for search
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.plu?.includes(searchQuery) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total
  const subtotal = cart.reduce((sum, item) => {
    let itemPrice = item.product.price;

    // For weight-based products, use pricePerUnit if available
    if (item.product.requiresWeight && item.product.pricePerUnit) {
      itemPrice = item.product.pricePerUnit;
    }

    const itemTotal = itemPrice * (item.quantity || 1) * (item.weight || 1);
    return sum + itemTotal;
  }, 0);

  const tax = subtotal * 0.08; // Example tax rate
  const total = subtotal + tax;

  // Functions for cart operations
  const addToCart = (product: Product, weight?: number) => {
    console.log(
      "🛒 Adding to cart:",
      product.name,
      weight ? `(${weight} ${product.unit})` : ""
    );

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        const newWeight = product.requiresWeight
          ? (existingItem.weight || 0) + (weight || 0)
          : undefined;

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          weight: newWeight,
        };

        // Show success toast for scanner feedback
        toast.success(
          `Added ${product.name} (${newQuantity}x)${
            product.requiresWeight && newWeight
              ? ` - ${newWeight.toFixed(2)} ${product.unit}`
              : ""
          }`
        );

        return updatedCart;
      } else {
        const newItem = {
          product,
          quantity: 1,
          weight: product.requiresWeight ? weight : undefined,
        };

        // Show success toast for scanner feedback
        toast.success(
          `Added ${product.name}${
            product.requiresWeight && weight
              ? ` - ${weight.toFixed(2)} ${product.unit}`
              : ""
          }`
        );

        return [...prevCart, newItem];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId)
    );
  };

  const handleBarcodeScan = () => {
    if (barcodeInput.trim() === "") return;

    // Search by ID, SKU, or PLU
    const product = products.find(
      (p) =>
        p.id === barcodeInput ||
        p.sku === barcodeInput ||
        p.plu === barcodeInput
    );

    if (product) {
      if (product.requiresWeight) {
        if (weightInput && parseFloat(weightInput) > 0) {
          addToCart(product, parseFloat(weightInput));
          setWeightInput("");
          setSelectedWeightProduct(null);
        } else {
          setSelectedWeightProduct(product);
          toast.error(
            `Please enter weight in ${product.unit || "units"} for ${
              product.name
            }`
          );
        }
      } else {
        addToCart(product);
      }
      setBarcodeInput("");
    } else {
      toast.error("Product not found");
    }
  };

  const handlePayment = async (method: PaymentMethod["type"]) => {
    // Reset any previous payment state before starting new payment
    setCardPaymentResult(null);
    setShowCardPayment(false);

    setPaymentMethod({ type: method });

    if (method === "cash") {
      setCashAmount(total);
    } else if (method === "card" || method === "mobile") {
      // Start card payment flow
      await handleCardPayment();
    }
  };

  const handleCardPayment = async () => {
    try {
      if (!cardReaderReady) {
        toast.error("Card reader not ready. Please check connection.");
        return;
      }

      setShowCardPayment(true);

      // Convert total from dollars to cents
      const amountInCents = Math.round(total * 100);

      console.log("💳 Starting card payment:", {
        amount: amountInCents,
        total: total,
        currency: "gbp",
      });

      const result = await processQuickPayment(amountInCents, "gbp");

      setCardPaymentResult(result);

      if (result.success) {
        toast.success("Card payment successful!");

        // Automatically complete the transaction
        await completeTransactionWithCardPayment(result);
      } else {
        toast.error(`Card payment failed: ${result.error}`);
        // Reset payment state on failure
        setShowCardPayment(false);
        setPaymentMethod(null);
        setPaymentStep(false);
      }
    } catch (error) {
      console.error("Card payment error:", error);
      toast.error("Card payment failed");
      // Reset payment state on error
      setShowCardPayment(false);
      setPaymentMethod(null);
      setPaymentStep(false);
      setCardPaymentResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const completeTransactionWithCardPayment = async (_cardResult: {
    paymentIntent?: {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };
  }) => {
    // Continue with the existing transaction completion logic
    // but skip the payment validation since card payment is already processed
    await completeTransaction(true);
  };

  const completeTransaction = async (skipPaymentValidation = false) => {
    // Check printer status before completing transaction
    if (window.printerAPI) {
      try {
        const printerStatus = await window.printerAPI.getStatus();

        if (!printerStatus.connected) {
          const proceed = window.confirm(
            "⚠️ Printer is not connected. Receipt cannot be printed.\n\n" +
              "Do you want to complete the transaction without printing a receipt?\n" +
              "You can manually print the receipt later from transaction history."
          );

          if (!proceed) {
            toast.warning(
              "Transaction cancelled. Please connect printer first."
            );
            return;
          }

          toast.warning("Transaction will complete without printed receipt.", {
            duration: 5000,
          });
        }
      } catch (error) {
        console.error("Failed to check printer status:", error);
        // Continue anyway - don't block transaction on printer status check failure
      }
    }

    // Validate payment method (skip for card payments already processed)
    if (!skipPaymentValidation) {
      if (!paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }

      // Validate cash payment
      if (paymentMethod.type === "cash") {
        if (cashAmount < total) {
          toast.error(
            `Insufficient cash. Need £${(total - cashAmount).toFixed(2)} more.`
          );
          return;
        }

        if (cashAmount <= 0) {
          toast.error("Please enter a valid cash amount");
          return;
        }
      }
    }

    // Validate cart
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!user?.businessId) {
      toast.error("No business ID found");
      return;
    }

    try {
      // Get active shift for the cashier
      const shiftResponse = await window.shiftAPI.getActive(user.id);
      if (!shiftResponse.success || !shiftResponse.data) {
        toast.error("No active shift found. Please start your shift first.");
        return;
      }

      const activeShift = shiftResponse.data as { id: string };

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}`;

      // Prepare transaction items
      const transactionItems = cart.map((item) => {
        let unitPrice = item.product.price;
        let totalPrice = item.product.price * item.quantity;

        // Handle weight-based products
        if (
          item.product.requiresWeight &&
          item.weight &&
          item.product.pricePerUnit
        ) {
          unitPrice = item.product.pricePerUnit;
          totalPrice = item.product.pricePerUnit * item.weight * item.quantity;
        }

        return {
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      // Map payment method to backend format
      let backendPaymentMethod: "cash" | "card" | "mixed";
      if (skipPaymentValidation) {
        // Card payment already processed
        backendPaymentMethod = "card";
      } else if (paymentMethod?.type === "cash") {
        backendPaymentMethod = "cash";
      } else if (
        paymentMethod?.type === "card" ||
        paymentMethod?.type === "mobile"
      ) {
        backendPaymentMethod = "card";
      } else {
        backendPaymentMethod = "mixed"; // For voucher/split payments
      }

      // Create transaction
      const transactionResponse = await window.transactionAPI.create({
        shiftId: activeShift.id,
        businessId: user.businessId,
        type: "sale",
        subtotal,
        tax,
        total,
        paymentMethod: backendPaymentMethod,
        cashAmount: skipPaymentValidation
          ? undefined
          : paymentMethod?.type === "cash"
          ? cashAmount
          : undefined,
        cardAmount: skipPaymentValidation
          ? total
          : paymentMethod?.type === "card" || paymentMethod?.type === "mobile"
          ? total
          : undefined,
        items: transactionItems,
        status: "completed",
        receiptNumber,
        timestamp: new Date().toISOString(),
      });

      if (!transactionResponse.success) {
        toast.error("Failed to record transaction");
        return;
      }

      setTransactionComplete(true);

      // Prepare receipt data for thermal printing
      const receiptData: TransactionData = {
        id: receiptNumber,
        timestamp: new Date(),
        cashierId: user.id,
        cashierName: `${user.firstName} ${user.lastName}`,
        businessId: user.businessId,
        businessName: user.businessName,
        items: cart.map((item) => {
          let unitPrice = item.product.price;
          let itemTotal = item.product.price * item.quantity;

          if (
            item.product.requiresWeight &&
            item.weight &&
            item.product.pricePerUnit
          ) {
            unitPrice = item.product.pricePerUnit;
            itemTotal = item.product.pricePerUnit * item.weight * item.quantity;
          }

          return {
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: unitPrice,
            total: itemTotal,
            sku: item.product.sku || "",
            category: item.product.category || "",
          };
        }),
        subtotal,
        tax,
        discount: 0,
        total,
        amountPaid: skipPaymentValidation
          ? total
          : paymentMethod?.type === "cash"
          ? cashAmount
          : total,
        change: skipPaymentValidation
          ? 0
          : paymentMethod?.type === "cash"
          ? Math.max(0, cashAmount - total)
          : 0,
        paymentMethods: [
          {
            type: skipPaymentValidation
              ? "card"
              : paymentMethod?.type === "mobile"
              ? "digital"
              : paymentMethod?.type === "voucher" ||
                paymentMethod?.type === "split"
              ? "other"
              : paymentMethod?.type || "cash",
            amount: skipPaymentValidation
              ? total
              : paymentMethod?.type === "cash"
              ? cashAmount
              : total,
          },
        ],
        receiptNumber,
      };

      // Start thermal printing flow with enhanced error handling
      try {
        const printResult = await startPrintingFlow(receiptData);

        if (!printResult) {
          // Print failed but transaction is already saved
          toast.error(
            "⚠️ Receipt failed to print. Transaction saved. You can reprint from transaction history.",
            { duration: 10000 }
          );
        }
      } catch (printError) {
        console.error("Print error:", printError);
        toast.error(
          "⚠️ Receipt printing error. Transaction completed but receipt not printed. Check printer connection.",
          { duration: 10000 }
        );
      }

      // Show success message with payment details
      if (skipPaymentValidation) {
        toast.success("Transaction complete! Paid by card");
      } else if (paymentMethod?.type === "cash") {
        const change = cashAmount - total;
        if (change > 0) {
          toast.success(`Transaction complete! Change: £${change.toFixed(2)}`);
        } else {
          toast.success("Transaction complete! Exact change received.");
        }
      } else {
        toast.success(`Transaction complete! Paid by ${paymentMethod?.type}`);
      }

      // TODO: Update inventory levels for sold products
      // TODO: Open cash drawer for cash payments
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to complete transaction");
      return;
    }

    // Only reset automatically if no printer modal is showing
    if (!isShowingStatus) {
      setTimeout(() => {
        // Reset for next customer
        setCart([]);
        setPaymentStep(false);
        setPaymentMethod(null);
        setTransactionComplete(false);
        setCashAmount(0);
        setShowCardPayment(false);
        setCardPaymentResult(null);
      }, 3000);
    }
  };

  // Wrapper function for button click
  const handleCompleteTransaction = () => {
    completeTransaction();
  };

  const navigate = useNavigate();

  if (!user) {
    navigate("/");
    return;
  }

  return (
    <>
      <Button className="mb-2" onClick={onBack}>
        {" "}
        Go to dashboard
      </Button>

      {/* Hardware Scanner Status Bar */}
      {/* <ScannerStatusBar
        scannerStatus={scannerStatus}
        audioEnabled={audioEnabled}
        onToggleAudio={() => {
          setAudioEnabled(!audioEnabled);
          ScannerAudio.setEnabled(!audioEnabled);
        }}
        onReset={resetScanner}
        className="mb-4"
      /> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Scanning & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 py-2">
              <CardTitle className="flex text-sm items-center gap-2 text-slate-700">
                <ScanBarcode className="h-4 w-4 text-green-600" />
                Scan Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode or PLU code"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                  className="bg-white text-sm border-slate-300"
                />
                <Button
                  onClick={handleBarcodeScan}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Scan
                </Button>
              </div>

              <div
                className={`mt-1 flex items-center gap-2 p-2 rounded ${
                  selectedWeightProduct
                    ? "bg-blue-50 border border-blue-200"
                    : ""
                }`}
              >
                <Scale
                  className={`h-4 w-4 ${
                    selectedWeightProduct ? "text-blue-600" : "text-slate-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    selectedWeightProduct
                      ? "text-blue-700 font-medium"
                      : "text-slate-600"
                  }`}
                >
                  {selectedWeightProduct
                    ? `Weight for ${selectedWeightProduct.name}:`
                    : "Weight (for produce):"}
                </span>
                <Input
                  type="number"
                  placeholder={
                    selectedWeightProduct
                      ? `Enter weight in ${
                          selectedWeightProduct.unit || "units"
                        }`
                      : "Enter weight"
                  }
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className={`w-24 ${
                    selectedWeightProduct
                      ? "border-blue-300"
                      : "border-slate-300"
                  } bg-white`}
                />
                <span
                  className={`text-sm ${
                    selectedWeightProduct
                      ? "text-blue-600 font-medium"
                      : "text-slate-600"
                  }`}
                >
                  {selectedWeightProduct?.unit || "units"}
                </span>
                {selectedWeightProduct && (
                  <>
                    {weightInput && parseFloat(weightInput) > 0 && (
                      <Button
                        size="sm"
                        onClick={() => {
                          addToCart(
                            selectedWeightProduct,
                            parseFloat(weightInput)
                          );
                          setWeightInput("");
                          setSelectedWeightProduct(null);
                        }}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add to Cart
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedWeightProduct(null);
                        setWeightInput("");
                      }}
                      className="h-8 px-2 text-slate-600 hover:text-slate-800"
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 py-2">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <Search className="h-5 w-5 text-green-600" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Input
                placeholder="Search products by name or PLU"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-slate-300 mb-4"
              />

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-600">
                    Loading products...
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div className="ml-2">
                    <p className="text-red-600">Failed to load products</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadProducts}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-slate-500">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        variant="outline"
                        className={`h-auto py-3 flex flex-col items-center w-full transition-all ${
                          selectedWeightProduct?.id === product.id
                            ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          if (product.requiresWeight) {
                            if (weightInput && parseFloat(weightInput) > 0) {
                              addToCart(product, parseFloat(weightInput));
                              setWeightInput("");
                              setSelectedWeightProduct(null);
                            } else {
                              setSelectedWeightProduct(product);
                              toast.error(
                                `Please enter weight in ${
                                  product.unit || "units"
                                } for ${product.name}`
                              );
                            }
                          } else {
                            addToCart(product);
                          }
                        }}
                      >
                        <span className="font-medium text-slate-800">
                          {product.name}
                        </span>
                        <span className="text-sm text-green-600 font-semibold">
                          {product.requiresWeight && product.pricePerUnit
                            ? `£${product.pricePerUnit.toFixed(2)}/${
                                product.unit
                              }`
                            : `£${product.price.toFixed(2)}`}
                        </span>
                        <div className="flex gap-1 mt-1 flex-wrap justify-center">
                          {product.requiresWeight && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-300 text-xs"
                            >
                              <Scale className="h-3 w-3 mr-1" />
                              {product.unit || "weight"}
                            </Badge>
                          )}
                          {product.plu && (
                            <Badge
                              variant="secondary"
                              className="bg-slate-100 text-slate-600 text-xs"
                            >
                              PLU: {product.plu}
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="mt-1 bg-slate-100 text-slate-600"
                        >
                          SKU: {product.sku}
                        </Badge>
                        {product.requiresWeight && (
                          <div className="flex items-center mt-1 text-xs text-slate-500">
                            <Scale className="h-3 w-3 mr-1" />
                            Weight
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart & Payment */}
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 py-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Shopping Cart
              </CardTitle>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {cart.length} items
              </Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-400 text-center py-4"
                  >
                    No items in cart. Scan or search for products.
                  </motion.p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">
                            {item.product.name}
                          </div>
                          {item.product.requiresWeight && item.weight && (
                            <div className="text-sm text-slate-500">
                              Weight: {item.weight.toFixed(2)}{" "}
                              {item.product.unit || "lbs"}
                            </div>
                          )}
                          <div className="text-sm text-slate-500">
                            {item.product.requiresWeight &&
                            item.product.pricePerUnit
                              ? `£${item.product.pricePerUnit.toFixed(2)} per ${
                                  item.product.unit
                                }`
                              : `£${item.product.price.toFixed(2)} each`}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {item.product.requiresWeight &&
                            item.weight &&
                            item.product.pricePerUnit ? (
                              <>
                                £
                                {(
                                  item.product.pricePerUnit *
                                  item.weight *
                                  item.quantity
                                ).toFixed(2)}
                                <span className="text-xs text-slate-500 ml-1">
                                  ({item.weight.toFixed(2)} {item.product.unit}{" "}
                                  × {item.quantity})
                                </span>
                              </>
                            ) : (
                              <>
                                £
                                {(item.product.price * item.quantity).toFixed(
                                  2
                                )}
                                <span className="text-xs text-slate-500 ml-1">
                                  (× {item.quantity})
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="h-7 w-7 p-0 border-slate-300"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="text-sm w-6 text-center font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="h-7 w-7 p-0 border-slate-300"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between mb-1 text-slate-700">
                  <span>Subtotal:</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1 text-slate-500">
                  <span>Tax (8%):</span>
                  <span>£{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t border-slate-200 text-green-700">
                  <span>Total:</span>
                  <span>£{total.toFixed(2)}</span>
                </div>

                {!paymentStep ? (
                  <Button
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 h-11 text-lg"
                    onClick={() => setPaymentStep(true)}
                    disabled={cart.length === 0}
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    Checkout
                  </Button>
                ) : (
                  <Button
                    className="w-full mt-4 bg-slate-200 hover:bg-slate-300 text-slate-700 h-11"
                    onClick={() => setPaymentStep(false)}
                  >
                    Back to Cart
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hardware Scanner History */}
          {scanLog.length > 0 && (
            <ScanHistory
              scanLog={scanLog}
              onClearLog={clearScanLog}
              maxVisible={3}
            />
          )}

          {/* Payment Section */}
          {paymentStep && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 py-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      Payment Method
                    </div>
                    {/* Card Reader Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          cardReaderReady ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span
                        className={
                          cardReaderReady ? "text-green-600" : "text-red-600"
                        }
                      >
                        Card Reader {cardReaderReady ? "Ready" : "Not Ready"}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {!paymentMethod ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                        onClick={() => handlePayment("cash")}
                      >
                        <div className="flex flex-col items-center">
                          <span>Cash</span>
                          <span className="text-xs text-slate-500">
                            Physical currency
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className={`h-16 border-slate-300 text-slate-700 ${
                          cardReaderReady
                            ? "bg-white hover:bg-slate-50"
                            : "bg-gray-100 cursor-not-allowed opacity-60"
                        }`}
                        onClick={() => handlePayment("card")}
                        disabled={!cardReaderReady}
                      >
                        <div className="flex flex-col items-center">
                          <span>Card</span>
                          <span className="text-xs text-slate-500">
                            {cardReaderReady
                              ? "Credit/Debit"
                              : "Reader Not Ready"}
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                        onClick={() => handlePayment("mobile")}
                      >
                        <div className="flex flex-col items-center">
                          <span>Mobile Pay</span>
                          <span className="text-xs text-slate-500">
                            Apple/Google Pay
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                        onClick={() => handlePayment("voucher")}
                      >
                        <div className="flex flex-col items-center">
                          <span>Voucher</span>
                          <span className="text-xs text-slate-500">
                            Gift card/Coupon
                          </span>
                        </div>
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {paymentMethod.type === "cash" && (
                        <div className="space-y-4">
                          <div className="flex justify-between text-slate-700">
                            <span>Amount Due:</span>
                            <span className="font-semibold">
                              £{total.toFixed(2)}
                            </span>
                          </div>

                          <div>
                            <label className="text-sm text-slate-600">
                              Cash Received:
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter cash amount"
                              value={cashAmount || ""}
                              onChange={(e) =>
                                setCashAmount(parseFloat(e.target.value) || 0)
                              }
                              className={`mt-1 ${
                                cashAmount > 0 && cashAmount < total
                                  ? "border-red-300 bg-red-50"
                                  : "bg-white border-slate-300"
                              }`}
                            />
                            {cashAmount > 0 && cashAmount < total && (
                              <p className="text-red-600 text-sm mt-1">
                                Insufficient funds. Need £
                                {(total - cashAmount).toFixed(2)} more.
                              </p>
                            )}
                          </div>

                          <div
                            className={`flex justify-between font-bold text-lg pt-2 border-t border-slate-200 ${
                              cashAmount >= total
                                ? "text-green-700"
                                : cashAmount > 0
                                ? "text-red-600"
                                : "text-slate-600"
                            }`}
                          >
                            <span>Change:</span>
                            <span>
                              {cashAmount >= total
                                ? `£${(cashAmount - total).toFixed(2)}`
                                : cashAmount > 0
                                ? `-£${(total - cashAmount).toFixed(2)}`
                                : "£0.00"}
                            </span>
                          </div>

                          {/* Quick cash amount buttons */}
                          <div className="grid grid-cols-4 gap-2">
                            {[5, 10, 20, 50].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => setCashAmount(amount)}
                                className="text-xs h-8"
                              >
                                £{amount}
                              </Button>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCashAmount(total)}
                              className="flex-1 text-xs"
                            >
                              Exact Amount
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCashAmount(Math.ceil(total))}
                              className="flex-1 text-xs"
                            >
                              Round Up
                            </Button>
                          </div>
                        </div>
                      )}

                      {paymentMethod.type !== "cash" && (
                        <div className="text-center py-4">
                          <p className="text-slate-700">
                            Processing {paymentMethod.type} payment...
                          </p>
                          <Progress value={50} className="mt-4 bg-slate-200" />
                        </div>
                      )}

                      <Button
                        className={`w-full mt-4 h-11 text-lg ${
                          paymentMethod?.type === "cash" && cashAmount < total
                            ? "bg-slate-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={handleCompleteTransaction}
                        disabled={
                          paymentMethod?.type === "cash" &&
                          (cashAmount < total || cashAmount <= 0)
                        }
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {paymentMethod?.type === "cash" && cashAmount < total
                          ? `Need £${(total - cashAmount).toFixed(2)} More`
                          : "Complete Transaction"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Transaction Complete Message */}
          {transactionComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white p-6 rounded-lg text-center max-w-sm"
              >
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2 text-slate-800">
                  Transaction Complete!
                </h2>
                <p className="text-slate-600">
                  Thank you for shopping with us.
                </p>
                <p className="mt-2 text-slate-700 font-semibold">
                  Total: £{total.toFixed(2)}
                </p>
                <Button
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => setTransactionComplete(false)}
                >
                  OK
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Receipt Printer Status Modal */}
      {isShowingStatus && !showCardPayment && (
        <ReceiptPrinterStatus
          printStatus={printStatus}
          printerInfo={printerInfo || undefined}
          onRetryPrint={handleRetryPrint}
          onSkipReceipt={handleSkipReceipt}
          onEmailReceipt={handleEmailReceipt}
          onNewSale={() => {
            handleNewSale();
            // Reset transaction state
            setCart([]);
            setPaymentStep(false);
            setPaymentMethod(null);
            setTransactionComplete(false);
            setCashAmount(0);
          }}
        />
      )}

      {/* Card Payment Status Modal */}
      {showCardPayment && (
        <PaymentStatusModal
          isOpen={true}
          paymentState={{
            step: paymentState.step,
            message: paymentState.message,
            canCancel: paymentState.canCancel,
            progress: paymentState.progress,
          }}
          amount={Math.round(total * 100)} // Convert to cents
          onCancel={async () => {
            if (cardProcessing) {
              await cancelPayment();
            }
            // Fully reset payment state
            setShowCardPayment(false);
            setCardPaymentResult(null);
            setPaymentMethod(null);
            setPaymentStep(false);
          }}
          onRetry={async () => {
            setCardPaymentResult(null);
            await handleCardPayment();
          }}
          onClose={() => {
            setShowCardPayment(false);
            setCardPaymentResult(null);
            setPaymentMethod(null);
            setPaymentStep(false);
          }}
        />
      )}
    </>
  );
};

export default NewTransactionView;
