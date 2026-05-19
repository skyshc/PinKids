import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useOnboardingModal } from "@/contexts/OnboardingModalContext";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663647991675/fuW72okeNRT65TWogzSyTX/pinkids_logo-bLUfJu9Gwp7PMy3dAmMaey.webp";

const navLinks = [
  { href: "/features", label: "기능" },
  { href: "/map", label: "위치 보기" },
  { href: "/how-to", label: "사용 방법" },
];

export default function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const { openOnboarding } = useOnboardingModal();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[#17324d] bg-[#fff7e7]/92 backdrop-blur-xl">
      <nav className="container flex h-20 items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3" aria-label="핀키즈 홈">
          <img
            src={LOGO_URL}
            alt="Pinkids"
            className="h-11 w-11 transition-transform group-hover:scale-110"
          />
          <span className="font-display text-2xl tracking-tight">핀키즈</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 text-sm font-bold md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:underline hover:decoration-[3px] hover:underline-offset-8 ${location === link.href ? "underline decoration-[3px] underline-offset-8 text-[#1d8664]" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="border-[3px] border-[#17324d] bg-[#8fd3b6] px-4 py-2 text-sm font-black shadow-[4px_4px_0_#17324d]">
                {user?.name || "보호자"}님 로그인 중
              </span>
              <Button
                onClick={() => logout()}
                variant="outline"
                className="border-[3px] border-[#17324d] bg-[#fff7e7] px-4 py-5 font-black shadow-[4px_4px_0_#f2a37b] hover:bg-white"
              >
                <LogOut className="mr-2 h-4 w-4" /> 로그아웃
              </Button>
            </>
          ) : (
            <Button
              onClick={() => openOnboarding(0)}
              className="border-[3px] border-[#17324d] bg-[#17324d] px-5 py-5 text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
            >
              소셜 로그인으로 시작
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center border-[3px] border-[#17324d] bg-[#fff7e7] shadow-[3px_3px_0_#17324d] md:hidden"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="메뉴 열기"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t-[3px] border-[#17324d] bg-[#fff7e7] md:hidden">
          <div className="container flex flex-col gap-2 py-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`border-[3px] border-[#17324d] px-4 py-3 text-sm font-black shadow-[3px_3px_0_#17324d] ${location === link.href ? "bg-[#8fd3b6]" : "bg-[#fffdf5] hover:bg-white"}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2">
              {isAuthenticated ? (
                <Button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  variant="outline"
                  className="w-full border-[3px] border-[#17324d] bg-[#fff7e7] font-black shadow-[4px_4px_0_#f2a37b] hover:bg-white"
                >
                  <LogOut className="mr-2 h-4 w-4" /> 로그아웃
                </Button>
              ) : (
                <Button
                  onClick={() => { openOnboarding(0); setMobileOpen(false); }}
                  className="w-full border-[3px] border-[#17324d] bg-[#17324d] font-black text-[#fff7e7] shadow-[5px_5px_0_#f2a37b] hover:bg-[#254462]"
                >
                  소셜 로그인으로 시작
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
