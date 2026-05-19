import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OnboardingModalProvider } from "./contexts/OnboardingModalContext";
import Home from "./pages/Home";
import Features from "./pages/Features";
import MapViewPage from "./pages/MapViewPage";
import HowTo from "./pages/HowTo";
import InviteAccept from "./pages/InviteAccept";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/features"} component={Features} />
      <Route path={"/map"} component={MapViewPage} />
      <Route path={"/how-to"} component={HowTo} />
      <Route path={"/invite/:token"} component={InviteAccept} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <OnboardingModalProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </OnboardingModalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
