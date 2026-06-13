import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { PrivyProvider } from "@privy-io/react-auth";
import Landing from "@/pages/Landing";
import AppPage from "@/pages/AppPage";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={AppPage} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["wallet", "email", "google"],
        appearance: { theme: "dark", accentColor: "#00A896" },
        embeddedWallets: { solana: { createOnLogin: "users-without-wallets" } }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </QueryClientProvider>
    </PrivyProvider>
  );
}
