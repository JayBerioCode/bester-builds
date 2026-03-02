import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Box,
  Calendar,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { useLocation } from "wouter";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = trpc.analytics.summary.useQuery();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Printer className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Bester.Builds</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">Large Format Printing — Business Overview</p>
        </div>
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          {new Date().toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </Badge>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Customers"
            value={summary?.totalCustomers ?? 0}
            icon={Users}
            color="bg-purple-100 text-purple-700"
            subtitle="In CRM database"
            onClick={() => setLocation("/crm")}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary?.totalRevenue ?? 0)}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-700"
            subtitle="Payments received"
            onClick={() => setLocation("/payments")}
          />
          <StatCard
            title="Active Orders"
            value={summary?.activeOrders ?? 0}
            icon={ClipboardList}
            color="bg-blue-100 text-blue-700"
            subtitle={`of ${summary?.totalOrders ?? 0} total orders`}
            onClick={() => setLocation("/orders")}
          />
          <StatCard
            title="Pending Invoices"
            value={summary?.pendingInvoices ?? 0}
            icon={FileText}
            color="bg-amber-100 text-amber-700"
            subtitle="Awaiting payment"
            onClick={() => setLocation("/invoices")}
          />
          <StatCard
            title="Inventory Alerts"
            value={summary?.lowStockItems ?? 0}
            icon={AlertTriangle}
            color={summary?.lowStockItems ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}
            subtitle="Low stock items"
            onClick={() => setLocation("/inventory")}
          />
          <StatCard
            title="Active Employees"
            value={summary?.activeEmployees ?? 0}
            icon={Users}
            color="bg-indigo-100 text-indigo-700"
            subtitle="On active status"
            onClick={() => setLocation("/employees")}
          />
          <StatCard
            title="Pending Tasks"
            value={summary?.pendingTasks ?? 0}
            icon={CheckSquare}
            color="bg-orange-100 text-orange-700"
            subtitle="In progress / pending"
            onClick={() => setLocation("/tasks")}
          />
          <StatCard
            title="Total Orders"
            value={summary?.totalOrders ?? 0}
            icon={Printer}
            color="bg-violet-100 text-violet-700"
            subtitle="All time"
            onClick={() => setLocation("/orders")}
          />
        </div>
      )}

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "New Order", icon: ClipboardList, path: "/orders", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
            { label: "Add Customer", icon: Users, path: "/crm", color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
            { label: "New Invoice", icon: FileText, path: "/invoices", color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
            { label: "Record Payment", icon: CreditCard, path: "/payments", color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" },
            { label: "Book Appointment", icon: Calendar, path: "/scheduling", color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
            { label: "View Analytics", icon: BarChart3, path: "/analytics", color: "text-rose-600 bg-rose-50 hover:bg-rose-100" },
          ].map(({ label, icon: Icon, path, color }) => (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-border transition-all hover:shadow-sm ${color}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Box className="h-4 w-4 text-primary" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.lowStockItems ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{summary.lowStockItems} items below minimum stock level</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All inventory levels are healthy.</p>
            )}
            <button
              onClick={() => setLocation("/inventory")}
              className="mt-3 text-xs text-primary hover:underline font-medium"
            >
              Manage inventory →
            </button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Production Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {summary?.activeOrders
                ? `${summary.activeOrders} job${summary.activeOrders !== 1 ? "s" : ""} currently in production pipeline.`
                : "No active production jobs at the moment."}
            </p>
            <button
              onClick={() => setLocation("/orders")}
              className="mt-3 text-xs text-primary hover:underline font-medium"
            >
              View all orders →
            </button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View upcoming client consultations, production timelines, and deliveries.
            </p>
            <button
              onClick={() => setLocation("/scheduling")}
              className="mt-3 text-xs text-primary hover:underline font-medium"
            >
              Open calendar →
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
