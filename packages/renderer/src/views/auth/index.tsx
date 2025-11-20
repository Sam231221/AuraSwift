import {
  AuthFooter,
  AuthHeader,
  AuthHeroSection,
  AuthUserSelection,
} from "@/views/auth/components";

export default function AuthPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthHeader />
      <main className="flex-1 bg-linear-to-br from-gray-50 to-gray-100 flex">
        <AuthHeroSection />

        <AuthUserSelection />
      </main>
      <AuthFooter />
    </div>
  );
}
