import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Delete, Clock, LogIn, LogOut, CheckCircle2, XCircle, Printer } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type KioskState = "idle" | "entering" | "confirm_in" | "confirm_out" | "success" | "error";

type EmployeeInfo = {
  id: number;
  name: string;
  role: string | null;
  pinSet: boolean;
  status: string;
};

type ShiftInfo = {
  id: number;
  clockIn: Date | string;
  clockOut: Date | string | null;
  hoursWorked: string | null;
  earnings: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMoney(val: string | number | null | undefined) {
  const n = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  return `R ${(n ?? 0).toFixed(2)}`;
}

function formatHours(val: string | number | null | undefined) {
  const n = typeof val === "string" ? parseFloat(val) : (val ?? 0);
  return `${(n ?? 0).toFixed(2)} hrs`;
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Numpad ───────────────────────────────────────────────────────────────────
function Numpad({ onPress, onDelete, onClear, disabled }: {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {digits.map((d, i) => {
        if (d === "") return <div key={i} />;
        if (d === "⌫") {
          return (
            <button
              key={i}
              onClick={onDelete}
              disabled={disabled}
              className="h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-slate-600 disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </button>
          );
        }
        return (
          <button
            key={i}
            onClick={() => onPress(d)}
            disabled={disabled}
            className="h-16 rounded-2xl bg-white border border-slate-200 hover:bg-primary/5 hover:border-primary/30 active:scale-95 transition-all text-2xl font-semibold text-slate-800 shadow-sm disabled:opacity-40"
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

// ─── PIN Dots ─────────────────────────────────────────────────────────────────
function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <div className="flex gap-4 justify-center my-6">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
            i < filled
              ? "bg-primary border-primary scale-110"
              : "bg-transparent border-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main Kiosk Page ──────────────────────────────────────────────────────────
export default function PinKiosk() {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<KioskState>("idle");
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [activeShift, setActiveShift] = useState<ShiftInfo | null>(null);
  const [resultData, setResultData] = useState<{ type: "in" | "out"; shift: ShiftInfo; emp: EmployeeInfo } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [autoResetTimer, setAutoResetTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Lookup employee by PIN (fires when 4 digits are entered)
  const lookupQuery = trpc.shifts.lookupByPin.useQuery(
    { pin },
    { enabled: pin.length === 4, retry: false }
  );

  // Active shift query — only runs when we have an employee
  const activeShiftQuery = trpc.shifts.activeShift.useQuery(
    { employeeId: employee?.id ?? 0 },
    { enabled: !!employee && state === "confirm_in" || state === "confirm_out" }
  );

  const clockInMutation = trpc.shifts.clockInByPin.useMutation({
    onSuccess: (data) => {
      setResultData({ type: "in", shift: data.shift, emp: data.employee as EmployeeInfo });
      setState("success");
      scheduleReset(5000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setState("error");
      scheduleReset(4000);
    },
  });

  const clockOutMutation = trpc.shifts.clockOutByPin.useMutation({
    onSuccess: (data) => {
      setResultData({ type: "out", shift: data.shift, emp: data.employee as EmployeeInfo });
      setState("success");
      scheduleReset(6000);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setState("error");
      scheduleReset(4000);
    },
  });

  const scheduleReset = useCallback((ms: number) => {
    if (autoResetTimer) clearTimeout(autoResetTimer);
    const t = setTimeout(() => reset(), ms);
    setAutoResetTimer(t);
  }, [autoResetTimer]);

  const reset = useCallback(() => {
    setPin("");
    setState("idle");
    setEmployee(null);
    setActiveShift(null);
    setResultData(null);
    setErrorMsg("");
    if (autoResetTimer) clearTimeout(autoResetTimer);
    setAutoResetTimer(null);
  }, [autoResetTimer]);

  // When PIN reaches 4 digits, look up the employee
  useEffect(() => {
    if (pin.length === 4) {
      setState("entering");
    }
  }, [pin]);

  // When lookup resolves, move to confirmation
  useEffect(() => {
    if (pin.length !== 4) return;
    if (lookupQuery.isLoading) return;

    if (lookupQuery.data) {
      const emp = lookupQuery.data as EmployeeInfo;
      setEmployee(emp);
      // We need to check active shift — use the activeShift query result
      // For now, set state to confirm_in; we'll check active shift separately
      setState("confirm_in");
    } else if (!lookupQuery.isLoading && lookupQuery.isFetched) {
      setErrorMsg("Invalid PIN. Please try again.");
      setState("error");
      scheduleReset(3000);
    }
  }, [lookupQuery.data, lookupQuery.isLoading, lookupQuery.isFetched, pin.length]);

  // When we have the employee and active shift data, determine clock-in vs clock-out
  useEffect(() => {
    if (!employee || state !== "confirm_in") return;
    if (activeShiftQuery.isLoading) return;
    if (activeShiftQuery.data !== undefined) {
      if (activeShiftQuery.data) {
        setActiveShift(activeShiftQuery.data as ShiftInfo);
        setState("confirm_out");
      } else {
        setState("confirm_in");
      }
    }
  }, [activeShiftQuery.data, activeShiftQuery.isLoading, employee, state]);

  const handleDigit = (d: string) => {
    if (pin.length < 4 && state !== "success" && state !== "error") {
      setPin((p) => p + d);
      if (state === "idle") setState("entering");
    }
  };

  const handleDelete = () => {
    if (state === "entering" || state === "idle") {
      setPin((p) => p.slice(0, -1));
      if (pin.length <= 1) setState("idle");
    }
  };

  const handleConfirmClockIn = () => {
    if (!pin || clockInMutation.isPending) return;
    clockInMutation.mutate({ pin });
  };

  const handleConfirmClockOut = () => {
    if (!pin || clockOutMutation.isPending) return;
    clockOutMutation.mutate({ pin });
  };

  const isLoading = lookupQuery.isLoading || activeShiftQuery.isLoading ||
    clockInMutation.isPending || clockOutMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Bester.Builds</span>
        </div>
        <p className="text-slate-400 text-sm">Employee Clock In / Out Kiosk</p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* ── IDLE / ENTERING ── */}
        {(state === "idle" || state === "entering") && (
          <div className="p-8">
            <div className="text-center mb-2">
              <Clock className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-800">Enter Your PIN</h2>
              <p className="text-sm text-slate-500 mt-1">Enter your 4-digit PIN to clock in or out</p>
            </div>

            <PinDots length={4} filled={pin.length} />

            <Numpad
              onPress={handleDigit}
              onDelete={handleDelete}
              onClear={reset}
              disabled={isLoading}
            />

            {pin.length > 0 && (
              <button
                onClick={reset}
                className="mt-4 w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── LOADING (after 4 digits entered) ── */}
        {state === "entering" && isLoading && (
          <div className="px-8 pb-6 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-2">Verifying PIN…</p>
          </div>
        )}

        {/* ── CONFIRM CLOCK IN ── */}
        {state === "confirm_in" && employee && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">
                {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{employee.name}</h2>
            <p className="text-sm text-slate-500 capitalize mt-1">
              {employee.role?.replace(/_/g, " ")}
            </p>
            <Badge className="mt-2 bg-slate-100 text-slate-600 border-slate-200">
              Currently Clocked Out
            </Badge>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full gap-2 h-12 text-base"
                onClick={handleConfirmClockIn}
                disabled={isLoading}
              >
                <LogIn className="w-5 h-5" />
                {isLoading ? "Clocking In…" : "Clock In Now"}
              </Button>
              <Button variant="outline" className="w-full" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── CONFIRM CLOCK OUT ── */}
        {state === "confirm_out" && employee && activeShift && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">
                {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{employee.name}</h2>
            <p className="text-sm text-slate-500 capitalize mt-1">
              {employee.role?.replace(/_/g, " ")}
            </p>
            <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Currently Clocked In
            </Badge>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Shift started at <span className="font-semibold">{formatTime(activeShift.clockIn)}</span>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full gap-2 h-12 text-base bg-red-500 hover:bg-red-600 text-white"
                onClick={handleConfirmClockOut}
                disabled={isLoading}
              >
                <LogOut className="w-5 h-5" />
                {isLoading ? "Clocking Out…" : "Clock Out Now"}
              </Button>
              <Button variant="outline" className="w-full" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {state === "success" && resultData && (
          <div className="p-8 text-center">
            <CheckCircle2 className={`w-14 h-14 mx-auto mb-4 ${resultData.type === "in" ? "text-green-500" : "text-blue-500"}`} />
            <h2 className="text-xl font-bold text-slate-800">
              {resultData.type === "in" ? "Clocked In!" : "Clocked Out!"}
            </h2>
            <p className="text-slate-600 mt-1 font-medium">{resultData.emp.name}</p>

            {resultData.type === "in" && (
              <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                Shift started at <span className="font-semibold">{formatTime(resultData.shift.clockIn)}</span>
              </div>
            )}

            {resultData.type === "out" && (
              <div className="mt-4 space-y-2">
                <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Hours worked</span>
                    <span className="font-semibold">{formatHours(resultData.shift.hoursWorked)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Earnings</span>
                    <span className="font-semibold">{formatMoney(resultData.shift.earnings)}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-5">Returning to home screen…</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {state === "error" && (
          <div className="p-8 text-center">
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-slate-800">Oops!</h2>
            <p className="text-slate-600 mt-2 text-sm">{errorMsg}</p>
            <p className="text-xs text-slate-400 mt-4">Returning to home screen…</p>
            <Button variant="outline" className="mt-4 w-full" onClick={reset}>
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-slate-600 text-xs">
        {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>
  );
}
