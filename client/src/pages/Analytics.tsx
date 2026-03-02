import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp, Users, ClipboardList } from "lucide-react";

const COLORS = ["#7c3aed", "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery();
  const { data: revenueByMonth = [], isLoading: revenueLoading } = trpc.analytics.revenueByMonth.useQuery();
  const { data: ordersByStatus = [], isLoading: ordersLoading } = trpc.analytics.ordersByStatus.useQuery();
  const { data: topCustomers = [], isLoading: customersLoading } = trpc.analytics.topCustomers.useQuery();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, notation: "compact" }).format(val);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Business performance &amp; insights</p>
      </div>

      {/* KPI Summary */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {formatCurrency(summary?.totalRevenue ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">All time payments received</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{summary?.totalOrders ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary?.activeOrders ?? 0} active</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{summary?.totalCustomers ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">In CRM database</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Invoices</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{summary?.pendingInvoices ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-48 bg-muted/30 rounded animate-pulse" />
            ) : revenueByMonth.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No revenue data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`R ${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="h-48 bg-muted/30 rounded animate-pulse" />
            ) : ordersByStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No order data yet
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={ordersByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                    >
                      {ordersByStatus.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Orders"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {ordersByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-muted-foreground capitalize">{item.status.replace(/_/g, " ")}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {customersLoading ? (
            <div className="h-48 bg-muted/30 rounded animate-pulse" />
          ) : topCustomers.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No customer data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v: number) => [`R ${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="totalRevenue" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Production Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Orders", value: summary?.activeOrders ?? 0, color: "text-blue-600 bg-blue-50" },
          { label: "Low Stock Items", value: summary?.lowStockItems ?? 0, color: "text-amber-600 bg-amber-50" },
          { label: "Pending Tasks", value: summary?.pendingTasks ?? 0, color: "text-orange-600 bg-orange-50" },
          { label: "Active Employees", value: summary?.activeEmployees ?? 0, color: "text-purple-600 bg-purple-50" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className={`p-4 rounded-xl ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
