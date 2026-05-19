import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import OnboardingModal from "@/components/OnboardingModal";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fff7e7] text-[#17324d] paper-grain">
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
      <OnboardingModal />
    </div>
  );
}
