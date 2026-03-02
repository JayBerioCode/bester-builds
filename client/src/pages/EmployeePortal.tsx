import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  LogOut,
  Printer,
  Timer,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

function useLiveTimer(clockInTime: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!clockInTime) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - clockInTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockInTime]);
  return elapsed;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function EmployeePortal() {
  const { user, logout, loading } = useLocalAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);

  const employeeId = user?.employeeId;

  const { data: employeeData } = trpc.employeePortal.getEmployee.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  const { data: activeShift, isLoading: loadingShift } = trpc.employeePortal.activeShift.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId, refetchInterval: 30_000 }
  );

  const { data: shiftLogs = [] } = trpc.employeePortal.list.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  const clockInTime = useMemo(
    () => (activeShift?.clockIn ? new Date(activeShift.clockIn).getTime() : null),
    [activeShift?.clockIn]
  );
  const elapsed = useLiveTimer(clockInTime);

  const clockInMutation = trpc.employeePortal.clockIn.useMutation({
    onSuccess: () => {
      utils.employeePortal.activeShift.invalidate();
      utils.employeePortal.list.invalidate();
    },
  });

  const clockOutMutation = trpc.employeePortal.clockOut.useMutation({
    onSuccess: () => {
      utils.employeePortal.activeShift.invalidate();
      utils.employeePortal.list.invalidate();
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  // Summary stats from recent shifts
  const recentShifts = (shiftLogs as any[]).slice(0, 20);
  const totalHoursThisMonth = recentShifts
    .filter((s: any) => {
      const d = new Date(s.clockIn);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, s: any) => sum + parseFloat(s.hoursWorked || "0"), 0);

  const totalEarningsThisMonth = recentShifts
    .filter((s: any) => {
      const d = new Date(s.clockIn);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, s: any) => sum + parseFloat(s.earnings || "0"), 0);

  if (loading || loadingShift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Bester.Builds</h1>
              <p className="text-xs text-muted-foreground">Employee Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {(employeeData as any)?.role?.replace(/_/g, " ") || "Employee"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Clock In/Out Card */}
        <Card className="border-purple-200 dark:border-purple-800 shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-4">
              {/* Live timer */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
                activeShift
                  ? "bg-green-100 dark:bg-green-900/30 border-4 border-green-400"
                  : "bg-gray-100 dark:bg-gray-800 border-4 border-gray-300 dark:border-gray-600"
              }`}>
                {activeShift ? (
                  <div>
                    <Timer className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <span className="text-lg font-mono font-bold text-green-700 dark:text-green-400">
                      {formatDuration(elapsed)}
                    </span>
                  </div>
                ) : (
                  <Clock className="w-12 h-12 text-gray-400" />
                )}
              </div>

              {activeShift ? (
                <>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 mb-2 px-3 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Currently Clocked In
                  </Badge>
                  <p className="text-muted-foreground text-sm mb-1">
                    Started at {format(new Date((activeShift as any).clockIn), "HH:mm")} on {format(new Date((activeShift as any).clockIn), "dd MMM yyyy")}
                  </p>
                  {(employeeData as any)?.hourlyRate && (
                    <p className="text-muted-foreground text-sm mb-6">
                      Estimated earnings: <span className="font-semibold text-foreground">
                        R {((elapsed / 3600) * parseFloat((employeeData as any).hourlyRate)).toFixed(2)}
                      </span>
                    </p>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-48 h-12 text-base font-semibold"
                    disabled={clockOutMutation.isPending}
                    onClick={() => clockOutMutation.mutate({ employeeId: employeeId!, shiftId: (activeShift as any).id })}
                  >
                    {clockOutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                    Clock Out
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm mb-2">You are not currently clocked in.</p>
                  <p className="text-muted-foreground text-sm mb-6">
                    {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <Button
                    size="lg"
                    className="w-48 h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700"
                    disabled={clockInMutation.isPending || !employeeId}
                    onClick={() => clockInMutation.mutate({ employeeId: employeeId! })}
                  >
                    {clockInMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                    Clock In
                  </Button>
                  {!employeeId && (
                    <p className="text-amber-600 text-xs mt-3">
                      Your account is not linked to an employee record. Please contact your admin.
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalHoursThisMonth.toFixed(1)} h</p>
                  <p className="text-xs text-muted-foreground">Hours this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R {totalEarningsThisMonth.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Earnings this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shift history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-500" />
              My Recent Shifts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentShifts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No shifts recorded yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentShifts.map((shift: any) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">
                        {format(new Date(shift.clockIn), "EEE, dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{format(new Date(shift.clockIn), "HH:mm")}</TableCell>
                      <TableCell>
                        {shift.clockOut ? format(new Date(shift.clockOut), "HH:mm") : (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {shift.hoursWorked ? `${parseFloat(shift.hoursWorked).toFixed(2)} h` : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-green-700 dark:text-green-400">
                        {shift.earnings ? `R ${parseFloat(shift.earnings).toFixed(2)}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
