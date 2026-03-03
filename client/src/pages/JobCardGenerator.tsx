import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { JobCardKanban, isOverdue } from "@/components/JobCardKanban";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  FileText,
  Plus,
  Download,
  Search,
  ClipboardList,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  PlayCircle,
  Building2,
  Hash,
  Printer,
  Calendar,
  User,
  LayoutList,
  Columns,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Status helpers ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0", icon: <Clock className="w-3 h-3" /> },
    in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0", icon: <PlayCircle className="w-3 h-3" /> },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0", icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0", icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <Badge className={`text-xs gap-1 ${s.className}`}>
      {s.icon} {s.label}
    </Badge>
  );
}

// ─── Generate Dialog ──────────────────────────────────────────────────────────
function GenerateDialog({ open, onClose, preselectedInvoiceId }: { open: boolean; onClose: () => void; preselectedInvoiceId?: number }) {
  const utils = trpc.useUtils();
  const { data: invoices = [], isLoading: loadingInvoices } = trpc.jobCards.listInvoicesWithPO.useQuery(undefined, { enabled: open });
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Auto-select invoice when opened via deep-link
  useEffect(() => {
    if (open && preselectedInvoiceId && invoices.length > 0 && !selectedInvoice) {
      const match = (invoices as any[]).find((inv) => inv.invoice?.id === preselectedInvoiceId);
      if (match) handleSelectInvoice(match);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedInvoiceId, invoices]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    jobTitle: "",
    assignedToName: "",
    dueDate: "",
    printType: "",
    width: "",
    height: "",
    dimensionUnit: "m",
    quantity: "1",
    material: "",
    finishing: "",
    instructions: "",
    notes: "",
    fileUrl: "",
  });

  const createMutation = trpc.jobCards.create.useMutation({
    onSuccess: () => {
      utils.jobCards.list.invalidate();
      toast.success("Job card created successfully!");
      handleClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleClose = () => {
    setStep("pick");
    setSelectedInvoice(null);
    setSearch("");
    setForm({
      jobTitle: "", assignedToName: "", dueDate: "", printType: "",
      width: "", height: "", dimensionUnit: "m", quantity: "1",
      material: "", finishing: "", instructions: "", notes: "", fileUrl: "",
    });
    onClose();
  };

  const handleSelectInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    // Pre-fill from order data
    setForm((f) => ({
      ...f,
      jobTitle: inv.order?.title ?? `Job for ${inv.customer?.name ?? "Customer"}`,
      printType: inv.order?.printType ?? "",
      width: inv.order?.width ?? "",
      height: inv.order?.height ?? "",
      dimensionUnit: inv.order?.dimensionUnit ?? "m",
      quantity: String(inv.order?.quantity ?? 1),
      material: inv.order?.material ?? "",
      finishing: inv.order?.finishing ?? "",
      dueDate: inv.order?.dueDate ? format(new Date(inv.order.dueDate), "yyyy-MM-dd") : "",
      fileUrl: inv.order?.fileUrl ?? "",
    }));
    setStep("form");
  };

  const handleSubmit = () => {
    if (!selectedInvoice) return;
    createMutation.mutate({
      invoiceId: selectedInvoice.invoice.id,
      poNumber: selectedInvoice.invoice.poNumber,
      jobTitle: form.jobTitle,
      customerName: selectedInvoice.customer?.name,
      assignedToName: form.assignedToName || undefined,
      dueDate: form.dueDate || undefined,
      printType: form.printType || undefined,
      width: form.width || undefined,
      height: form.height || undefined,
      dimensionUnit: form.dimensionUnit || undefined,
      quantity: parseInt(form.quantity) || 1,
      material: form.material || undefined,
      finishing: form.finishing || undefined,
      instructions: form.instructions || undefined,
      notes: form.notes || undefined,
      fileUrl: form.fileUrl || undefined,
    });
  };

  const filtered = (invoices as any[]).filter((inv) => {
    const q = search.toLowerCase();
    return !q ||
      inv.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
      inv.invoice?.poNumber?.toLowerCase().includes(q) ||
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.company?.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            {step === "pick" ? "Select Invoice with PO Number" : "Configure Job Card"}
          </DialogTitle>
        </DialogHeader>

        {step === "pick" ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice, PO number, or customer…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loadingInvoices ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Hash className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No invoices with PO numbers found.</p>
                <p className="text-sm mt-1">
                  Open an invoice and add a Purchase Order number to it first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filtered.map((inv: any) => (
                  <button
                    key={inv.invoice.id}
                    className="w-full text-left p-3 rounded-lg border hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                    onClick={() => handleSelectInvoice(inv)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{inv.invoice.invoiceNumber}</span>
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 gap-1">
                            <Hash className="w-2.5 h-2.5" /> PO: {inv.invoice.poNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                          <Building2 className="w-3.5 h-3.5" />
                          {inv.customer?.company ?? inv.customer?.name ?? "Unknown Customer"}
                        </div>
                        {inv.order && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {inv.order.title}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">R {parseFloat(inv.invoice.total ?? "0").toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(inv.invoice.issueDate ?? inv.invoice.createdAt), "dd MMM yyyy")}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Selected invoice summary */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{selectedInvoice?.invoice?.invoiceNumber}</p>
                <p className="text-xs text-muted-foreground">
                  PO: {selectedInvoice?.invoice?.poNumber} · {selectedInvoice?.customer?.name}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setStep("pick")}>
                Change
              </Button>
            </div>

            {/* Job title */}
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. 3m × 1m Banner — Main Street" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Assigned To</Label>
                <Input value={form.assignedToName} onChange={(e) => setForm({ ...form, assignedToName: e.target.value })} placeholder="Staff member name" />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            {/* Print specs */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Print Specifications</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Print Type</Label>
                  <Select value={form.printType} onValueChange={(v) => setForm({ ...form, printType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {["banner","poster","signage","vehicle_wrap","canvas","fabric","wallpaper","floor_graphic","window_graphic","other"].map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity</Label>
                  <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Width</Label>
                  <Input value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} placeholder="e.g. 3.0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Height</Label>
                  <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="e.g. 1.0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select value={form.dimensionUnit} onValueChange={(v) => setForm({ ...form, dimensionUnit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["mm","cm","m","inch","ft"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Material</Label>
                  <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. PVC Flex 440gsm" />
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                <Label>Finishing</Label>
                <Input value={form.finishing} onChange={(e) => setForm({ ...form, finishing: e.target.value })} placeholder="e.g. Eyelets every 500mm, hemmed edges" />
              </div>
            </div>

            {/* Instructions & notes */}
            <div className="space-y-1.5">
              <Label>Production Instructions</Label>
              <Textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Special instructions for the production team…" />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes (not printed on job card)…" />
            </div>
            <div className="space-y-1.5">
              <Label>Artwork File URL</Label>
              <Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>
        )}

        {step === "form" && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStep("pick")}>Back</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.jobTitle || createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Job Card
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Update Status Dialog ─────────────────────────────────────────────────────
function UpdateStatusDialog({ jobCard, open, onClose }: { jobCard: any; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const jc = jobCard?.jobCard ?? {};
  const [form, setForm] = useState({
    jobTitle: jc.jobTitle ?? "",
    customerName: jc.customerName ?? "",
    poNumber: jc.poNumber ?? "",
    status: jc.status ?? "pending",
    assignedToName: jc.assignedToName ?? "",
    dueDate: jc.dueDate ? new Date(jc.dueDate).toISOString().split("T")[0] : "",
    printType: jc.printType ?? "",
    width: jc.width ?? "",
    height: jc.height ?? "",
    dimensionUnit: jc.dimensionUnit ?? "m",
    quantity: String(jc.quantity ?? 1),
    material: jc.material ?? "",
    finishing: jc.finishing ?? "",
    instructions: jc.instructions ?? "",
    notes: jc.notes ?? "",
    fileUrl: jc.fileUrl ?? "",
  });

  // Re-sync form when a different job card is opened
  useEffect(() => {
    if (open && jc.id) {
      setForm({
        jobTitle: jc.jobTitle ?? "",
        customerName: jc.customerName ?? "",
        poNumber: jc.poNumber ?? "",
        status: jc.status ?? "pending",
        assignedToName: jc.assignedToName ?? "",
        dueDate: jc.dueDate ? new Date(jc.dueDate).toISOString().split("T")[0] : "",
        printType: jc.printType ?? "",
        width: jc.width ?? "",
        height: jc.height ?? "",
        dimensionUnit: jc.dimensionUnit ?? "m",
        quantity: String(jc.quantity ?? 1),
        material: jc.material ?? "",
        finishing: jc.finishing ?? "",
        instructions: jc.instructions ?? "",
        notes: jc.notes ?? "",
        fileUrl: jc.fileUrl ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jc.id]);

  const updateMutation = trpc.jobCards.update.useMutation({
    onSuccess: () => {
      utils.jobCards.list.invalidate();
      toast.success("Job card updated.");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            Edit Job Card — {jc.jobCardNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Core details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Customer Name</Label>
              <Input placeholder="Client or company name" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>PO Number</Label>
              <Input placeholder="Optional" value={form.poNumber} onChange={(e) => set("poNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input placeholder="Staff member name" value={form.assignedToName} onChange={(e) => set("assignedToName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Print specs */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Print Specifications</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Print Type</Label>
                <Input placeholder="e.g. Vinyl Banner" value={form.printType} onChange={(e) => set("printType", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Width</Label>
                <Input placeholder="e.g. 3" value={form.width} onChange={(e) => set("width", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Height</Label>
                <Input placeholder="e.g. 1.5" value={form.height} onChange={(e) => set("height", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.dimensionUnit} onValueChange={(v) => set("dimensionUnit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Material</Label>
                <Input placeholder="e.g. 440gsm PVC" value={form.material} onChange={(e) => set("material", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Finishing</Label>
                <Input placeholder="e.g. Hemmed & eyeleted" value={form.finishing} onChange={(e) => set("finishing", e.target.value)} />
              </div>
            </div>
          </div>
          {/* Instructions & notes */}
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Production Instructions</Label>
              <Textarea rows={3} value={form.instructions} onChange={(e) => set("instructions", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Artwork File URL</Label>
              <Input placeholder="https://…" value={form.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => updateMutation.mutate({
              id: jc.id,
              jobTitle: form.jobTitle,
              customerName: form.customerName || null,
              poNumber: form.poNumber || null,
              status: form.status as any,
              assignedToName: form.assignedToName || null,
              dueDate: form.dueDate || null,
              printType: form.printType || null,
              width: form.width || null,
              height: form.height || null,
              dimensionUnit: form.dimensionUnit || null,
              quantity: parseInt(form.quantity) || 1,
              material: form.material || null,
              finishing: form.finishing || null,
              instructions: form.instructions || null,
              notes: form.notes || null,
              fileUrl: form.fileUrl || null,
            })}
            disabled={!form.jobTitle.trim() || updateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manual Job Card Dialog ──────────────────────────────────────────────────
function ManualJobCardDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    jobTitle: "",
    customerName: "",
    poNumber: "",
    assignedToName: "",
    dueDate: "",
    printType: "",
    width: "",
    height: "",
    dimensionUnit: "m",
    quantity: "1",
    material: "",
    finishing: "",
    instructions: "",
    notes: "",
    fileUrl: "",
  });
  const createMutation = trpc.jobCards.createManual.useMutation({
    onSuccess: () => {
      utils.jobCards.list.invalidate();
      toast.success("Job card created successfully!");
      handleClose();
    },
    onError: (err) => toast.error(err.message),
  });
  const handleClose = () => {
    setForm({
      jobTitle: "", customerName: "", poNumber: "", assignedToName: "",
      dueDate: "", printType: "", width: "", height: "", dimensionUnit: "m",
      quantity: "1", material: "", finishing: "", instructions: "", notes: "", fileUrl: "",
    });
    onClose();
  };
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="w-full max-w-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-500" />
            Create Manual Job Card
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Banner print for ABC Corp" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Customer Name</Label>
              <Input placeholder="Client or company name" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>PO Number</Label>
              <Input placeholder="Optional purchase order #" value={form.poNumber} onChange={(e) => set("poNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input placeholder="Staff member name" value={form.assignedToName} onChange={(e) => set("assignedToName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Print Specifications</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Print Type</Label>
                <Input placeholder="e.g. Vinyl Banner, Mesh" value={form.printType} onChange={(e) => set("printType", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Width</Label>
                <Input placeholder="e.g. 3" value={form.width} onChange={(e) => set("width", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Height</Label>
                <Input placeholder="e.g. 1.5" value={form.height} onChange={(e) => set("height", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={form.dimensionUnit} onValueChange={(v) => set("dimensionUnit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Material</Label>
                <Input placeholder="e.g. 440gsm PVC" value={form.material} onChange={(e) => set("material", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Finishing</Label>
                <Input placeholder="e.g. Hemmed & eyeleted" value={form.finishing} onChange={(e) => set("finishing", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Production Instructions</Label>
              <Textarea rows={3} placeholder="Special instructions for the production team…" value={form.instructions} onChange={(e) => set("instructions", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes</Label>
              <Textarea rows={2} placeholder="Internal notes (not printed on job card)…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Artwork File URL</Label>
              <Input placeholder="https://…" value={form.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate({
              jobTitle: form.jobTitle,
              customerName: form.customerName || undefined,
              poNumber: form.poNumber || undefined,
              assignedToName: form.assignedToName || undefined,
              dueDate: form.dueDate || undefined,
              printType: form.printType || undefined,
              width: form.width || undefined,
              height: form.height || undefined,
              dimensionUnit: form.dimensionUnit || undefined,
              quantity: parseInt(form.quantity) || 1,
              material: form.material || undefined,
              finishing: form.finishing || undefined,
              instructions: form.instructions || undefined,
              notes: form.notes || undefined,
              fileUrl: form.fileUrl || undefined,
            })}
            disabled={!form.jobTitle.trim() || createMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Job Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobCardGenerator() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [preselectedInvoiceId, setPreselectedInvoiceId] = useState<number | undefined>();
  const [updateTarget, setUpdateTarget] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">(
    () => (localStorage.getItem("jobcards-view") as "list" | "kanban") ?? "list"
  );

  const handleViewMode = (mode: "list" | "kanban") => {
    setViewMode(mode);
    localStorage.setItem("jobcards-view", mode);
  };

  // Read ?invoiceId=X from URL and auto-open the dialog
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("invoiceId");
    if (id) {
      const numId = parseInt(id, 10);
      if (!isNaN(numId)) {
        setPreselectedInvoiceId(numId);
        setGenerateOpen(true);
        // Clean the URL so refreshing doesn't re-trigger
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const utils = trpc.useUtils();
  const { data: jobCards = [], isLoading } = trpc.jobCards.list.useQuery(
    viewMode === "kanban" ? undefined : (activeTab === "all" ? undefined : { status: activeTab }),
    { refetchInterval: 30_000 }
  );
  const updateStatusMutation = trpc.jobCards.update.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.jobCards.list.cancel();
      const prev = utils.jobCards.list.getData();
      utils.jobCards.list.setData(undefined, (old: any) =>
        old?.map((jc: any) =>
          jc.jobCard?.id === id ? { ...jc, jobCard: { ...jc.jobCard, status } } : jc
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.jobCards.list.setData(undefined, ctx.prev);
      toast.error("Failed to update status");
    },
    onSettled: () => utils.jobCards.list.invalidate(),
  });
  const handleKanbanStatusChange = useCallback(
    (id: number, newStatus: string) => {
      updateStatusMutation.mutate({ id, status: newStatus as any });
    },
    [updateStatusMutation]
  );

  const filtered = (jobCards as any[]).filter((jc) => {
    const q = search.toLowerCase();
    return !q ||
      jc.jobCard?.jobCardNumber?.toLowerCase().includes(q) ||
      jc.jobCard?.jobTitle?.toLowerCase().includes(q) ||
      jc.jobCard?.poNumber?.toLowerCase().includes(q) ||
      jc.jobCard?.customerName?.toLowerCase().includes(q) ||
      jc.invoice?.invoiceNumber?.toLowerCase().includes(q);
  });

  const counts = {
    all: (jobCards as any[]).length,
    pending: (jobCards as any[]).filter((j) => j.jobCard?.status === "pending").length,
    in_progress: (jobCards as any[]).filter((j) => j.jobCard?.status === "in_progress").length,
    completed: (jobCards as any[]).filter((j) => j.jobCard?.status === "completed").length,
  };

  return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-500" />
            Job Card Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate printable job cards from invoices with purchase order numbers.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => handleViewMode("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-purple-600 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <LayoutList className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => handleViewMode("kanban")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                viewMode === "kanban"
                  ? "bg-purple-600 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Columns className="w-4 h-4" />
              Kanban
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => setManualOpen(true)}
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4" />
            Manual
          </Button>
          <Button
            onClick={() => setGenerateOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <FileText className="w-4 h-4" />
            From Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total", count: counts.all, color: "purple", icon: <ClipboardList className="w-4 h-4 text-purple-600" /> },
          { label: "Pending", count: counts.pending, color: "amber", icon: <Clock className="w-4 h-4 text-amber-600" /> },
          { label: "In Progress", count: counts.in_progress, color: "blue", icon: <PlayCircle className="w-4 h-4 text-blue-600" /> },
          { label: "Completed", count: counts.completed, color: "green", icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
        ].map(({ label, count, color, icon }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                  {icon}
                </div>
                <div>
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search job cards…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs + Table (List view) */}
      {viewMode === "list" && <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No job cards found.</p>
                  <p className="text-sm mt-1">
                    Click <strong>New Job Card</strong> to generate one from an invoice with a PO number.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Card #</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((jc: any) => {
                      const overdue = isOverdue(jc.jobCard.dueDate, jc.jobCard.status);
                      return (
                      <TableRow
                        key={jc.jobCard.id}
                        className={overdue ? "border-l-4 border-l-red-400 dark:border-l-red-600 bg-red-50/40 dark:bg-red-900/10" : ""}
                      >
                        <TableCell className="font-mono font-semibold text-purple-600 text-sm">
                          {jc.jobCard.jobCardNumber}
                        </TableCell>
                        <TableCell className="font-medium max-w-[180px]">
                          <p className="truncate" title={jc.jobCard.jobTitle}>{jc.jobCard.jobTitle}</p>
                          {jc.jobCard.printType && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Printer className="w-3 h-3" />
                              {jc.jobCard.printType.replace(/_/g, " ")}
                              {jc.jobCard.width && jc.jobCard.height && ` · ${jc.jobCard.width}×${jc.jobCard.height}${jc.jobCard.dimensionUnit ?? "m"}`}
                              {jc.jobCard.quantity && jc.jobCard.quantity > 1 && ` · Qty: ${jc.jobCard.quantity}`}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 gap-1 font-mono">
                            <Hash className="w-2.5 h-2.5" />{jc.jobCard.poNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {jc.invoice?.invoiceNumber ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[120px]" title={jc.jobCard.customerName ?? ""}>
                              {jc.jobCard.customerName ?? "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {jc.jobCard.assignedToName ? (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {jc.jobCard.assignedToName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm ${
                          overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                        }`}>
                          {jc.jobCard.dueDate ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(jc.jobCard.dueDate), "dd MMM yyyy")}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <StatusBadge status={jc.jobCard.status} />
                            {overdue && (
                              <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700 gap-0.5 px-1.5 py-0 w-fit font-semibold">
                                <AlertCircle className="w-2.5 h-2.5" />Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => setUpdateTarget(jc)}
                            >
                              Update
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
                              onClick={() => window.open(`/api/job-cards/${jc.jobCard.id}/pdf`, "_blank")}
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
       </Tabs>}

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : (
            <JobCardKanban
              jobCards={jobCards as any[]}
              onStatusChange={handleKanbanStatusChange}
              onUpdate={(item) => setUpdateTarget(item)}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <ManualJobCardDialog open={manualOpen} onClose={() => setManualOpen(false)} />
      <GenerateDialog open={generateOpen} onClose={() => { setGenerateOpen(false); setPreselectedInvoiceId(undefined); }} preselectedInvoiceId={preselectedInvoiceId} />
      {updateTarget && (
        <UpdateStatusDialog
          jobCard={updateTarget}
          open={!!updateTarget}
          onClose={() => setUpdateTarget(null)}
        />
      )}
    </div>
  );
}
