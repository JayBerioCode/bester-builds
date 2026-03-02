import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Clock,
  LogIn,
  LogOut,
  Timer,
  TrendingUp,
  Users,
  CalendarDays,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { format, formatDuration, intervalToDuration } from "date-fns";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMoney(val: string | number | null | undefined) {
  const n = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  return `R ${(n ?? 0).toFixed(2)}`;
}

function formatHours(val: string | number | null | undefined) {
  const n = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  return `${(n ?? 0).toFixed(2)} hrs`;
}

function useLiveTimer(clockInTimestamp: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!clockInTimestamp) { setElapsed(0); return; }
    const tick = () => setElapsed(Date.now() - clockInTimestamp);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInTimestamp]);
  return elapsed;
}

function formatElapsed(ms: number) {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
      Clocked In
    </Badge>
  ) : (
    <Badge variant="outline" className="text-slate-500 gap-1">
      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
      Clocked Out
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClockIn() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const utils = trpc.useUtils();

  // Fetch employees list
  const { data: employees = [] } = trpc.employees.list.useQuery();

  // Active shift for selected employee
  const { data: activeShift, isLoading: loadingShift } = trpc.shifts.activeShift.useQuery(
    { employeeId: selectedEmployeeId! },
    { enabled: selectedEmployeeId !== null, refetchInterval: 10000 }
  );

  // All shifts for selected employee
  const { data: shiftHistory = [] } = trpc.shifts.list.useQuery(
    { employeeId: selectedEmployeeId ?? undefined, limit: 50 },
    { enabled: selectedEmployeeId !== null }
  );

  // Summary for selected employee
  const { data: summary = [] } = trpc.shifts.summary.useQuery(
    { employeeId: selectedEmployeeId ?? undefined },
    { enabled: selectedEmployeeId !== null }
  );

  // All-employee summary (for the overview cards)
  const { data: allSummary = [] } = trpc.shifts.summary.useQuery({});

  const clockInMutation = trpc.shifts.clockIn.useMutation({
    onSuccess: () => {
      toast.success("Clocked in successfully!");
      setNotes("");
      utils.shifts.activeShift.invalidate();
      utils.shifts.list.invalidate();
      utils.shifts.summary.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const clockOutMutation = trpc.shifts.clockOut.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Clocked out! You worked ${formatHours(data?.hoursWorked)} and earned ${formatMoney(data?.earnings)}.`
      );
      setNotes("");
      utils.shifts.activeShift.invalidate();
      utils.shifts.list.invalidate();
      utils.shifts.summary.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Stabilise the clock-in timestamp as a primitive (number) so the useEffect
  // dependency in useLiveTimer never changes reference on every re-render.
  const clockInTimestamp = useMemo(
    () => (activeShift?.clockIn ? new Date(activeShift.clockIn).getTime() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeShift?.id, activeShift?.clockIn]
  );
  const elapsed = useLiveTimer(clockInTimestamp);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  const empSummary = summary.find((s: any) => s.employeeId === selectedEmployeeId);

  // Totals across all employees
  const totalHoursAll = allSummary.reduce((acc: number, s: any) => acc + parseFloat(s.totalHours ?? "0"), 0);
  const totalEarningsAll = allSummary.reduce((acc: number, s: any) => acc + parseFloat(s.totalEarnings ?? "0"), 0);
  const activeCount = employees.filter((e) => e.status === "active").length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Clock In / Out
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track employee shifts, worked hours, and daily earnings.
          </p>
        </div>

        {/* Overview KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Staff</p>
                  <p className="text-2xl font-bold">{activeCount}</p>
                </div>
                <Users className="w-8 h-8 text-primary/40" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Shifts</p>
                  <p className="text-2xl font-bold">
                    {allSummary.reduce((acc: number, s: any) => acc + Number(s.totalShifts ?? 0), 0)}
                  </p>
                </div>
                <CalendarDays className="w-8 h-8 text-blue-400/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Hours</p>
                  <p className="text-2xl font-bold">{totalHoursAll.toFixed(1)}</p>
                </div>
                <Timer className="w-8 h-8 text-amber-400/60" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Wages</p>
                  <p className="text-2xl font-bold">{formatMoney(totalEarningsAll)}</p>
                </div>
                <Banknote className="w-8 h-8 text-green-400/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Clock In/Out Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Employee</CardTitle>
                <CardDescription>Choose the employee to clock in or out</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={selectedEmployeeId?.toString() ?? ""}
                  onValueChange={(v) => setSelectedEmployeeId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} — {emp.role?.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedEmployee && (
                  <>
                    <Separator />
                    {/* Employee info */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Role</span>
                        <span className="capitalize font-medium">
                          {selectedEmployee.role?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hourly Rate</span>
                        <span className="font-medium">{formatMoney(selectedEmployee.hourlyRate)}/hr</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <StatusBadge active={!!activeShift} />
                      </div>
                    </div>

                    {/* Live Timer */}
                    {activeShift && (
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Shift started at</p>
                        <p className="text-sm font-medium text-primary">
                          {format(new Date(activeShift.clockIn), "HH:mm, dd MMM yyyy")}
                        </p>
                        <p className="text-4xl font-mono font-bold text-primary mt-2 tabular-nums">
                          {formatElapsed(elapsed)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Est. earnings:{" "}
                          <span className="font-semibold text-green-600">
                            {formatMoney(
                              (elapsed / 3600000) *
                                parseFloat((selectedEmployee.hourlyRate as string) ?? "0")
                            )}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-1">
                      <Label className="text-xs">Notes (optional)</Label>
                      <Textarea
                        placeholder="e.g. Working on banner prints..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Action Button */}
                    {!activeShift ? (
                      <Button
                        className="w-full gap-2"
                        onClick={() =>
                          clockInMutation.mutate({ employeeId: selectedEmployeeId!, notes: notes || undefined })
                        }
                        disabled={clockInMutation.isPending}
                      >
                        <LogIn className="w-4 h-4" />
                        {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() =>
                          clockOutMutation.mutate({
                            shiftId: activeShift.id,
                            employeeId: selectedEmployeeId!,
                            notes: notes || undefined,
                          })
                        }
                        disabled={clockOutMutation.isPending}
                      >
                        <LogOut className="w-4 h-4" />
                        {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                      </Button>
                    )}
                  </>
                )}

                {!selectedEmployee && (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                    <AlertCircle className="w-8 h-8 opacity-30" />
                    <p className="text-sm">Select an employee above to begin</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employee earnings summary */}
            {empSummary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {selectedEmployee?.name}'s Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Shifts</span>
                    <span className="font-semibold">{empSummary.totalShifts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="font-semibold">{formatHours(empSummary.totalHours)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span className="font-semibold text-green-600">{formatMoney(empSummary.totalEarnings)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Shift History */}
          <div className="lg:col-span-2 space-y-4">
            {/* All-employee summary table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Employees — Earnings Overview</CardTitle>
                <CardDescription>Aggregated totals for all completed shifts</CardDescription>
              </CardHeader>
              <CardContent>
                {allSummary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No completed shifts yet. Clock in an employee to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                          <th className="text-left pb-2 font-medium">Employee</th>
                          <th className="text-left pb-2 font-medium">Role</th>
                          <th className="text-right pb-2 font-medium">Shifts</th>
                          <th className="text-right pb-2 font-medium">Hours</th>
                          <th className="text-right pb-2 font-medium">Rate/hr</th>
                          <th className="text-right pb-2 font-medium">Total Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSummary.map((row: any) => (
                          <tr key={row.employeeId} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 font-medium">{row.employeeName}</td>
                            <td className="py-2 text-muted-foreground capitalize">
                              {row.employeeRole?.replace(/_/g, " ")}
                            </td>
                            <td className="py-2 text-right">{row.totalShifts}</td>
                            <td className="py-2 text-right">{formatHours(row.totalHours)}</td>
                            <td className="py-2 text-right">{formatMoney(row.hourlyRate)}</td>
                            <td className="py-2 text-right font-semibold text-green-600">
                              {formatMoney(row.totalEarnings)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individual shift log */}
            {selectedEmployeeId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedEmployee?.name} — Shift History
                  </CardTitle>
                  <CardDescription>Last 50 shifts for this employee</CardDescription>
                </CardHeader>
                <CardContent>
                  {shiftHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No shifts recorded yet for this employee.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                            <th className="text-left pb-2 font-medium">Date</th>
                            <th className="text-left pb-2 font-medium">Clock In</th>
                            <th className="text-left pb-2 font-medium">Clock Out</th>
                            <th className="text-right pb-2 font-medium">Hours</th>
                            <th className="text-right pb-2 font-medium">Earned</th>
                            <th className="text-left pb-2 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftHistory.map((shift: any) => {
                            const isOpen = !shift.clockOut;
                            return (
                              <tr key={shift.id} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="py-2 text-muted-foreground">
                                  {format(new Date(shift.clockIn), "dd MMM yyyy")}
                                </td>
                                <td className="py-2">
                                  {format(new Date(shift.clockIn), "HH:mm")}
                                </td>
                                <td className="py-2">
                                  {isOpen ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                      Active
                                    </Badge>
                                  ) : (
                                    format(new Date(shift.clockOut), "HH:mm")
                                  )}
                                </td>
                                <td className="py-2 text-right">
                                  {isOpen ? (
                                    <span className="text-muted-foreground italic text-xs">in progress</span>
                                  ) : (
                                    formatHours(shift.hoursWorked)
                                  )}
                                </td>
                                <td className="py-2 text-right font-medium text-green-600">
                                  {isOpen ? "—" : formatMoney(shift.earnings)}
                                </td>
                                <td className="py-2 text-muted-foreground text-xs max-w-[120px] truncate">
                                  {shift.notes ?? "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}

