import { TrendingUp, Users, CreditCard, BarChart3 } from "lucide-react";

export function AuthHeroSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <div className="relative z-10 flex flex-col justify-center px-8 xl:px-12 py-12 xl:py-16">
        <div>
          <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-balance leading-tight mb-4 xl:mb-6">
            {"Transform your retail operations with intelligent POS solutions"}
          </h2>

          <p className="text-base xl:text-lg text-muted-foreground text-pretty mb-8 xl:mb-12 leading-relaxed">
            {
              "Streamline transactions, manage inventory, and grow your business with our comprehensive point-of-sale platform designed for modern retailers."
            }
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 xl:w-10 xl:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 xl:w-5 xl:h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-semibold mb-1">
                  Sales Analytics
                </h3>
                <p className="text-xs xl:text-sm text-muted-foreground">
                  Real-time insights and reporting
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 xl:w-10 xl:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 xl:w-5 xl:h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-semibold mb-1">
                  Customer Management
                </h3>
                <p className="text-xs xl:text-sm text-muted-foreground">
                  Build lasting relationships
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 xl:w-10 xl:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 xl:w-5 xl:h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-semibold mb-1">
                  Payment Processing
                </h3>
                <p className="text-xs xl:text-sm text-muted-foreground">
                  Secure, fast transactions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 xl:w-10 xl:h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="w-4 h-4 xl:w-5 xl:h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm xl:text-base font-semibold mb-1">
                  Inventory Control
                </h3>
                <p className="text-xs xl:text-sm text-muted-foreground">
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
