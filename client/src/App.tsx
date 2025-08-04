import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TimeTracking from "@/pages/time-tracking";
import Projects from "@/pages/projects";
import Clients from "@/pages/clients";
import Invoices from "@/pages/invoices";
import Quotes from "@/pages/quotes";
import Documents from "@/pages/documents";
import AbTesting from "@/pages/ab-testing";
import Checkout from "@/pages/checkout";
import UserManagement from "@/pages/admin/user-management";
import PaymentConfig from "@/pages/admin/payment-config";
import ActivityLogs from "@/pages/admin/activity-logs";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/time-tracking" component={TimeTracking} />
          <Route path="/projects" component={Projects} />
          <Route path="/clients" component={Clients} />
          <Route path="/invoices" component={Invoices} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/documents" component={Documents} />
          <Route path="/ab-testing" component={AbTesting} />
          <Route path="/checkout" component={Checkout} />
          
          {/* Admin routes */}
          <Route path="/admin/users">
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/payment-config">
            <ProtectedRoute requiredRole="admin">
              <PaymentConfig />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/activity-logs">
            <ProtectedRoute requiredRole="admin">
              <ActivityLogs />
            </ProtectedRoute>
          </Route>
        </>
      )}
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
