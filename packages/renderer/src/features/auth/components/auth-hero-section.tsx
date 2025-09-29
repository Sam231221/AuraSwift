import { Store, TrendingUp, Users, CreditCard, BarChart3 } from "lucide-react";

export function AuthHeroSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/modern-retail-store-interior-with-sleek-pos-system.jpg')] bg-cover bg-center opacity-10" />

      <div className="relative z-10 flex flex-col justify-center px-12 py-16">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AuraSwift</h1>
              <p className="text-sm text-muted-foreground">
                Point of Sale System
              </p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-balance leading-tight mb-6">
            {"Transform your retail operations with intelligent POS solutions"}
          </h2>

          <p className="text-lg text-muted-foreground text-pretty mb-12 leading-relaxed">
            {
              "Streamline transactions, manage inventory, and grow your business with our comprehensive point-of-sale platform designed for modern retailers."
            }
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sales Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time insights and reporting
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Customer Management</h3>
                <p className="text-sm text-muted-foreground">
                  Build lasting relationships
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Payment Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Secure, fast transactions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Inventory Control</h3>
                <p className="text-sm text-muted-foreground">
                  Smart stock management
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
