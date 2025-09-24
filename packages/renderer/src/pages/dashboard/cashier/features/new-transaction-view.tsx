import React, { useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/use-auth";

// Define TypeScript interfaces
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  pluCode?: string;
  requiresWeight?: boolean;
}

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

  // Sample product database
  const [products] = useState<Product[]>([
    {
      id: "1001",
      name: "Banana",
      price: 0.99,
      category: "Produce",
      pluCode: "4011",
      requiresWeight: true,
    },
    {
      id: "1002",
      name: "Apple",
      price: 1.29,
      category: "Produce",
      pluCode: "4021",
      requiresWeight: true,
    },
    { id: "1003", name: "Milk", price: 3.49, category: "Dairy" },
    { id: "1004", name: "Bread", price: 2.99, category: "Bakery" },
    { id: "1005", name: "Eggs", price: 2.49, category: "Dairy" },
    {
      id: "1006",
      name: "Tomato",
      price: 1.99,
      category: "Produce",
      pluCode: "4087",
      requiresWeight: true,
    },
    { id: "1007", name: "Orange Juice", price: 2.99, category: "Beverages" },
    { id: "1008", name: "Cereal", price: 3.99, category: "Breakfast" },
    {
      id: "1009",
      name: "Chicken Breast",
      price: 5.99,
      category: "Meat",
      requiresWeight: true,
    },
    { id: "1010", name: "Yogurt", price: 1.19, category: "Dairy" },
  ]);

  // Filtered products for search
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.pluCode?.includes(searchQuery)
  );

  // Calculate total
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal =
      item.product.price * (item.quantity || 1) * (item.weight || 1);
    return sum + itemTotal;
  }, 0);

  const tax = subtotal * 0.08; // Example tax rate
  const total = subtotal + tax;

  // Functions for cart operations
  const addToCart = (product: Product, weight?: number) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];

        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          weight: product.requiresWeight
            ? (existingItem.weight || 0) + (weight || 0)
            : undefined,
        };

        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            weight: product.requiresWeight ? weight : undefined,
          },
        ];
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

    const product = products.find((p) => p.id === barcodeInput);
    if (product) {
      if (product.requiresWeight) {
        const weight = parseFloat(weightInput) || 1;
        addToCart(product, weight);
        setWeightInput("");
      } else {
        addToCart(product);
      }
      setBarcodeInput("");
    }
  };

  const handlePayment = (method: PaymentMethod["type"]) => {
    setPaymentMethod({ type: method });

    if (method === "cash") {
      setCashAmount(total);
    }
  };

  const completeTransaction = () => {
    setTransactionComplete(true);
    // In a real app, this would update inventory, record sale, etc.

    setTimeout(() => {
      // Reset for next customer
      setCart([]);
      setPaymentStep(false);
      setPaymentMethod(null);
      setTransactionComplete(false);
    }, 3000);
  };

  const { user } = useAuth();
  const navigate = useNavigate();
  console.log(user);
  if (!user) {
    navigate("/");
    return;
  }

  return (
    <>
      <Button onClick={onBack}> Go to dashboard</Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Scanning & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 py-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <ScanBarcode className="h-5 w-5 text-green-600" />
                Scan Products
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter barcode or PLU code"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                  className="bg-white border-slate-300"
                />
                <Button
                  onClick={handleBarcodeScan}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Scan
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  Weight (for produce):
                </span>
                <Input
                  type="number"
                  placeholder="Enter weight"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="bg-white border-slate-300 w-24"
                />
                <span className="text-sm text-slate-600">lbs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 py-3">
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <Search className="h-5 w-5 text-green-600" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Input
                placeholder="Search products by name or PLU"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-slate-300 mb-4"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center bg-white border-slate-200 hover:bg-slate-50 w-full"
                      onClick={() =>
                        addToCart(
                          product,
                          product.requiresWeight
                            ? parseFloat(weightInput) || 1
                            : undefined
                        )
                      }
                    >
                      <span className="font-medium text-slate-800">
                        {product.name}
                      </span>
                      <span className="text-sm text-green-600 font-semibold">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.pluCode && (
                        <Badge
                          variant="secondary"
                          className="mt-1 bg-slate-100 text-slate-600"
                        >
                          PLU: {product.pluCode}
                        </Badge>
                      )}
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
                              Weight: {item.weight.toFixed(2)} lbs
                            </div>
                          )}
                          <div className="text-sm text-slate-500">
                            ${item.product.price.toFixed(2)} each
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1 text-slate-500">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t border-slate-200 text-green-700">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
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

          {/* Payment Section */}
          {paymentStep && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50 py-3">
                  <CardTitle className="flex items-center gap-2 text-slate-700">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Payment Method
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
                        className="h-16 bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                        onClick={() => handlePayment("card")}
                      >
                        <div className="flex flex-col items-center">
                          <span>Card</span>
                          <span className="text-xs text-slate-500">
                            Credit/Debit
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
                              ${total.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <label className="text-sm text-slate-600">
                              Cash Received:
                            </label>
                            <Input
                              type="number"
                              placeholder="Enter cash amount"
                              value={cashAmount}
                              onChange={(e) =>
                                setCashAmount(parseFloat(e.target.value) || 0)
                              }
                              className="bg-white border-slate-300 mt-1"
                            />
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200 text-green-700">
                            <span>Change:</span>
                            <span>${(cashAmount - total).toFixed(2)}</span>
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
                        className="w-full mt-4 bg-green-600 hover:bg-green-700 h-11 text-lg"
                        onClick={completeTransaction}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Complete Transaction
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
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
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
                  Total: ${total.toFixed(2)}
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
    </>
  );
};

export default NewTransactionView;
