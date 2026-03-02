import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, ClipboardList, Search, Trash2, ChevronRight, FileText } from "lucide-react";
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
    printType: "other",
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

  const calcTotal = (sub: string, tax: string, disc = "0") => {
    const s = parseFloat(sub) || 0;
    const t = (s * (parseFloat(tax) || 0)) / 100;
    const d = parseFloat(disc) || 0;
    return (s + t - d).toFixed(2);
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
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. 3m x 1m Vinyl Banner — ABC Corp" />
        </div>
        <div className="space-y-1.5">
          <Label>Print Type</Label>
          <Select value={form.printType} onValueChange={(v) => setForm({ ...form, printType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["banner","poster","signage","vehicle_wrap","canvas","fabric","wallpaper","floor_graphic","window_graphic","other"].map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label>Width</Label>
          <Input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} placeholder="3.0" />
        </div>
        <div className="space-y-1.5">
          <Label>Height</Label>
          <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="1.0" />
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={form.dimensionUnit} onValueChange={(v) => setForm({ ...form, dimensionUnit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">mm</SelectItem>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="m">m</SelectItem>
              <SelectItem value="inch">inch</SelectItem>
              <SelectItem value="ft">ft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
        </div>
        <div className="space-y-1.5">
          <Label>Material</Label>
          <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="e.g. Gloss Vinyl 440gsm" />
        </div>
        <div className="space-y-1.5">
          <Label>Finishing</Label>
          <Input value={form.finishing} onChange={(e) => setForm({ ...form, finishing: e.target.value })} placeholder="e.g. Laminated, Eyelets" />
        </div>
        <div className="space-y-1.5">
          <Label>Subtotal (ZAR)</Label>
          <Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Tax Rate (%)</Label>
          <Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Delivery Method</Label>
          <Select value={form.deliveryMethod} onValueChange={(v) => setForm({ ...form, deliveryMethod: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="courier">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.subtotal && (
          <div className="col-span-2 p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>R {parseFloat(form.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>VAT ({form.taxRate}%)</span><span>R {((parseFloat(form.subtotal) || 0) * (parseFloat(form.taxRate) || 0) / 100).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Total</span><span>R {calcTotal(form.subtotal, form.taxRate)}</span></div>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>Create Order</Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground text-sm">Print job management &amp; production tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Order / Quote</DialogTitle></DialogHeader>
            <OrderForm onSuccess={() => setOpen(false)} customers={customers} />
          </DialogContent>
        </Dialog>
      </div>

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
              className="whitespace-nowrap"
            >
              {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} ({count})
            </Button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
    </div>
  );
}
