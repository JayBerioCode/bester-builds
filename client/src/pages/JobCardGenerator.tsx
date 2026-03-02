import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
function GenerateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: invoices = [], isLoading: loadingInvoices } = trpc.jobCards.listInvoicesWithPO.useQuery(undefined, { enabled: open });

  const [step, setStep] = useState<"pick" | "form">("pick");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
  const [status, setStatus] = useState(jobCard?.jobCard?.status ?? "pending");

  const updateMutation = trpc.jobCards.update.useMutation({
    onSuccess: () => {
      utils.jobCards.list.invalidate();
      toast.success("Job card status updated.");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Status — {jobCard?.jobCard?.jobCardNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => updateMutation.mutate({ id: jobCard.jobCard.id, status: status as any })}
            disabled={updateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JobCardGenerator() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: jobCards = [], isLoading } = trpc.jobCards.list.useQuery(
    activeTab === "all" ? undefined : { status: activeTab },
    { refetchInterval: 30_000 }
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
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-purple-500" />
            Job Card Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate printable job cards from invoices with purchase order numbers.
          </p>
        </div>
        <Button
          onClick={() => setGenerateOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          New Job Card
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
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

      {/* Tabs + Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                    {filtered.map((jc: any) => (
                      <TableRow key={jc.jobCard.id}>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {jc.jobCard.dueDate ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(jc.jobCard.dueDate), "dd MMM yyyy")}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={jc.jobCard.status} />
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <GenerateDialog open={generateOpen} onClose={() => setGenerateOpen(false)} />
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
