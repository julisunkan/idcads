import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Verify from "@/pages/Verify";
import Dashboard from "@/pages/Admin/Dashboard";
import Settings from "@/pages/Admin/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/verify" component={Verify} />
      <Route path="/verify/:idNumber" component={Verify} />
      
      {/* Admin Routes - Auth check handled inside components */}
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/settings" component={Settings} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
