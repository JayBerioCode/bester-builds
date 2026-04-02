import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, ClipboardList, Search, Trash2, ChevronRight, FileText, Calculator, CheckCircle2, AlertCircle, PackagePlus } from "lucide-react";
import { useLocation } from "wouter";

const statusColors: Record<string, string> = {
  quote: "bg-gray-100 text-gray-600",
  confirmed: "bg-blue-100 text-blue-700",
  in_production: "bg-violet-100 text-violet-700",
  quality_check: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  dispatched: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  normal: "bg-blue-50 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-700",
};

const statusFlow = ["quote", "confirmed", "in_production", "quality_check", "ready", "dispatched", "delivered"];

// Unit conversion helpers → always work in metres
const toMetres = (value: number, unit: string): number => {
  switch (unit) {
    case "mm": return value / 1000;
    case "cm": return value / 100;
    case "inch": return value * 0.0254;
    case "ft": return value * 0.3048;
    default: return value; // already metres
  }
};

function OrderForm({ onSuccess, customers }: { onSuccess: () => void; customers: any[] }) {
  const utils = trpc.useUtils();
  const create = trpc.orders.create.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Order created"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    description: "",
    status: "quote",
    priority: "normal",
    printType: "banner",
    width: "",
    height: "",
    dimensionUnit: "m",
    quantity: "1",
    material: "",
    finishing: "",
    subtotal: "",
    taxRate: "15",
    total: "",
    dueDate: "",
    deliveryMethod: "pickup",
    deliveryAddress: "",
    notes: "",
  });

  // Calculator state
  const [calcResult, setCalcResult] = useState<null | {
    sqm: number;
    unitCost: number;
    subtotal: number;
    lineItems: { description: string; quantity: string; unitPrice: string; total: string }[];
    rateUsed: { material: string; ratePerSqm: number; setupFee: number; minCharge: number };
  }>(null);
  const [addLamination, setAddLamination] = useState(false);
  const [addEyelets, setAddEyelets] = useState(false);
  const [calcApplied, setCalcApplied] = useState(false);

  // Fetch pricing rates for the selected print type
  const { data: allRates = [] } = trpc.orders.getPricingRates.useQuery(
    { printType: form.printType },
    { enabled: !!form.printType }
  );
  const availableMaterials = useMemo(() => {
    const seen = new Set<string>();
    return allRates.filter((r) => { if (seen.has(r.material)) return false; seen.add(r.material); return true; });
  }, [allRates]);

  const calculateCost = trpc.orders.calculateCost.useMutation({
    onSuccess: (result) => {
      setCalcResult(result);
      setCalcApplied(false);
    },
    onError: (e) => toast.error(`Calculator: ${e.message}`),
  });

  const handleCalculate = () => {
    const w = parseFloat(form.width);
    const h = parseFloat(form.height);
    if (!w || !h) { toast.error("Enter width and height to calculate"); return; }
    if (!form.material) { toast.error("Select a material to calculate"); return; }
    calculateCost.mutate({
      printType: form.printType,
      material: form.material,
      widthM: toMetres(w, form.dimensionUnit),
      heightM: toMetres(h, form.dimensionUnit),
      quantity: parseInt(form.quantity) || 1,
      addLamination,
      addEyelets,
    });
  };

  const applyCalculation = () => {
    if (!calcResult) return;
    setForm((f) => ({ ...f, subtotal: calcResult.subtotal.toFixed(2) }));
    setCalcApplied(true);
    toast.success("Calculated price applied to order");
  };

  const calcTotal = (sub: string, tax: string) => {
    const s = parseFloat(sub) || 0;
    const t = (s * (parseFloat(tax) || 0)) / 100;
    return (s + t).toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) { toast.error("Please select a customer"); return; }
    const taxAmount = ((parseFloat(form.subtotal) || 0) * (parseFloat(form.taxRate) || 0) / 100).toFixed(2);
    create.mutate({
      customerId: parseInt(form.customerId),
      title: form.title,
      description: form.description,
      status: form.status as any,
      priority: form.priority as any,
      printType: form.printType as any,
      width: form.width || undefined,
      height: form.height || undefined,
      dimensionUnit: form.dimensionUnit as any,
      quantity: parseInt(form.quantity) || 1,
      material: form.material,
      finishing: form.finishing,
      subtotal: form.subtotal,
      taxRate: form.taxRate,
      taxAmount,
      total: calcTotal(form.subtotal, form.taxRate),
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      deliveryMethod: form.deliveryMethod as any,
      deliveryAddress: form.deliveryAddress,
      notes: form.notes,
      items: calcResult && calcApplied ? calcResult.lineItems as any : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Customer & Title ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Customer *</Label>
          <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
            <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.company ? ` — ${c.company}` : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Job Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. 3m × 1m Vinyl Banner — ABC Corp" />
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Delivery</Label>
          <Select value={form.deliveryMethod} onValueChange={(v) => setForm({ ...form, deliveryMethod: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="courier">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* ── Print Cost Calculator ── */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-violet-600" />
          <span className="font-semibold text-violet-800 text-sm">Print Cost Calculator</span>
          <span className="text-xs text-violet-500 ml-auto">Auto-calculates price from dimensions</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Print Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Print Type</Label>
            <Select value={form.printType} onValueChange={(v) => { setForm({ ...form, printType: v, material: "" }); setCalcResult(null); setCalcApplied(false); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["banner","poster","signage","vehicle_wrap","canvas","fabric","wallpaper","floor_graphic","window_graphic","other"].map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material — driven by pricing rates */}
          <div className="space-y-1.5">
            <Label className="text-xs">Material / Substrate</Label>
            <Select value={form.material} onValueChange={(v) => { setForm({ ...form, material: v }); setCalcResult(null); setCalcApplied(false); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select material..." /></SelectTrigger>
              <SelectContent>
                {availableMaterials.map((r) => (
                  <SelectItem key={r.id} value={r.material}>
                    {r.material} — R{parseFloat(r.ratePerSqm).toFixed(0)}/m²
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Width */}
          <div className="space-y-1.5">
            <Label className="text-xs">Width</Label>
            <Input className="h-8 text-xs" type="number" step="0.01" min="0.01" value={form.width}
              onChange={(e) => { setForm({ ...form, width: e.target.value }); setCalcResult(null); setCalcApplied(false); }}
              placeholder="3.0" />
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <Label className="text-xs">Height</Label>
            <Input className="h-8 text-xs" type="number" step="0.01" min="0.01" value={form.height}
              onChange={(e) => { setForm({ ...form, height: e.target.value }); setCalcResult(null); setCalcApplied(false); }}
              placeholder="1.0" />
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <Label className="text-xs">Unit</Label>
            <Select value={form.dimensionUnit} onValueChange={(v) => { setForm({ ...form, dimensionUnit: v }); setCalcResult(null); setCalcApplied(false); }}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">mm</SelectItem>
                <SelectItem value="cm">cm</SelectItem>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="inch">inch</SelectItem>
                <SelectItem value="ft">ft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label className="text-xs">Quantity</Label>
            <Input className="h-8 text-xs" type="number" min="1" value={form.quantity}
              onChange={(e) => { setForm({ ...form, quantity: e.target.value }); setCalcResult(null); setCalcApplied(false); }} />
          </div>
        </div>

        {/* Finishing options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={addLamination} onChange={(e) => { setAddLamination(e.target.checked); setCalcResult(null); setCalcApplied(false); }} className="rounded" />
            <span>Add Lamination</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={addEyelets} onChange={(e) => { setAddEyelets(e.target.checked); setCalcResult(null); setCalcApplied(false); }} className="rounded" />
            <span>Add Eyelets / Hem</span>
          </label>
        </div>

        {/* Calculate button */}
        <Button type="button" size="sm" variant="outline"
          className="w-full border-violet-300 text-violet-700 hover:bg-violet-100 text-xs"
          disabled={calculateCost.isPending}
          onClick={handleCalculate}
        >
          <Calculator className="h-3.5 w-3.5 mr-1.5" />
          {calculateCost.isPending ? "Calculating..." : "Calculate Price"}
        </Button>

        {/* Result panel */}
        {calcResult && (
          <div className="rounded-lg bg-white border border-violet-200 p-3 space-y-2">
            <div className="text-xs font-semibold text-violet-700 mb-1">Price Breakdown</div>
            <div className="space-y-1">
              {calcResult.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex-1 pr-2">{item.description}</span>
                  <span className="font-medium shrink-0">R {parseFloat(item.total).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-bold text-violet-800">
              <span>Subtotal (excl. VAT)</span>
              <span>R {calcResult.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {calcResult.sqm.toFixed(2)} m² · Rate: R{calcResult.rateUsed.ratePerSqm}/m² · Min charge: R{calcResult.rateUsed.minCharge}
            </div>
            {calcApplied ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Applied to order
              </div>
            ) : (
              <Button type="button" size="sm" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs" onClick={applyCalculation}>
                Apply to Order
              </Button>
            )}
          </div>
        )}

        {/* Finishing notes */}
        <div className="space-y-1.5">
          <Label className="text-xs">Finishing Notes</Label>
          <Input className="h-8 text-xs" value={form.finishing} onChange={(e) => setForm({ ...form, finishing: e.target.value })} placeholder="e.g. Gloss laminate, eyelets every 500mm" />
        </div>
      </div>

      {/* ── Pricing (manual override) ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            Subtotal (ZAR)
            {calcApplied && <Badge className="text-[9px] px-1.5 py-0 bg-violet-100 text-violet-700">Calculated</Badge>}
          </Label>
          <Input type="number" value={form.subtotal} onChange={(e) => { setForm({ ...form, subtotal: e.target.value }); setCalcApplied(false); }} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>VAT Rate (%)</Label>
          <Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
        </div>
        {form.subtotal && (
          <div className="col-span-2 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>R {parseFloat(form.subtotal || "0").toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT ({form.taxRate}%)</span>
              <span>R {((parseFloat(form.subtotal) || 0) * (parseFloat(form.taxRate) || 0) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t mt-1 pt-1">
              <span>Total</span>
              <span>R {calcTotal(form.subtotal, form.taxRate)}</span>
            </div>
          </div>
        )}
        {!calcApplied && form.width && form.height && form.material && (
          <div className="col-span-2 flex items-center gap-1.5 text-xs text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Click "Calculate Price" above to get an accurate quote from your pricing rates.
          </div>
        )}
      </div>

      {/* ── Scheduling ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Delivery Address</Label>
          <Input value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Leave blank for pickup" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Client instructions, artwork notes, etc." />
      </div>

      <Button type="submit" className="w-full" disabled={create.isPending}>
        {create.isPending ? "Creating..." : "Create Order / Quote"}
      </Button>
    </form>
  );
}

export default function Orders() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editOrder, setEditOrder] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [convertingOrderId, setConvertingOrderId] = useState<number | null>(null);
  const [logMaterialsOrder, setLogMaterialsOrder] = useState<any>(null);
  const [logMaterialsOpen, setLogMaterialsOpen] = useState(false);
  const [logQty, setLogQty] = useState("");
  const [logUnitCost, setLogUnitCost] = useState("");
  const [logItemId, setLogItemId] = useState("none");
  const [logNotes, setLogNotes] = useState("");
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: orders = [], isLoading } = trpc.orders.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: customers = [] } = trpc.crm.listCustomers.useQuery();
  const deleteOrder = trpc.orders.delete.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Order deleted"); },
  });
  const updateOrder = trpc.orders.update.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Status updated"); },
  });
  const { data: inventoryItems = [] } = trpc.inventory.listItems.useQuery({});
  const logUsage = trpc.jobCosting.logUsage.useMutation({
    onSuccess: () => {
      toast.success("Material usage logged successfully!");
      setLogMaterialsOpen(false);
      setLogQty(""); setLogUnitCost(""); setLogItemId("none"); setLogNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const convertToInvoice = trpc.orders.convertToInvoice.useMutation({
    onSuccess: (invoice) => {
      utils.orders.list.invalidate();
      toast.success(`Invoice ${invoice?.invoiceNumber ?? ""} created successfully!`, {
        description: "Order advanced to Confirmed. Redirecting to Invoices...",
        duration: 3000,
      });
      setConvertingOrderId(null);
      setTimeout(() => navigate("/invoices"), 1500);
    },
    onError: (e) => { toast.error(e.message); setConvertingOrderId(null); },
  });

  const filtered = orders.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerName = (id: number) => customers.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Print job management &amp; production tracking"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Order</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Order / Quote</DialogTitle></DialogHeader>
              <OrderForm onSuccess={() => setOpen(false)} customers={customers} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Status Pipeline */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All ({orders.length})
        </Button>
        {statusFlow.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} ({count})
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1];
            return (
              <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
                        <Badge className={`text-[10px] px-2 py-0 ${statusColors[order.status]}`}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={`text-[10px] px-2 py-0 ${priorityColors[order.priority]}`}>
                          {order.priority}
                        </Badge>
                        {order.printType && order.printType !== "other" && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0">
                            {order.printType.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-foreground mt-1">{order.title}</p>
                      <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span>Client: {getCustomerName(order.customerId)}</span>
                        {order.width && order.height && (
                          <span>{order.width} × {order.height} {order.dimensionUnit}</span>
                        )}
                        {order.quantity && order.quantity > 1 && <span>Qty: {order.quantity}</span>}
                        {order.material && <span>Material: {order.material}</span>}
                        {order.dueDate && <span>Due: {new Date(order.dueDate).toLocaleDateString()}</span>}
                        {order.total && <span className="font-semibold text-foreground">R {parseFloat(order.total as string).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* One-click quote-to-invoice conversion */}
                      {order.status === "quote" && (
                        <Button
                          size="sm"
                          className="text-xs bg-violet-600 hover:bg-violet-700 text-white gap-1"
                          disabled={convertingOrderId === order.id}
                          onClick={() => {
                            if (!confirm(`Convert "${order.title}" to an invoice?\n\nThis will:\n• Create a new draft invoice\n• Advance the order to Confirmed\n\nTotal: R ${parseFloat(order.total as string || "0").toLocaleString()}`)) return;
                            setConvertingOrderId(order.id);
                            convertToInvoice.mutate({
                              orderId: order.id,
                              taxRate: "15",
                              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            });
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {convertingOrderId === order.id ? "Creating..." : "Create Invoice"}
                        </Button>
                      )}
                      {nextStatus && order.status !== "cancelled" && order.status !== "quote" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => updateOrder.mutate({ id: order.id, status: nextStatus as any })}
                        >
                          <ChevronRight className="h-3.5 w-3.5 mr-1" />
                          {nextStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => { setLogMaterialsOrder(order); setLogMaterialsOpen(true); }}
                        title="Log materials used"
                      >
                        <PackagePlus className="h-3.5 w-3.5" />
                        Materials
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Delete this order?")) deleteOrder.mutate({ id: order.id }); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Log Materials Dialog */}
      <Dialog open={logMaterialsOpen} onOpenChange={setLogMaterialsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Material Usage</DialogTitle>
          </DialogHeader>
          {logMaterialsOrder && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Recording actual materials consumed for <span className="font-semibold text-foreground">{logMaterialsOrder.orderNumber} — {logMaterialsOrder.title}</span>
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Inventory Item *</Label>
                  <Select value={logItemId} onValueChange={setLogItemId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select material from inventory..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select an item...</SelectItem>
                      {inventoryItems.map((item: any) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name} ({item.unit}) — R {parseFloat(item.unitCost ?? "0").toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Quantity Used *</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="e.g. 2.5"
                      value={logQty}
                      onChange={(e) => {
                        setLogQty(e.target.value);
                        const item = inventoryItems.find((i: any) => String(i.id) === logItemId);
                        if (item && e.target.value) {
                          const total = parseFloat(e.target.value) * parseFloat(item.unitCost ?? "0");
                          setLogUnitCost(parseFloat(item.unitCost ?? "0").toFixed(2));
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unit Cost (R) *</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 45.00"
                      value={logUnitCost}
                      onChange={(e) => setLogUnitCost(e.target.value)}
                    />
                  </div>
                </div>
                {logQty && logUnitCost && (
                  <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 text-sm">
                    <span className="text-muted-foreground">Total Material Cost: </span>
                    <span className="font-bold text-violet-700">
                      R {(parseFloat(logQty) * parseFloat(logUnitCost)).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    className="mt-1 text-sm"
                    rows={2}
                    placeholder="e.g. 3m² PVC banner, includes waste"
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  disabled={!logItemId || logItemId === "none" || !logQty || !logUnitCost || logUsage.isPending}
                  onClick={() => {
                    const total = (parseFloat(logQty) * parseFloat(logUnitCost)).toFixed(2);
                    logUsage.mutate({
                      orderId: logMaterialsOrder.id,
                      inventoryItemId: parseInt(logItemId),
                      quantityUsed: parseFloat(logQty).toFixed(3),
                      unitCost: parseFloat(logUnitCost).toFixed(2),
                      totalCost: total,
                      notes: logNotes || undefined,
                    });
                  }}
                >
                  {logUsage.isPending ? "Logging..." : "Log Usage"}
                </Button>
                <Button variant="outline" onClick={() => setLogMaterialsOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
