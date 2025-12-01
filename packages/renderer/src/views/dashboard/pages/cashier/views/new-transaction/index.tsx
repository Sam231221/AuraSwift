import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useAuth } from "@/shared/hooks/use-auth";
import {
  useReceiptPrintingFlow,
  useThermalPrinter,
} from "../../hooks/use-thermal-printer";
import {
  useCart,
  useProducts,
  useCategories,
  useWeightInput,
  useCategoryPriceInput,
  useShift,
  usePayment,
} from "./hooks";
import { useSalesMode } from "../../hooks/use-sales-mode";

// Components
import {
  LoadingState,
  ShiftBanner,
  OvertimeWarning,
  StartShiftDialog,
  NoActiveShiftModal,
  ProductSelectionPanel,
  CartPanel,
  PaymentPanel,
  WeightInputDisplay,
  CategoryPriceInputDisplay,
} from "./components";
import { ReceiptOptionsModal } from "./components/payment/receipt-options-modal";

// Shared Components
import {
  QuickActionsCarousel,
  QuickActionButtons,
  NumericKeypad,
} from "./components/shared";
import {
  AgeVerificationModal,
  BatchSelectionModal,
  GenericItemPriceModal,
  RefundTransactionView,
  VoidTransactionModal,
  CashDrawerCountModal,
} from "./components/modals";
import type {
  AgeVerificationData,
  SelectedBatchData,
} from "./components/modals";
import { ScaleDisplay } from "@/views/dashboard/pages/cashier/views/new-transaction/components/input/ScaleDisplay";

// Types
import type { Product } from "@/types/domain";
import type { PrinterConfig } from "@/types/features/printer";

// Utils
import { isWeightedProduct } from "./utils/product-helpers";
import { getUserRoleName } from "@/shared/utils/rbac-helpers";

import { getLogger } from "@/shared/utils/logger";
const logger = getLogger("index");

// Constants
const DOUBLE_CLICK_DELAY = 300;

interface NewTransactionViewProps {
  onBack: () => void;
}

export function NewTransactionView({ onBack }: NewTransactionViewProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Search query state
  const [searchQuery] = useState("");
  const [lastClickTime, setLastClickTime] = useState<{
    productId: string;
    timestamp: number;
  } | null>(null);

  // Modal states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [showAgeVerificationModal, setShowAgeVerificationModal] =
    useState(false);
  const [showGenericPriceModal, setShowGenericPriceModal] = useState(false);
  const [
    pendingProductForAgeVerification,
    setPendingProductForAgeVerification,
  ] = useState<Product | null>(null);
  const [pendingWeightForAgeVerification, setPendingWeightForAgeVerification] =
    useState<number | undefined>(undefined);
  const [pendingGenericProduct, setPendingGenericProduct] =
    useState<Product | null>(null);
  const [showScaleDisplay, setShowScaleDisplay] = useState(false);

  // Batch selection modal states
  const [showBatchSelectionModal, setShowBatchSelectionModal] = useState(false);
  const [pendingProductForBatchSelection, setPendingProductForBatchSelection] =
    useState<Product | null>(null);
  const [
    pendingQuantityForBatchSelection,
    setPendingQuantityForBatchSelection,
  ] = useState<number>(1);

  // Receipt printing flow
  const { isShowingStatus, startPrintingFlow, handleSkipReceipt } =
    useReceiptPrintingFlow();

  // Thermal printer
  const { connectPrinter: connectPrinterInternal } = useThermalPrinter();

  // Wrapper for connect printer with localStorage save
  const connectPrinter = useCallback(
    async (config: PrinterConfig): Promise<boolean> => {
      const result = await connectPrinterInternal(config);
      if (result) {
        localStorage.setItem("printer_config", JSON.stringify(config));
      }
      return result;
    },
    [connectPrinterInternal]
  );

  // Products hook
  const products = useProducts(user?.businessId);

  // Weight input hook
  const weightInput = useWeightInput();

  // Category price input hook
  const categoryPriceInput = useCategoryPriceInput();

  // Sales mode detection
  const salesMode = useSalesMode();

  // Shift hook (only used for cashier mode)
  const shift = useShift({
    userId: user?.id,
    userRole: user?.role,
    businessId: user?.businessId,
    onCartSessionInit: async () => {
      await cart.initializeCartSession();
      return;
    },
  });

  // Cart hook
  const cart = useCart({
    userId: user?.id,
    businessId: user?.businessId,
    userRole: user?.role,
    activeShift: salesMode.activeShift || shift.activeShift, // Use salesMode activeShift if available
    todaySchedule: shift.todaySchedule,
  });

  // Categories hook
  const categories = useCategories({
    businessId: user?.businessId,
    products: products.products,
    onCategorySelectForPriceInput: (category) => {
      categoryPriceInput.setPendingCategory(category);
      weightInput.resetWeightInput();
    },
  });

  // Payment hook
  const payment = usePayment({
    cartSession: cart.cartSession,
    cartItems: cart.cartItems,
    subtotal: cart.subtotal,
    tax: cart.tax,
    total: cart.total,
    userId: user?.id,
    businessId: user?.businessId,
    userFirstName: user?.firstName,
    userLastName: user?.lastName,
    userBusinessName: user?.businessName,
    startPrintingFlow,
    isShowingStatus,
    onResetPrintStatus: handleSkipReceipt,
    onCartSessionInit: async () => {
      await cart.initializeCartSession();
      return;
    },
    activeShift: salesMode.activeShift || shift.activeShift, // Use salesMode activeShift
    requiresShift: salesMode.requiresShift, // Pass shift requirement
  });

  // Check if operations should be disabled (only for cashier mode)
  const isOperationsDisabled =
    salesMode.requiresShift &&
    !salesMode.activeShift &&
    shift.todaySchedule !== null;

  // Check if shift has ended and no future shift is available
  const shiftHasEnded = useMemo(() => {
    if (!shift.todaySchedule) return false;
    const now = new Date();
    const scheduledEnd = new Date(shift.todaySchedule.endTime);
    const timeFromEnd = now.getTime() - scheduledEnd.getTime();
    const minutesAfterEnd = timeFromEnd / (1000 * 60);
    // Shift has ended if it's more than 60 minutes past the end time
    return minutesAfterEnd > 60;
  }, [shift.todaySchedule]);

  // Handle product click
  const handleProductClick = useCallback(
    async (product: Product, weight?: number) => {
      if (isOperationsDisabled) {
        const errorMessage = salesMode.requiresShift
          ? "Please start your shift before adding items to cart"
          : "Unable to add items to cart";
        toast.error(errorMessage);
        return;
      }

      // Check if product requires age verification
      const requiresAgeVerification =
        product.ageRestrictionLevel && product.ageRestrictionLevel !== "NONE";

      if (isWeightedProduct(product)) {
        if (weight !== undefined && weight > 0) {
          // Weight provided, check age verification
          if (requiresAgeVerification) {
            setPendingWeightForAgeVerification(weight);
            setPendingProductForAgeVerification(product);
            setShowAgeVerificationModal(true);
            weightInput.resetWeightInput();
          } else {
            await cart.addToCart(product, weight);
            weightInput.resetWeightInput();
          }
        } else {
          // No weight, set as selected for weight input
          categoryPriceInput.resetPriceInput();
          setShowScaleDisplay(true); // Show scale display by default for weighted products
          weightInput.setSelectedWeightProduct(product);
        }
      } else {
        // Regular product
        if (requiresAgeVerification) {
          setPendingProductForAgeVerification(product);
          setShowAgeVerificationModal(true);
        } else {
          await cart.addToCart(product);
        }
      }
    },
    [isOperationsDisabled, cart, weightInput, categoryPriceInput]
  );

  // Handle generic item click
  const handleGenericItemClick = useCallback(
    async (product: Product) => {
      if (isOperationsDisabled) {
        const errorMessage = salesMode.requiresShift
          ? "Please start your shift before adding items to cart"
          : "Unable to add items to cart";
        toast.error(errorMessage);
        return;
      }

      setPendingGenericProduct(product);
      setShowGenericPriceModal(true);
    },
    [isOperationsDisabled]
  );

  // Handle age verification complete - creates audit record and adds item to cart
  const handleAgeVerificationComplete = useCallback(
    async (verificationData: AgeVerificationData) => {
      if (!pendingProductForAgeVerification) return;

      if (verificationData.verified) {
        try {
          // Create age verification audit record
          if (user?.id && user?.businessId) {
            const auditResponse = await window.ageVerificationAPI.create({
              productId: pendingProductForAgeVerification.id,
              verificationMethod: verificationData.verificationMethod,
              customerBirthdate: verificationData.customerBirthdate,
              calculatedAge: verificationData.calculatedAge,
              verifiedBy: user.id,
              managerOverrideId: verificationData.managerId,
              overrideReason: verificationData.overrideReason,
              businessId: user.businessId,
            });

            if (!auditResponse.success) {
              logger.error(
                "Failed to create age verification record:",
                auditResponse.message
              );
              // Continue with cart addition even if audit fails - we don't want to block sales
              // The ageVerified flag on the cart item provides fallback tracking
            }
          }

          // Add item to cart with ageVerified flag
          if (pendingWeightForAgeVerification !== undefined) {
            await cart.addToCart(
              pendingProductForAgeVerification,
              pendingWeightForAgeVerification,
              undefined,
              true
            );
          } else {
            await cart.addToCart(
              pendingProductForAgeVerification,
              undefined,
              undefined,
              true
            );
          }
        } catch (error) {
          logger.error("Error during age verification completion:", error);
          toast.error("Failed to complete age verification");
        }
      }

      setShowAgeVerificationModal(false);
      setPendingProductForAgeVerification(null);
      setPendingWeightForAgeVerification(undefined);
      weightInput.resetWeightInput();
    },
    [
      pendingProductForAgeVerification,
      pendingWeightForAgeVerification,
      cart,
      weightInput,
      user,
    ]
  );

  // Handle generic price complete
  const handleGenericPriceComplete = useCallback(
    async (price: number) => {
      if (!pendingGenericProduct) return;

      await cart.addToCart(pendingGenericProduct, undefined, price);

      setShowGenericPriceModal(false);
      setPendingGenericProduct(null);
    },
    [pendingGenericProduct, cart]
  );

  // Handle batch selection complete - adds item with specific batch info
  const handleBatchSelectionComplete = useCallback(
    async (batchData: SelectedBatchData) => {
      if (!pendingProductForBatchSelection) return;

      // Add to cart with batch info (this will be used during checkout)
      // Note: The batch info is stored in cart item and used during transaction creation
      await cart.addToCart(pendingProductForBatchSelection);

      // TODO: When cart API supports batch info in addToCart, pass it here
      // For now, the backend auto-selects using FEFO during transaction creation

      toast.success(
        `Added ${pendingProductForBatchSelection.name} from batch ${batchData.batchNumber}`
      );

      setShowBatchSelectionModal(false);
      setPendingProductForBatchSelection(null);
      setPendingQuantityForBatchSelection(1);
    },
    [pendingProductForBatchSelection, cart]
  );

  // Handle auto-select batch (FEFO)
  const handleAutoSelectBatch = useCallback(async () => {
    if (!pendingProductForBatchSelection) return;

    // Just add to cart - the backend will auto-select using FEFO
    await cart.addToCart(pendingProductForBatchSelection);

    setShowBatchSelectionModal(false);
    setPendingProductForBatchSelection(null);
    setPendingQuantityForBatchSelection(1);
  }, [pendingProductForBatchSelection, cart]);

  // Handle batch selection cancel
  const handleBatchSelectionCancel = useCallback(() => {
    setShowBatchSelectionModal(false);
    setPendingProductForBatchSelection(null);
    setPendingQuantityForBatchSelection(1);
  }, []);

  // Initialize cart session on mount
  useEffect(() => {
    if (user && shift.activeShift) {
      cart
        .initializeCartSession()
        .catch((error) =>
          logger.error("Failed to initialize cart session", error)
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, shift.activeShift]);

  // Initialize printer on mount
  useEffect(() => {
    const initPrinter = async () => {
      try {
        const savedConfig = localStorage.getItem("printer_config");
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          const status = await window.printerAPI.getStatus();
          if (!status.connected) {
            await connectPrinter(config);
          }
        }
      } catch (error) {
        logger.error("Printer auto-connect failed:", error);
      }
    };
    initPrinter();
  }, [connectPrinter]);

  // Ensure printer status modal doesn't show when receipt options modal should be shown
  // This prevents flicker when completing cash payments
  useEffect(() => {
    if (payment.showReceiptOptions && isShowingStatus) {
      handleSkipReceipt();
    }
  }, [payment.showReceiptOptions, isShowingStatus, handleSkipReceipt]);

  // Early returns
  if (!user) {
    navigate("/");
    return null;
  }

  // Show loading state while checking shift (only for cashier mode)
  if (shift.isLoadingShift && salesMode.requiresShift && salesMode.isLoading) {
    return <LoadingState message="Loading shift data..." />;
  }

  // Show blocking UI if no scheduled shift OR if shift has ended with no future shift (only for cashier mode)
  if (
    salesMode.requiresShift &&
    !shift.isLoadingShift &&
    !salesMode.isLoading &&
    !salesMode.activeShift &&
    (!shift.todaySchedule || shiftHasEnded)
  ) {
    return (
      <NoActiveShiftModal shiftHasEnded={shiftHasEnded} onLogout={logout} />
    );
  }

  // Get products to display
  const displayProducts = searchQuery
    ? products.getFilteredProducts(searchQuery)
    : categories.getCurrentCategoryProducts();

  return (
    <>
      {/* Shift Banners (only shown for cashier mode) */}
      {salesMode.requiresShift && (
        <>
          <OvertimeWarning
            show={shift.showOvertimeWarning}
            minutes={shift.overtimeMinutes}
          />
          <ShiftBanner
            isOperationsDisabled={isOperationsDisabled}
            todaySchedule={shift.todaySchedule}
            shiftTimingInfo={shift.shiftTimingInfo}
            onStartShift={shift.handleStartShiftClick}
          />
        </>
      )}

      {/* Admin Mode Indicator (optional - can be removed if not needed) */}
      {!salesMode.requiresShift && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-800">
          <div className="flex items-center justify-between">
            <span>Admin Mode: Direct sales access (no shift required)</span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex p-2 sm:p-3 lg:p-4 flex-col lg:flex-row gap-2 sm:gap-3 min-h-screen">
        {/* Left Column - Product Selection */}
        <div className="flex mb-0 lg:mb-2 flex-col flex-1 min-h-0 min-w-0">
          <ProductSelectionPanel
            products={displayProducts}
            categories={categories.categories}
            currentCategories={categories.currentCategories}
            breadcrumb={categories.breadcrumb}
            searchQuery={searchQuery}
            selectedWeightProductId={
              weightInput.selectedWeightProduct?.id || null
            }
            loading={products.loading}
            error={products.error}
            lastClickTime={lastClickTime}
            onProductClick={handleProductClick}
            onGenericItemClick={handleGenericItemClick}
            onCategoryClick={categories.handleCategoryClick}
            onBreadcrumbClick={categories.handleBreadcrumbClick}
            onSetLastClickTime={setLastClickTime}
            onRetry={() => {
              products.loadProducts();
              categories.loadCategories();
            }}
            DOUBLE_CLICK_DELAY={DOUBLE_CLICK_DELAY}
          />
          {!payment.paymentStep && <QuickActionButtons onLogOff={logout} />}
        </div>

        {/* Right Column - Cart & Payment */}
        <div className="flex flex-col w-full lg:flex-[0_1_480px] lg:w-[480px] lg:max-w-[520px] gap-2 sm:gap-3 min-h-0 overflow-y-auto">
          <QuickActionsCarousel
            onRefund={() => setShowRefundModal(true)}
            onVoid={() => setShowVoidModal(true)}
            onCount={() => setShowCountModal(true)}
            onDashboard={onBack}
            hasActiveShift={!!shift.activeShift}
          />

          <div className="bg-white border-t-black-200 shadow-lg shrink-0">
            <CardContent className="p-2 sm:p-3">
              {/* Scale Display for Weighted Products (shown by default) */}
              {weightInput.selectedWeightProduct &&
                isWeightedProduct(weightInput.selectedWeightProduct) &&
                !categoryPriceInput.pendingCategory &&
                showScaleDisplay && (
                  <div className="mt-2 space-y-2">
                    <ScaleDisplay
                      selectedProduct={{
                        id: weightInput.selectedWeightProduct.id,
                        name: weightInput.selectedWeightProduct.name,
                        productType: "WEIGHTED",
                        basePrice: weightInput.selectedWeightProduct.basePrice,
                        pricePerUnit:
                          weightInput.selectedWeightProduct.pricePerKg,
                        unitOfMeasure:
                          weightInput.selectedWeightProduct.salesUnit || "KG",
                      }}
                      onWeightConfirmed={async (weight) => {
                        const product = weightInput.selectedWeightProduct;
                        if (!product) return;

                        if (
                          product.ageRestrictionLevel &&
                          product.ageRestrictionLevel !== "NONE"
                        ) {
                          setPendingWeightForAgeVerification(weight);
                          setPendingProductForAgeVerification(product);
                          setShowAgeVerificationModal(true);
                          weightInput.resetWeightInput();
                          setShowScaleDisplay(true); // Keep scale display for next item
                        } else {
                          await cart.addToCart(product, weight);
                          weightInput.resetWeightInput();
                          setShowScaleDisplay(true); // Keep scale display for next item
                        }
                      }}
                      onCancel={() => {
                        setShowScaleDisplay(false);
                        weightInput.resetWeightInput();
                      }}
                      onManualEntryRequest={() => setShowScaleDisplay(false)}
                      autoAddOnStable={true}
                      minWeight={0.001}
                      maxWeight={50}
                    />
                  </div>
                )}

              {/* Weight Input Display for Weighted Products (manual entry) */}
              {weightInput.selectedWeightProduct &&
                isWeightedProduct(weightInput.selectedWeightProduct) &&
                !categoryPriceInput.pendingCategory &&
                !showScaleDisplay && (
                  <WeightInputDisplay
                    selectedProduct={weightInput.selectedWeightProduct}
                    weightDisplayPrice={weightInput.weightDisplayPrice}
                    onShowScaleDisplay={() => setShowScaleDisplay(true)}
                  />
                )}

              {/* Category Price Input Display */}
              {categoryPriceInput.pendingCategory &&
                !weightInput.selectedWeightProduct && (
                  <CategoryPriceInputDisplay
                    pendingCategory={categoryPriceInput.pendingCategory}
                    categoryDisplayPrice={
                      categoryPriceInput.categoryDisplayPrice
                    }
                  />
                )}
            </CardContent>
          </div>

          <CartPanel
            cartItems={cart.cartItems}
            loadingCart={cart.loadingCart}
            subtotal={cart.subtotal}
            tax={cart.tax}
            total={cart.total}
            onRemoveItem={cart.removeFromCart}
          />

          {/* Payment Panel */}
          <PaymentPanel
            paymentStep={payment.paymentStep}
            paymentMethod={payment.paymentMethod}
            total={cart.total}
            cashAmount={payment.cashAmount}
            cardReaderReady={true}
            onPaymentMethodSelect={payment.handlePayment}
            onCashAmountChange={payment.setCashAmount}
            onCompleteTransaction={payment.completeTransaction}
            onCancel={() => {
              payment.setPaymentStep(false);
              payment.setPaymentMethod(null);
            }}
          />

          {/* Transaction Complete Message */}
          {payment.transactionComplete && !payment.showReceiptOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="bg-white p-4 sm:p-6 rounded-lg text-center w-full max-w-sm"
              >
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-lg sm:text-xl font-bold mb-2 text-slate-800">
                  Transaction Complete!
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Thank you for shopping with us.
                </p>
                <p className="mt-2 text-sm sm:text-base text-slate-700 font-semibold">
                  Total: £{cart.total.toFixed(2)}
                </p>
                <Button
                  className="mt-4 bg-sky-600 hover:bg-sky-700 min-h-[44px] h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                  onClick={() => {
                    payment.setTransactionComplete(false);
                  }}
                >
                  OK
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Numeric Keypad */}
          <div className="shrink-0">
            <NumericKeypad
              onInput={async (value) => {
                // Handle weight input
                if (
                  weightInput.selectedWeightProduct &&
                  !categoryPriceInput.pendingCategory
                ) {
                  const weightValue = weightInput.handleWeightInput(value);
                  if (
                    value === "Enter" &&
                    weightValue !== undefined &&
                    weightValue > 0
                  ) {
                    await handleProductClick(
                      weightInput.selectedWeightProduct,
                      weightValue
                    );
                    setShowScaleDisplay(false); // Reset scale display after adding via keypad
                  }
                  return;
                }

                // Handle category price input
                if (categoryPriceInput.pendingCategory) {
                  const priceValue = categoryPriceInput.handlePriceInput(value);
                  if (
                    value === "Enter" &&
                    priceValue !== undefined &&
                    priceValue > 0
                  ) {
                    await cart.addCategoryToCart(
                      categoryPriceInput.pendingCategory!,
                      priceValue
                    );
                    categoryPriceInput.resetPriceInput();
                  }
                  return;
                }

                // Handle other numeric keypad input
                logger.info("Numeric keypad input:", value);
              }}
              keysOverride={[
                ["7", "8", "9", "Enter"],
                ["4", "5", "6", "Clear"],
                [
                  "1",
                  "2",
                  "3",
                  weightInput.selectedWeightProduct &&
                  !categoryPriceInput.pendingCategory ? (
                    "."
                  ) : categoryPriceInput.pendingCategory ? (
                    "."
                  ) : !payment.paymentStep ? (
                    <Button
                      className="w-full h-full min-h-[44px] py-3 sm:py-4 font-semibold text-sm sm:text-lg rounded transition-colors bg-sky-600 hover:bg-sky-700 text-white touch-manipulation"
                      style={{ minHeight: 44, minWidth: 0 }}
                      onClick={() => payment.setPaymentStep(true)}
                      disabled={
                        cart.cartItems.length === 0 || !cart.cartSession
                      }
                    >
                      Checkout
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-full min-h-[44px] py-3 sm:py-4 font-semibold text-sm sm:text-lg rounded transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700 touch-manipulation"
                      style={{ minHeight: 44, minWidth: 0 }}
                      onClick={() => payment.setPaymentStep(false)}
                    >
                      Back to Cart
                    </Button>
                  ),
                ],
                ["0", "00", "", ""],
              ]}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <StartShiftDialog
        open={shift.showStartShiftDialog}
        onOpenChange={shift.setShowStartShiftDialog}
        startingCash={shift.startingCash}
        onStartingCashChange={shift.setStartingCash}
        onConfirm={shift.confirmStartShift}
        lateStartMinutes={shift.lateStartMinutes}
        showLateStartConfirm={shift.showLateStartConfirm}
        onLateStartConfirm={shift.confirmLateStart}
        onLateStartCancel={() => {
          shift.setShowLateStartConfirm(false);
        }}
      />

      {pendingProductForAgeVerification && (
        <AgeVerificationModal
          isOpen={showAgeVerificationModal}
          product={pendingProductForAgeVerification}
          onVerify={handleAgeVerificationComplete}
          onCancel={() => {
            setShowAgeVerificationModal(false);
            setPendingProductForAgeVerification(null);
            setPendingWeightForAgeVerification(undefined);
            weightInput.resetWeightInput();
          }}
          currentUser={
            user ? { id: user.id, role: getUserRoleName(user) } : null
          }
        />
      )}

      {pendingGenericProduct && (
        <GenericItemPriceModal
          isOpen={showGenericPriceModal}
          product={pendingGenericProduct}
          onConfirm={handleGenericPriceComplete}
          onCancel={() => {
            setShowGenericPriceModal(false);
            setPendingGenericProduct(null);
          }}
        />
      )}

      {/* Batch Selection Modal - for products that require batch tracking */}
      {pendingProductForBatchSelection && user?.businessId && (
        <BatchSelectionModal
          isOpen={showBatchSelectionModal}
          product={pendingProductForBatchSelection}
          requestedQuantity={pendingQuantityForBatchSelection}
          onSelect={handleBatchSelectionComplete}
          onAutoSelect={handleAutoSelectBatch}
          onCancel={handleBatchSelectionCancel}
          businessId={user.businessId}
        />
      )}

      {showRefundModal && (
        <RefundTransactionView
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          onRefundProcessed={() => {
            setShowRefundModal(false);
            toast.success("Refund processed successfully!");
          }}
        />
      )}

      {showVoidModal && user && (
        <VoidTransactionModal
          isOpen={showVoidModal}
          onClose={() => setShowVoidModal(false)}
          onVoidComplete={() => {
            setShowVoidModal(false);
            toast.success("Transaction voided successfully!");
          }}
          activeShiftId={user.id}
        />
      )}

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

      {/* Receipt Options Modal */}
      {payment.showReceiptOptions && payment.completedTransactionData && (
        <ReceiptOptionsModal
          isOpen={payment.showReceiptOptions}
          transactionData={payment.completedTransactionData}
          onPrint={payment.handlePrintReceipt}
          onDownload={payment.handleDownloadReceipt}
          onEmail={payment.handleEmailReceiptOption}
          onClose={payment.handleCloseReceiptOptions}
          onCancel={payment.handleCancelPayment}
          printerStatus={payment.printerStatus}
        />
      )}
    </>
  );
}

export default NewTransactionView;
