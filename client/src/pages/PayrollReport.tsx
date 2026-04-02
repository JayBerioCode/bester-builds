import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

function formatRole(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(val: number) {
  return `R ${val.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Default to current month
function defaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function PayrollReport() {
  const { user } = useAuth();
  const defaults = useMemo(() => defaultDates(), []);
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [search, setSearch] = useState("");
  const [queryDates, setQueryDates] = useState({ start: defaults.start, end: defaults.end });

  const { data: report, isLoading, refetch } = trpc.payroll.report.useQuery(
    { startDate: new Date(queryDates.start), endDate: new Date(queryDates.end) },
    { enabled: !!queryDates.start && !!queryDates.end }
  );

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date.");
      return;
    }
    setQueryDates({ start: startDate, end: endDate });
    refetch();
  };

  const handleDownloadPDF = () => {
    const url = `/api/payroll/pdf?startDate=${encodeURIComponent(queryDates.start)}&endDate=${encodeURIComponent(queryDates.end)}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-${queryDates.start}-to-${queryDates.end}.pdf`;
    link.click();
    toast.success("Payroll PDF download started.");
  };

  const filtered = useMemo(() => {
    if (!report) return [];
    if (!search.trim()) return report;
    const q = search.toLowerCase();
    return report.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(q) ||
        e.employeeRole.toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
    );
  }, [report, search]);

  const totals = useMemo(() => {
    if (!filtered) return { shifts: 0, hours: 0, earnings: 0 };
    return {
      shifts: filtered.reduce((s, e) => s + e.totalShifts, 0),
      hours: filtered.reduce((s, e) => s + e.totalHours, 0),
      earnings: filtered.reduce((s, e) => s + e.totalEarnings, 0),
    };
  }, [filtered]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">Only administrators can view payroll reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Payroll Report"
        subtitle="Select a pay period to view employee hours and earnings, then export a PDF for your accountant."
        actions={
          <Button
            onClick={handleDownloadPDF}
            disabled={!report || report.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        }
      />

      {/* Pay period selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            Pay Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex gap-2">
              {/* Quick presets */}
              {[
                { label: "This Month", fn: () => { const n = new Date(); setStartDate(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10)); setEndDate(new Date(n.getFullYear(), n.getMonth() + 1, 0).toISOString().slice(0, 10)); } },
                { label: "Last Month", fn: () => { const n = new Date(); setStartDate(new Date(n.getFullYear(), n.getMonth() - 1, 1).toISOString().slice(0, 10)); setEndDate(new Date(n.getFullYear(), n.getMonth(), 0).toISOString().slice(0, 10)); } },
                { label: "This Year", fn: () => { const n = new Date(); setStartDate(`${n.getFullYear()}-01-01`); setEndDate(`${n.getFullYear()}-12-31`); } },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={preset.fn}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                onClick={handleGenerate}
                className="bg-purple-700 hover:bg-purple-800 text-white gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI summary cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Employees", value: String(filtered.length), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Shifts", value: String(totals.shifts), icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Hours", value: totals.hours.toFixed(1) + " hrs", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Payroll", value: formatCurrency(totals.earnings), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Employee Breakdown
              {report && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            {report && report.length > 0 && (
              <div className="relative w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-3 animate-spin text-purple-400" />
              <p>Generating report…</p>
            </div>
          ) : !report ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 text-purple-200" />
              <p className="font-medium">No report generated yet</p>
              <p className="text-sm mt-1">Select a pay period above and click Generate Report.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-purple-200" />
              <p className="font-medium">No shifts found</p>
              <p className="text-sm mt-1">No completed shifts were recorded in this pay period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-50">
                    <TableHead className="font-semibold text-purple-900">Employee</TableHead>
                    <TableHead className="font-semibold text-purple-900">Role</TableHead>
                    <TableHead className="font-semibold text-purple-900">Department</TableHead>
                    <TableHead className="font-semibold text-purple-900 text-right">Shifts</TableHead>
                    <TableHead className="font-semibold text-purple-900 text-right">Total Hours</TableHead>
                    <TableHead className="font-semibold text-purple-900 text-right">Avg hrs/Shift</TableHead>
                    <TableHead className="font-semibold text-purple-900 text-right">Hourly Rate</TableHead>
                    <TableHead className="font-semibold text-purple-900 text-right">Gross Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp) => (
                    <TableRow key={emp.employeeId} className="hover:bg-purple-50/40">
                      <TableCell className="font-medium">{emp.employeeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
                          {formatRole(emp.employeeRole)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{emp.department ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{emp.totalShifts}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{emp.totalHours.toFixed(2)} h</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{emp.avgHoursPerShift.toFixed(2)} h</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        R {parseFloat(emp.hourlyRate).toFixed(2)}/hr
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-bold text-purple-700">
                        {formatCurrency(emp.totalEarnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals footer */}
              <div className="mt-3 flex items-center justify-between px-4 py-3 bg-purple-700 rounded-lg text-white">
                <span className="font-bold text-sm">PERIOD TOTALS</span>
                <div className="flex items-center gap-8 text-sm">
                  <span><span className="text-purple-200">Shifts:</span> <strong>{totals.shifts}</strong></span>
                  <span><span className="text-purple-200">Hours:</span> <strong>{totals.hours.toFixed(2)} h</strong></span>
                  <span><span className="text-purple-200">Total Payroll:</span> <strong>{formatCurrency(totals.earnings)}</strong></span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accountant note */}
      {report && report.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <FileText className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-purple-900">Ready for your accountant</p>
              <p className="text-xs text-purple-700 mt-1">
                Click <strong>Download PDF</strong> above to generate a formatted payroll summary document. The PDF includes all employee details, shift counts, hours, hourly rates, gross earnings, and a company totals row — formatted for submission to your accountant or payroll processor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
