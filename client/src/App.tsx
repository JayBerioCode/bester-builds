import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import CRM from "./pages/CRM";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Invoices from "./pages/Invoices";
import Employees from "./pages/Employees";
import Tasks from "./pages/Tasks";
import Payments from "./pages/Payments";
import Analytics from "./pages/Analytics";
import Scheduling from "./pages/Scheduling";
import ClockIn from "./pages/ClockIn";
import PinKiosk from "./pages/PinKiosk";
import PricingRates from "./pages/PricingRates";
import PayrollReport from "./pages/PayrollReport";
import CompanyProfile from "./pages/CompanyProfile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmployeePortal from "./pages/EmployeePortal";
import EmployeeAccess from "./pages/Settings/EmployeeAccess";
import ShiftApproval from "./pages/ShiftApproval";

function Router() {
  return (
    <Switch>
      {/* Standalone auth pages — no sidebar */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      {/* Employee portal — restricted view, no sidebar */}
      <Route path="/employee-portal" component={EmployeePortal} />
      {/* Full-screen kiosk — no sidebar */}
      <Route path="/kiosk" component={PinKiosk} />
      {/* All other routes use the dashboard layout */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/crm" component={CRM} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/orders" component={Orders} />
            <Route path="/invoices" component={Invoices} />
            <Route path="/employees" component={Employees} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/payments" component={Payments} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/scheduling" component={Scheduling} />
            <Route path="/clock-in" component={ClockIn} />
            <Route path="/settings/pricing" component={PricingRates} />
            <Route path="/settings/payroll" component={PayrollReport} />
            <Route path="/settings/company" component={CompanyProfile} />
            <Route path="/settings/employee-access" component={EmployeeAccess} />
            <Route path="/shifts/approval" component={ShiftApproval} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
