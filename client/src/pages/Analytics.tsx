import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  ClipboardList,
  DollarSign,
  TrendingDown,
  Percent,
  PackageSearch,
} from "lucide-react";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";

const COLORS = ["#7c3aed", "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function MarginBadge({ pct }: { pct: number | null }) {
  if (pct === null)
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">No data</Badge>;
  if (pct >= 50) return <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-0">{pct.toFixed(1)}%</Badge>;
  if (pct >= 25) return <Badge className="text-[10px] bg-amber-100 text-amber-800 border-0">{pct.toFixed(1)}%</Badge>;
  return <Badge className="text-[10px] bg-red-100 text-red-800 border-0">{pct.toFixed(1)}%</Badge>;
}

export default function Analytics() {
  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery();
  const { data: revenueByMonth = [], isLoading: revenueLoading } = trpc.analytics.revenueByMonth.useQuery();
  const { data: ordersByStatus = [], isLoading: ordersLoading } = trpc.analytics.ordersByStatus.useQuery();
  const { data: topCustomers = [], isLoading: customersLoading } = trpc.analytics.topCustomers.useQuery();
  const { data: jobCostingData = [], isLoading: jobCostingLoading } = trpc.jobCosting.report.useQuery(undefined);

  const [jobCostingFilter, setJobCostingFilter] = useState<"all" | "with_data" | "no_data">("all");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, notation: "compact" }).format(val);

  const formatCurrencyFull = (val: number) =>
    new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(val);

  // Job costing summary KPIs
  const jobCostingKPIs = useMemo(() => {
    const withData = jobCostingData.filter((j) => j.hasMaterialsLogged);
    const totalQuoted = withData.reduce((s, j) => s + j.quotedTotal, 0);
    const totalCost = withData.reduce((s, j) => s + j.actualCost, 0);
    const totalMargin = totalQuoted - totalCost;
    const avgMarginPct = totalQuoted > 0 ? (totalMargin / totalQuoted) * 100 : null;
    return { totalQuoted, totalCost, totalMargin, avgMarginPct, jobsWithData: withData.length };
  }, [jobCostingData]);

  // Chart data: quoted vs cost per job (top 10 with data)
  const jobCostingChartData = useMemo(() => {
    return jobCostingData
      .filter((j) => j.hasMaterialsLogged)
      .slice(0, 10)
      .map((j) => ({
        name: j.orderNumber,
        quoted: j.quotedTotal,
        cost: j.actualCost,
        margin: j.grossMargin,
      }));
  }, [jobCostingData]);

  const filteredJobs = useMemo(() => {
    if (jobCostingFilter === "with_data") return jobCostingData.filter((j) => j.hasMaterialsLogged);
    if (jobCostingFilter === "no_data") return jobCostingData.filter((j) => !j.hasMaterialsLogged);
    return jobCostingData;
  }, [jobCostingData, jobCostingFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Business performance &amp; insights" />

      {/* KPI Summary */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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

      {/* ─── JOB COSTING REPORT ─────────────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">Job Costing Report</h2>
          <p className="text-sm text-muted-foreground">
            Quoted price vs actual material cost per job — log materials on the Orders page to populate this report.
          </p>
        </div>

        {/* Job Costing KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Quoted</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(jobCostingKPIs.totalQuoted)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{jobCostingKPIs.jobsWithData} jobs with material data</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Material Cost</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(jobCostingKPIs.totalCost)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Actual inventory consumed</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gross Margin</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(jobCostingKPIs.totalMargin)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Quoted minus material cost</p>
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
                  <p className="text-xs text-muted-foreground">Avg Margin %</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {jobCostingKPIs.avgMarginPct !== null
                      ? `${jobCostingKPIs.avgMarginPct.toFixed(1)}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Across all costed jobs</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quoted vs Cost Chart */}
        {jobCostingChartData.length > 0 && (
          <Card className="border-0 shadow-sm mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Quoted vs Material Cost per Job (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={jobCostingChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `R ${v.toLocaleString()}`,
                      name === "quoted" ? "Quoted" : name === "cost" ? "Material Cost" : "Gross Margin",
                    ]}
                  />
                  <Legend formatter={(v) => v === "quoted" ? "Quoted" : v === "cost" ? "Material Cost" : "Gross Margin"} />
                  <Bar dataKey="quoted" fill="#7c3aed" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Bar dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Per-Job Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Per-Job Breakdown</CardTitle>
            <div className="flex gap-1">
              {(["all", "with_data", "no_data"] as const).map((f) => (
                <Button
                  key={f}
                  variant={jobCostingFilter === f ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setJobCostingFilter(f)}
                >
                  {f === "all" ? "All Jobs" : f === "with_data" ? "Costed" : "Uncosted"}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {jobCostingLoading ? (
              <div className="h-32 bg-muted/30 rounded animate-pulse" />
            ) : filteredJobs.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <PackageSearch className="h-8 w-8 opacity-30" />
                <p>No jobs found. Create orders and log materials to see costing data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Order</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Customer</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Status</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Quoted</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Material Cost</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Gross Margin</th>
                      <th className="text-right py-2 px-2 font-semibold text-muted-foreground">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.orderId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-2">
                          <p className="font-medium text-foreground">{job.orderNumber}</p>
                          <p className="text-muted-foreground truncate max-w-[120px]">{job.title}</p>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">{job.customerName}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {job.status?.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right font-medium">{formatCurrencyFull(job.quotedTotal)}</td>
                        <td className="py-2 px-2 text-right">
                          {job.hasMaterialsLogged ? (
                            <span className="text-red-600 font-medium">{formatCurrencyFull(job.actualCost)}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Not logged</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {job.hasMaterialsLogged ? (
                            <span className={job.grossMargin >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                              {formatCurrencyFull(job.grossMargin)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <MarginBadge pct={job.marginPct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
