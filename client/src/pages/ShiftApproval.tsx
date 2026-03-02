import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CheckSquare,
  AlertTriangle,
  Loader2,
  CalendarDays,
  Search,
  ChevronDown,
  Info,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

type ApprovalStatus = "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === "approved")
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-amber-600 border-amber-300 dark:border-amber-700">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </Badge>
  );
}

function formatDuration(clockIn: Date | string, clockOut: Date | string | null) {
  if (!clockOut) return "—";
  const mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function ShiftApproval() {
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Detail dialog state
  const [detailShift, setDetailShift] = useState<any | null>(null);

  const { data: pendingShifts = [], isLoading: loadingPending } = trpc.shifts.listForApproval.useQuery({ status: "pending" });
  const { data: approvedShifts = [], isLoading: loadingApproved } = trpc.shifts.listForApproval.useQuery({ status: "approved" });
  const { data: rejectedShifts = [], isLoading: loadingRejected } = trpc.shifts.listForApproval.useQuery({ status: "rejected" });
  const { data: pendingCount = 0 } = trpc.shifts.countPending.useQuery(undefined, { refetchInterval: 30_000 });

  const { data: employees = [] } = trpc.employees.list.useQuery();

  const approveMutation = trpc.shifts.approve.useMutation({
    onSuccess: () => {
      utils.shifts.listForApproval.invalidate();
      utils.shifts.countPending.invalidate();
      setSelectedIds(new Set());
      toast.success("Shift approved successfully.");
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.shifts.reject.useMutation({
    onSuccess: () => {
      utils.shifts.listForApproval.invalidate();
      utils.shifts.countPending.invalidate();
      setRejectTarget(null);
      setRejectReason("");
      toast.success("Shift rejected.");
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkApproveMutation = trpc.shifts.bulkApprove.useMutation({
    onSuccess: (data) => {
      utils.shifts.listForApproval.invalidate();
      utils.shifts.countPending.invalidate();
      setSelectedIds(new Set());
      toast.success(`${data.count} shift${data.count === 1 ? "" : "s"} approved.`);
    },
    onError: (e) => toast.error(e.message),
  });

  // Filter helpers
  const filterShifts = (shifts: any[]) => {
    let filtered = shifts;
    if (employeeFilter !== "all") {
      filtered = filtered.filter((s) => String(s.employeeId) === employeeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.employeeName?.toLowerCase().includes(q) ||
          format(new Date(s.clockIn), "dd MMM yyyy").toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const shiftsByTab: Record<ApprovalStatus, any[]> = {
    pending: filterShifts(pendingShifts as any[]),
    approved: filterShifts(approvedShifts as any[]),
    rejected: filterShifts(rejectedShifts as any[]),
  };

  const currentShifts = shiftsByTab[activeTab];
  const isLoading = activeTab === "pending" ? loadingPending : activeTab === "approved" ? loadingApproved : loadingRejected;

  // Selection helpers
  const allSelected = currentShifts.length > 0 && currentShifts.every((s) => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentShifts.map((s) => s.id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Summary stats
  const totalPendingHours = useMemo(
    () => (pendingShifts as any[]).reduce((sum, s) => sum + parseFloat(s.hoursWorked || "0"), 0),
    [pendingShifts]
  );
  const totalPendingEarnings = useMemo(
    () => (pendingShifts as any[]).reduce((sum, s) => sum + parseFloat(s.earnings || "0"), 0),
    [pendingShifts]
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-purple-500" />
          Shift Approval
        </h1>
        <p className="text-muted-foreground mt-1">
          Review, approve, or reject employee shift logs before they feed into payroll.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPendingHours.toFixed(1)} h</p>
                <p className="text-xs text-muted-foreground">Pending hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R {totalPendingEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Pending earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employee or date…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={employeeFilter} onValueChange={(v) => { setEmployeeFilter(v); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-48">
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {(employees as any[]).map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bulk actions */}
        {activeTab === "pending" && someSelected && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 gap-1.5"
              disabled={bulkApproveMutation.isPending}
              onClick={() => bulkApproveMutation.mutate({ shiftIds: Array.from(selectedIds) })}
            >
              {bulkApproveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve {selectedIds.size} selected
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ApprovalStatus); setSelectedIds(new Set()); }}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-3.5 h-3.5" />
            Pending
            {pendingCount > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as ApprovalStatus[]).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                {isLoading && activeTab === tab ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : shiftsByTab[tab].length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    {tab === "pending" ? (
                      <>
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
                        <p className="font-medium">All caught up!</p>
                        <p className="text-sm mt-1">No shifts are waiting for review.</p>
                      </>
                    ) : (
                      <>
                        <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No {tab} shifts found.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tab === "pending" && (
                          <TableHead className="w-10">
                            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                          </TableHead>
                        )}
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Earnings</TableHead>
                        {tab !== "pending" && <TableHead>Status</TableHead>}
                        {tab !== "pending" && <TableHead>Reviewed by</TableHead>}
                        {tab === "rejected" && <TableHead>Reason</TableHead>}
                        {tab === "pending" && <TableHead className="text-right">Actions</TableHead>}
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shiftsByTab[tab].map((shift: any) => (
                        <TableRow
                          key={shift.id}
                          className={selectedIds.has(shift.id) ? "bg-purple-50 dark:bg-purple-900/10" : ""}
                        >
                          {tab === "pending" && (
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(shift.id)}
                                onCheckedChange={() => toggleOne(shift.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {shift.employeeName || <span className="italic text-muted-foreground">Unknown</span>}
                          </TableCell>
                          <TableCell>{format(new Date(shift.clockIn), "EEE, dd MMM yyyy")}</TableCell>
                          <TableCell>{format(new Date(shift.clockIn), "HH:mm")}</TableCell>
                          <TableCell>
                            {shift.clockOut ? format(new Date(shift.clockOut), "HH:mm") : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDuration(shift.clockIn, shift.clockOut)}
                          </TableCell>
                          <TableCell>
                            {shift.hoursWorked ? `${parseFloat(shift.hoursWorked).toFixed(2)} h` : "—"}
                          </TableCell>
                          <TableCell className="font-medium text-green-700 dark:text-green-400">
                            {shift.earnings ? `R ${parseFloat(shift.earnings).toFixed(2)}` : "—"}
                          </TableCell>
                          {tab !== "pending" && (
                            <TableCell><StatusBadge status={shift.approvalStatus} /></TableCell>
                          )}
                          {tab !== "pending" && (
                            <TableCell className="text-muted-foreground text-sm">
                              {shift.approvedByName || "—"}
                              {shift.approvedAt && (
                                <span className="block text-xs opacity-60">
                                  {format(new Date(shift.approvedAt), "dd MMM HH:mm")}
                                </span>
                              )}
                            </TableCell>
                          )}
                          {tab === "rejected" && (
                            <TableCell className="text-sm text-red-600 dark:text-red-400 max-w-[180px] truncate">
                              {shift.rejectionReason || <span className="italic text-muted-foreground">No reason given</span>}
                            </TableCell>
                          )}
                          {tab === "pending" && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 h-7 px-2.5 text-xs"
                                  disabled={approveMutation.isPending}
                                  onClick={() => approveMutation.mutate({ shiftId: shift.id })}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => setRejectTarget({ id: shift.id, name: shift.employeeName || "this shift" })}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => setDetailShift(shift)}
                            >
                              <Info className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={rejectTarget !== null} onOpenChange={() => { setRejectTarget(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reject Shift
            </DialogTitle>
            <DialogDescription>
              Rejecting the shift for <strong>{rejectTarget?.name}</strong>. Optionally provide a reason — the employee will see this in their shift history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejectReason">Reason (optional)</Label>
            <Textarea
              id="rejectReason"
              placeholder="e.g. Clock-in time does not match schedule, please contact your manager."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => rejectTarget && rejectMutation.mutate({ shiftId: rejectTarget.id, reason: rejectReason || undefined })}
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={detailShift !== null} onOpenChange={() => setDetailShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              Full record for {detailShift?.employeeName || "this employee"}.
            </DialogDescription>
          </DialogHeader>
          {detailShift && (
            <div className="space-y-3 py-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Employee</p>
                  <p className="font-medium">{detailShift.employeeName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Date</p>
                  <p className="font-medium">{format(new Date(detailShift.clockIn), "EEEE, dd MMMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Clock In</p>
                  <p className="font-medium">{format(new Date(detailShift.clockIn), "HH:mm:ss")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Clock Out</p>
                  <p className="font-medium">{detailShift.clockOut ? format(new Date(detailShift.clockOut), "HH:mm:ss") : "Still active"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Duration</p>
                  <p className="font-medium">{formatDuration(detailShift.clockIn, detailShift.clockOut)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Hours Worked</p>
                  <p className="font-medium">{detailShift.hoursWorked ? `${parseFloat(detailShift.hoursWorked).toFixed(2)} h` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Earnings</p>
                  <p className="font-medium text-green-700 dark:text-green-400">{detailShift.earnings ? `R ${parseFloat(detailShift.earnings).toFixed(2)}` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Status</p>
                  <StatusBadge status={detailShift.approvalStatus} />
                </div>
                {detailShift.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Notes</p>
                    <p>{detailShift.notes}</p>
                  </div>
                )}
                {detailShift.approvedByName && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Reviewed by</p>
                    <p>{detailShift.approvedByName} on {detailShift.approvedAt ? format(new Date(detailShift.approvedAt), "dd MMM yyyy HH:mm") : "—"}</p>
                  </div>
                )}
                {detailShift.rejectionReason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Rejection reason</p>
                    <p className="text-red-600 dark:text-red-400">{detailShift.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailShift(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
