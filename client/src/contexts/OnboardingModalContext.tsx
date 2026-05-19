import { createContext, useContext, useState, type ReactNode } from "react";

type OnboardingModalContextType = {
  showOnboarding: boolean;
  onboardingStep: number;
  openOnboarding: (step?: number) => void;
  closeOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
};

const OnboardingModalContext = createContext<OnboardingModalContextType | null>(null);

export function OnboardingModalProvider({ children }: { children: ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const openOnboarding = (step = 0) => {
    setOnboardingStep(step);
    setShowOnboarding(true);
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <OnboardingModalContext.Provider
      value={{ showOnboarding, onboardingStep, openOnboarding, closeOnboarding, setOnboardingStep }}
    >
      {children}
    </OnboardingModalContext.Provider>
  );
}

export function useOnboardingModal() {
  const ctx = useContext(OnboardingModalContext);
  if (!ctx) throw new Error("useOnboardingModal must be used within OnboardingModalProvider");
  return ctx;
}
