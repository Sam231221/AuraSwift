import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  CreditCard,
  CheckCircle,
  Search,
  Trash2,
  Scale,
  AlertCircle,
  Loader2,
  ChevronRight,
  Home,
  Package,
  Printer,
  Download,
  Mail,
  X,
  RotateCcw,
  XCircle,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/use-auth";
import type { Product } from "@/features/products/types/product.types";
import { toast } from "sonner";
import { useProductionScanner } from "@/shared/hooks/use-production-scanner";

import { ScannerAudio } from "@/shared/services/scanner-audio";
import {
  useReceiptPrintingFlow,
  useThermalPrinter,
} from "@/features/transactions/hooks/use-thermal-printer";
import { ReceiptPrinterStatus } from "./receipt-printer-components";
import type { TransactionData, PrinterConfig } from "@/types/printer";
import { useCardPayment } from "@/features/transactions/hooks/use-stripe-terminal";
import { PaymentStatusModal } from "./payment-components";
import RefundTransactionView from "./refund-transaction-view";
import VoidTransactionModal from "./void-transaction-view";
import CashDrawerCountModal from "./cash-drawer-count-modal";
import { QuickActionButtons } from "./quick-actions-buttons";
import { NumericKeypad } from "./numeric-keypad";

interface CartItem {
  product: Product;
  quantity: number;
  weight?: number;
}

interface PaymentMethod {
  type: "cash" | "card" | "mobile" | "voucher" | "split";
  amount?: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

// Quick Actions Carousel Component
interface QuickActionsCarouselProps {
  onRefund: () => void;
  onVoid: () => void;
  onCount: () => void;
  onDashboard: () => void;
}

const CarouselCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  hoverColor: string;
}> = ({ icon: Icon, title, onClick, hoverColor }) => (
  <button
    onClick={onClick}
    className={`shrink-0 basis-1/3 w-16 h-16 p-2 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-1  transition-all hover:shadow-md ${hoverColor}`}
    style={{ minWidth: "0" }}
  >
    <Icon className="w-6 h-6" />
    <span className="text-sm">{title}</span>
  </button>
);

const QuickActionsCarousel: React.FC<QuickActionsCarouselProps> = ({
  onRefund,
  onVoid,
  onCount,
  onDashboard,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [dragEnd, setDragEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const items = [
    {
      icon: RotateCcw,
      title: "Refund",
      onClick: onRefund,
      hoverColor: "hover:bg-blue-50",
    },
    {
      icon: XCircle,
      title: "Void",
      onClick: onVoid,
      hoverColor: "hover:bg-red-50",
    },
    {
      icon: Calculator,
      title: "Count",
      onClick: onCount,
      hoverColor: "hover:bg-green-50",
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      onClick: onDashboard,
      hoverColor: "hover:bg-purple-50",
    },
  ];

  const itemsPerView = 4;
  const maxIndex = Math.max(0, items.length - itemsPerView);
  const minSwipeDistance = 50;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    setDragEnd(0);
    setDragStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setDragEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse events for trackpad/mouse support
  const onMouseDown = (e: React.MouseEvent) => {
    setDragEnd(0);
    setDragStart(e.clientX);
    setIsDragging(true);
    e.preventDefault(); // Prevent text selection
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    handleDragEnd();
  };

  const onMouseLeave = () => {
    if (!isDragging) return;
    handleDragEnd();
  };

  const handleDragEnd = () => {
    if (!dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const distance = dragStart - dragEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < maxIndex) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }

    setIsDragging(false);
    setDragStart(0);
    setDragEnd(0);
  };

  // Calculate exact transform based on container width
  const getTransform = () => {
    if (!containerRef.current) return "translateX(0)";

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;

    // Each card takes up 1/3 of the container width (for 3 items view)
    // Plus we need to account for gaps between items
    const cardWidth = containerWidth / itemsPerView;
    const offset = currentIndex * cardWidth;

    return `translateX(-${offset}px)`;
  };

  return (
    <div className="mb-4 p-2 bg-white rounded-lg shadow-sm">
      <div className="flex items-center w-full gap-2">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="shrink-0 w-8 h-16 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          style={{
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 30% 100%, 0 50%)",
          }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700 rotate-180" />
        </button>

        {/* Carousel Container */}
        <div
          ref={containerRef}
          className="overflow-hidden flex-1 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <div
            className="flex gap-2 transition-transform duration-300 ease-in-out"
            style={{
              transform: getTransform(),
              width: `${(items.length / itemsPerView) * 100}%`,
            }}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="shrink-0"
                style={{
                  width: `calc(${100 / items.length}% - ${
                    ((items.length - 1) * 0.5) / items.length
                  }rem)`,
                }}
              >
                <CarouselCard
                  icon={item.icon}
                  title={item.title}
                  onClick={item.onClick}
                  hoverColor={item.hoverColor}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={currentIndex === maxIndex}
          className="shrink-0 w-8 h-16 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          style={{
            clipPath: "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)",
          }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
  // ...existing code...
};

//const NewTransactionView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
const NewTransactionView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchQuery] = useState("");
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

  // Categories from backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null
  );
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([
    { id: null, name: "All Categories" },
  ]);

  const { user, logout } = useAuth();

  // Scanner state
  const [audioEnabled] = useState(true);

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

  // Receipt options modal state (for cash payments)
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [completedTransactionData, setCompletedTransactionData] =
    useState<TransactionData | null>(null);

  // Quick action modals state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);

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
  const { scanLog, clearScanLog } = useProductionScanner({
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

  // Load categories from backend
  const loadCategories = useCallback(async () => {
    if (!user?.businessId) return;

    try {
      const response = await window.categoryAPI.getByBusiness(user.businessId);
      if (response.success && response.categories) {
        // Filter to only active categories
        const activeCategories = response.categories.filter(
          (cat) => cat.isActive
        );
        setCategories(activeCategories);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Failed to load categories");
    }
  }, [user?.businessId]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Category navigation functions
  const handleCategoryClick = (category: Category) => {
    setCurrentCategoryId(category.id);
    setBreadcrumb([...breadcrumb, { id: category.id, name: category.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentCategoryId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  // Get current level categories (top-level or children of current category)
  const currentCategories = categories
    .filter((cat) =>
      currentCategoryId === null
        ? !cat.parentId
        : cat.parentId === currentCategoryId
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Get products for current category (including subcategories)
  const getCurrentCategoryProducts = (): Product[] => {
    if (currentCategoryId === null) {
      // Show all products when at root
      return products;
    }

    // Get all descendant category IDs
    const getDescendantIds = (catId: string): string[] => {
      const children = categories.filter((c) => c.parentId === catId);
      return [
        catId,
        ...children.flatMap((child) => getDescendantIds(child.id)),
      ];
    };

    const categoryIds = getDescendantIds(currentCategoryId);
    return products.filter((p) => categoryIds.includes(p.category));
  };

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

      if (result.success) {
        toast.success("Card payment successful!");

        // Automatically complete the transaction
        await completeTransactionWithCardPayment();
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
    }
  };

  const completeTransactionWithCardPayment = async () => {
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

      // For cash payments, show receipt options modal instead of auto-printing
      if (!skipPaymentValidation && paymentMethod?.type === "cash") {
        setCompletedTransactionData(receiptData);
        setTransactionComplete(true);
        setShowReceiptOptions(true);

        // Show success message with payment details
        const change = cashAmount - total;
        if (change > 0) {
          toast.success(`Transaction complete! Change: £${change.toFixed(2)}`);
        } else {
          toast.success("Transaction complete! Exact change received.");
        }

        // TODO: Update inventory levels for sold products
        // TODO: Open cash drawer for cash payments
        return; // Don't proceed with auto-printing
      }

      // Start thermal printing flow with enhanced error handling (for card/other payments)
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
      }, 3000);
    }
  };

  // Handler for downloading receipt as PDF
  const handleDownloadReceipt = async () => {
    if (!completedTransactionData) return;

    // Show loading toast with ID so we can update it
    const loadingToast = toast.loading("Generating PDF receipt...");

    try {
      // Fetch business details from database
      let businessDetails = {
        name: completedTransactionData.businessName || "AuraSwift POS",
        address: "",
        phone: "",
        vatNumber: "",
      };
      // Then show a toast warning if fields are empty after fetch
      if (user?.businessId) {
        try {
          const businessResponse = await window.authAPI.getBusinessById(
            user.businessId
          );
          if (businessResponse.success && businessResponse.business) {
            businessDetails = {
              name: businessResponse.business.name,
              address:
                businessResponse.business.address ||
                "123 Main Street, London, W1A 1AA",
              phone: businessResponse.business.phone || "+44 20 1234 5678",
              vatNumber: businessResponse.business.vatNumber || "GB123456789",
            };
          }
        } catch (error) {
          console.warn(
            "Failed to fetch business details, using defaults:",
            error
          );
        }
      }

      // Prepare receipt data for PDF generation
      const receiptData = {
        // Store Information
        storeName: businessDetails.name,
        storeAddress: businessDetails.address,
        storePhone: businessDetails.phone,
        vatNumber: businessDetails.vatNumber,

        // Transaction Details
        receiptNumber: completedTransactionData.receiptNumber,
        transactionId:
          completedTransactionData.id || completedTransactionData.receiptNumber,
        date: new Date(completedTransactionData.timestamp).toLocaleDateString(
          "en-GB"
        ),
        time: new Date(completedTransactionData.timestamp).toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        cashierId: user?.id || "unknown",
        cashierName: completedTransactionData.cashierName || "Unknown",

        // Items
        items: completedTransactionData.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
          sku: item.sku || "",
        })),

        // Financial
        subtotal: completedTransactionData.subtotal,
        tax: completedTransactionData.tax,
        total: completedTransactionData.total,
        paymentMethod: "cash" as const,
        cashAmount: completedTransactionData.amountPaid,
        change: completedTransactionData.change,
      };

      // Generate PDF via IPC bridge (main process)
      const result = await window.pdfReceiptAPI.generatePDF(receiptData);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to generate PDF");
      }

      // Decode base64 string to binary data
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob from binary data
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // Create anchor element to trigger download with save dialog
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt_${completedTransactionData.receiptNumber}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Update loading toast to success
      toast.success("PDF receipt downloaded successfully!", {
        id: loadingToast,
      });

      // Don't automatically close the modal - let user decide
      // They can click close icon or skip button to continue
      // This way if they cancel the save dialog, they can try again

      // Cleanup blob URL after a delay to ensure download completes
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error generating PDF receipt:", error);
      toast.error("Failed to generate PDF receipt. Please try again.", {
        id: loadingToast,
      });
    }
  };

  // Handler for printing receipt
  const handlePrintReceipt = async () => {
    if (!completedTransactionData) return;

    try {
      toast.info("Printing receipt...");
      const printResult = await startPrintingFlow(completedTransactionData);

      if (printResult) {
        toast.success("Receipt printed successfully!");

        // Close modal and reset after successful print
        setTimeout(() => {
          handleCloseReceiptOptions();
        }, 1500);
      } else {
        toast.error(
          "Failed to print receipt. Please check printer connection."
        );
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print receipt");
    }
  };

  // Handler for emailing receipt
  const handleEmailReceiptOption = async () => {
    if (!completedTransactionData) return;

    try {
      // For now, just show info - implement email functionality later
      toast.info("Email receipt feature coming soon!");

      // You can also call the existing email receipt handler
      // handleEmailReceipt();

      // Close modal after a delay
      setTimeout(() => {
        handleCloseReceiptOptions();
      }, 2000);
    } catch (error) {
      console.error("Email error:", error);
      toast.error("Failed to send receipt email");
    }
  };

  // Handler for closing receipt options modal (skip receipt)
  const handleCloseReceiptOptions = () => {
    setShowReceiptOptions(false);

    // Reset for next customer
    setCart([]);
    setPaymentStep(false);
    setPaymentMethod(null);
    setTransactionComplete(false);
    setCashAmount(0);
    setCompletedTransactionData(null);

    toast.success("Ready for next customer!");
  };

  // Handler for canceling payment from receipt modal
  const handleCancelPayment = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "⚠️ Cancel Receipt?\n\n" +
        "The transaction has already been completed and saved.\n" +
        "Are you sure you want to skip the receipt?\n\n" +
        "You can print it later from transaction history."
    );

    if (confirmed) {
      setShowReceiptOptions(false);
      setCompletedTransactionData(null);
      setTransactionComplete(false);

      // Reset for next customer
      setCart([]);
      setPaymentStep(false);
      setPaymentMethod(null);
      setCashAmount(0);

      toast.info("Receipt skipped. Transaction saved in history.");
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

      <div className="flex p-2 flex-col lg:flex-row gap-2 min-h-screen h-screen">
        {/* Left Column - Product Scanning & Selection */}
        <div className="flex mb-2 flex-col flex-1 min-h-0 min-w-0">
          <Card className="bg-white border-slate-200 flex-1 flex flex-col shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 py-1">
              <div className="flex items-center justify-between">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-1 text-sm">
                  {breadcrumb.map((item, index) => (
                    <React.Fragment key={item.id || "root"}>
                      {index > 0 && (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className={`px-2 py-1 rounded transition-colors ${
                          index === breadcrumb.length - 1
                            ? "bg-sky-100 text-sky-700 font-medium"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {index === 0 ? <Home className="h-4 w-4" /> : item.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1 flex-1 overflow-y-auto scroll-smooth">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-600">
                    Loading products...
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-600 mb-4">Failed to load products</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      loadProducts();
                      loadCategories();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show Categories if no search query and categories exist at current level */}
                  {!searchQuery && currentCategories.length > 0 && (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {currentCategories.map((category) => {
                          const childCount = categories.filter(
                            (c) => c.parentId === category.id
                          ).length;
                          const productCount = products.filter(
                            (p) => p.category === category.id
                          ).length;

                          return (
                            <motion.button
                              key={category.id}
                              onClick={() => handleCategoryClick(category)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="relative bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-6 shadow-md transition-all h-28 flex flex-col items-center justify-center"
                            >
                              <div className="text-center">
                                <p className="font-bold text-lg uppercase tracking-wide mb-1">
                                  {category.name}
                                </p>
                                <p className="text-xs opacity-90">
                                  {childCount > 0
                                    ? `${childCount} subcategories`
                                    : `${productCount} items`}
                                </p>
                              </div>
                              {childCount > 0 && (
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 opacity-75" />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show Products */}
                  {(() => {
                    const displayProducts = searchQuery
                      ? filteredProducts
                      : getCurrentCategoryProducts();

                    if (
                      displayProducts.length === 0 &&
                      !searchQuery &&
                      currentCategories.length === 0
                    ) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Package className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-slate-500 text-center">
                            No products in this category
                          </p>
                        </div>
                      );
                    }

                    if (displayProducts.length === 0 && searchQuery) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Search className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-slate-500 text-center">
                            No products found for "{searchQuery}"
                          </p>
                        </div>
                      );
                    }

                    return displayProducts.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                          {displayProducts.map((product) => (
                            <motion.div
                              key={product.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Button
                                variant="outline"
                                className={`h-auto py-4 flex flex-col items-center w-full transition-all ${
                                  selectedWeightProduct?.id === product.id
                                    ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                }`}
                                onClick={() => {
                                  if (product.requiresWeight) {
                                    if (
                                      selectedWeightProduct?.id ===
                                        product.id &&
                                      weightInput &&
                                      parseFloat(weightInput) > 0
                                    ) {
                                      addToCart(
                                        product,
                                        parseFloat(weightInput)
                                      );
                                      setWeightInput("");
                                      setSelectedWeightProduct(null);
                                    } else {
                                      setSelectedWeightProduct(product);
                                      toast.warning(
                                        `⚖️ Enter weight for ${product.name} (${product.unit})`
                                      );
                                    }
                                  } else {
                                    addToCart(product);
                                  }
                                }}
                              >
                                <div className="w-16 h-16 bg-slate-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-2xl font-bold text-slate-400">
                                      {product.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-900 text-center line-clamp-2 mb-1">
                                  {product.name}
                                </span>
                                <span className="text-base font-bold text-green-600">
                                  £
                                  {product.requiresWeight &&
                                  product.pricePerUnit
                                    ? product.pricePerUnit.toFixed(2)
                                    : product.price.toFixed(2)}
                                  {product.requiresWeight && (
                                    <span className="text-xs text-slate-500 ml-1">
                                      /{product.unit}
                                    </span>
                                  )}
                                </span>
                                {product.requiresWeight && (
                                  <Badge
                                    variant="outline"
                                    className="mt-1 text-xs bg-blue-50"
                                  >
                                    <Scale className="h-3 w-3 mr-1" />
                                    Weighed
                                  </Badge>
                                )}
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
          {!paymentStep && <QuickActionButtons onLogOff={logout} />}

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
                      {/* Cancel Button */}
                      <Button
                        variant="ghost"
                        className="col-span-2 mt-2 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        onClick={() => {
                          setPaymentStep(false);
                          setPaymentMethod(null);
                        }}
                      >
                        Cancel
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
                              value={cashAmount ? cashAmount.toFixed(2) : ""}
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
                                ? "text-sky-700"
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
                            : "bg-sky-600 hover:bg-sky-700"
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
                      <Button
                        variant="ghost"
                        className="col-span-2 mt-2 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                        onClick={() => {
                          setPaymentStep(false);
                          setPaymentMethod(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {/* Transaction Complete Message - Only show for non-cash payments */}
          {transactionComplete && !showReceiptOptions && (
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
                  className="mt-4 bg-sky-600 hover:bg-sky-700"
                  onClick={() => setTransactionComplete(false)}
                >
                  OK
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Cart & Payment */}

        <div className="flex flex-col flex-[0_1_480px] w-full lg:w-[480px] max-w-[520px] gap-2 h-full overflow-hidden">
          {/* Quick Actions Carousel */}

          <QuickActionsCarousel
            onRefund={() => setShowRefundModal(true)}
            onVoid={() => setShowVoidModal(true)}
            onCount={() => setShowCountModal(true)}
            onDashboard={onBack}
          />

          <div className="bg-white border-t-black-200 shadow-lg shrink-0">
            <CardContent className="p-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Scan/Enter barcode or PLU code"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                  className="bg-white text-sm border-slate-300"
                />
                <Button
                  onClick={handleBarcodeScan}
                  className="bg-sky-600 hover:bg-sky-700"
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
                        className="h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white"
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
          </div>
          {/* table of cart items */}
          <div className="bg-white border-b-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
            <CardContent className="p-2 flex-1 flex flex-col min-h-0">
              <div className="border border-slate-200 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="shrink-0">
                  <Table>
                    <TableHeader className="bg-linear-to-r from-sky-200 to-blue-300">
                      <TableRow className="h-10 border-b-0">
                        <TableHead
                          className="text-center font-semibold text-slate-800 h-10"
                          style={{ width: "100px" }}
                        >
                          Unit/Weight
                        </TableHead>
                        <TableHead className="text-left font-semibold text-slate-800 h-10">
                          Product
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-slate-800 h-10"
                          style={{ width: "120px" }}
                        >
                          Price
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-slate-800 h-10"
                          style={{ width: "100px" }}
                        >
                          Total
                        </TableHead>
                        <TableHead
                          className="text-center font-semibold text-slate-800 h-10"
                          style={{ width: "80px" }}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                  <Table>
                    <TableBody>
                      <AnimatePresence>
                        {cart.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-slate-400 text-center py-8"
                            >
                              No items in Basket. Scan or search for products.
                            </TableCell>
                          </TableRow>
                        ) : (
                          cart.map((item) => (
                            <TableRow
                              key={item.product.id}
                              className="border-b border-slate-200"
                            >
                              <TableCell
                                className="text-center"
                                style={{ width: "100px" }}
                              >
                                {item.product.requiresWeight && item.weight
                                  ? `${item.weight.toFixed(2)} ${
                                      item.product.unit || "lbs"
                                    }`
                                  : "-"}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.product.name}
                              </TableCell>
                              <TableCell
                                className="text-center"
                                style={{ width: "120px" }}
                              >
                                {item.product.requiresWeight &&
                                item.product.pricePerUnit
                                  ? `£${item.product.pricePerUnit.toFixed(
                                      2
                                    )} / ${item.product.unit}`
                                  : `£${item.product.price.toFixed(2)}`}
                              </TableCell>
                              <TableCell
                                className="text-center font-semibold"
                                style={{ width: "100px" }}
                              >
                                {item.product.requiresWeight &&
                                item.weight &&
                                item.product.pricePerUnit
                                  ? `£${(
                                      item.product.pricePerUnit *
                                      item.weight *
                                      item.quantity
                                    ).toFixed(2)}`
                                  : `£${(
                                      item.product.price * item.quantity
                                    ).toFixed(2)}`}
                              </TableCell>
                              <TableCell
                                className="text-center"
                                style={{ width: "80px" }}
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    removeFromCart(item.product.id)
                                  }
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 font-medium text-sm">
                  <span>
                    Subtotal:{" "}
                    <span className="font-semibold">
                      £{subtotal.toFixed(2)}
                    </span>
                  </span>
                  <span>
                    Items: <span className="font-semibold">{cart.length}</span>
                  </span>
                  <span className="text-slate-500">
                    Tax (8%):{" "}
                    <span className="font-semibold">£{tax.toFixed(2)}</span>
                  </span>
                  <span className="text-sky-700 font-bold text-lg ml-auto">
                    Total: £{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>
          <div className="shrink-0">
            <NumericKeypad
              onInput={(value) => {
                // Handle numeric keypad input here
                console.log("Numeric keypad input:", value);
              }}
              keysOverride={[
                ["7", "8", "9", "Enter"],
                ["4", "5", "6", "Clear"],
                [
                  "1",
                  "2",
                  "3",
                  !paymentStep ? (
                    <Button
                      className="w-full h-full py-4 font-semibold text-lg rounded transition-colors bg-sky-600 hover:bg-sky-700 text-white"
                      style={{ minHeight: 0, minWidth: 0 }}
                      onClick={() => setPaymentStep(true)}
                      disabled={cart.length === 0}
                    >
                      Checkout
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-full py-4 font-semibold text-lg rounded transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700"
                      style={{ minHeight: 0, minWidth: 0 }}
                      onClick={() => setPaymentStep(false)}
                    >
                      Back to Cart
                    </Button>
                  ),
                ],
                ["0", "00", "", ""],
              ]}
            />
          </div>

          {/* Hardware Scanner History */}
          {/* {scanLog.length > 0 && (
            <ScanHistory
              scanLog={scanLog}
              onClearLog={clearScanLog}
              maxVisible={3}
            />
          )} */}
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
            setPaymentMethod(null);
            setPaymentStep(false);
          }}
          onRetry={async () => {
            await handleCardPayment();
          }}
          onClose={() => {
            setShowCardPayment(false);
            setPaymentMethod(null);
            setPaymentStep(false);
          }}
        />
      )}

      {/* Receipt Options Modal (for Cash Payments) */}
      {showReceiptOptions && completedTransactionData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => {
            // Prevent closing when clicking on the modal content
            if (e.target === e.currentTarget) {
              // Don't auto-close on backdrop click - force user to use buttons
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
                onClick={handleCancelPayment}
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
                    Receipt #{completedTransactionData.receiptNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Transaction Summary */}
              <div className="bg-linear-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-600 font-medium">
                    Total Paid:
                  </span>
                  <span className="text-3xl font-bold text-slate-900">
                    £{completedTransactionData.total.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Cash Received:</span>
                    <span className="font-semibold text-slate-700">
                      £{completedTransactionData.amountPaid.toFixed(2)}
                    </span>
                  </div>
                  {completedTransactionData.change > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Change Given:</span>
                      <span className="font-bold text-green-600 text-lg">
                        £{completedTransactionData.change.toFixed(2)}
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
                  onClick={handlePrintReceipt}
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
                  onClick={handleDownloadReceipt}
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
                  onClick={handleEmailReceiptOption}
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
                  onClick={handleCloseReceiptOptions}
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
      )}

      {/* Refund Transaction Modal */}
      {showRefundModal && (
        <RefundTransactionView
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          onRefundProcessed={() => {
            setShowRefundModal(false);
            toast.success("Refund processed successfully!");
            // Optionally reload transactions or update state
          }}
        />
      )}

      {/* Void Transaction Modal */}
      {showVoidModal && (
        <VoidTransactionModal
          isOpen={showVoidModal}
          onClose={() => setShowVoidModal(false)}
          onVoidComplete={() => {
            setShowVoidModal(false);
            toast.success("Transaction voided successfully!");
            // Optionally reload transactions or update state
          }}
          activeShiftId={user?.id || null}
        />
      )}

      {/* Cash Drawer Count Modal */}
      {showCountModal && user && (
        <CashDrawerCountModal
          isOpen={showCountModal}
          onClose={() => setShowCountModal(false)}
          onCountComplete={() => {
            setShowCountModal(false);
            toast.success("Cash count completed successfully!");
          }}
          activeShiftId={user.id}
          countType="mid-shift"
          startingCash={0}
        />
      )}
    </>
  );
};

export default NewTransactionView;
