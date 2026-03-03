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
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-tight">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 leading-none">{value}</p>
            {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-tight">{subtitle}</p>}
          </div>
          <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bester.Builds</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm ml-[42px] sm:ml-[46px]">
            Large Format Printing — Business Overview
          </p>
        </div>
        <Badge variant="outline" className="text-[11px] sm:text-xs border-primary/30 text-primary self-start sm:self-auto whitespace-nowrap">
          {new Date().toLocaleDateString("en-ZA", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
        </Badge>
      </div>

      {/* KPI Grid — 2 cols on mobile, 4 on lg */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-7 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            subtitle={`of ${summary?.totalOrders ?? 0} total`}
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

      {/* Quick Access — 3 cols on mobile, 6 on lg */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Quick Access</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
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
              className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border border-border transition-all hover:shadow-sm ${color}`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module Overview Cards — 1 col on mobile, 2 on md, 3 on lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Box className="h-4 w-4 text-primary shrink-0" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {summary?.lowStockItems ? (
              <div className="flex items-start gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
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
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary shrink-0" />
              Production Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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

        <Card className="border-0 shadow-sm md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
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
