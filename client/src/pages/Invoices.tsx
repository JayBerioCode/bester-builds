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
import { Plus, FileText, Search, Download, Hash } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-indigo-100 text-indigo-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-400",
};

function InvoiceForm({ onSuccess, customers, orders }: { onSuccess: () => void; customers: any[]; orders: any[] }) {
  const utils = trpc.useUtils();
  const create = trpc.invoices.create.useMutation({
    onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Invoice created"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    customerId: "",
    orderId: "none",
    poNumber: "",
    subtotal: "",
    taxRate: "15",
    discountAmount: "0",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    terms: "Payment due within 30 days. Late payments subject to 2% monthly interest.",
  });

  const sub = parseFloat(form.subtotal) || 0;
  const tax = (sub * (parseFloat(form.taxRate) || 0)) / 100;
  const disc = parseFloat(form.discountAmount) || 0;
  const total = (sub + tax - disc).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) { toast.error("Select a customer"); return; }
    create.mutate({
      customerId: parseInt(form.customerId),
      orderId: form.orderId && form.orderId !== "none" ? parseInt(form.orderId) : undefined,
      poNumber: form.poNumber || undefined,
      subtotal: form.subtotal,
      taxRate: form.taxRate,
      taxAmount: tax.toFixed(2),
      discountAmount: form.discountAmount,
      total,
      amountDue: total,
      dueDate: new Date(form.dueDate),
      notes: form.notes,
      terms: form.terms,
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
          <Label>Linked Order (optional)</Label>
          <Select value={form.orderId} onValueChange={(v) => setForm({ ...form, orderId: v })}>
            <SelectTrigger><SelectValue placeholder="Select order..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No linked order</SelectItem>
              {orders.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.orderNumber} — {o.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="flex items-center gap-1.5">
            Purchase Order Number
            <span className="text-xs font-normal text-muted-foreground">(optional — enables Job Card generation)</span>
          </Label>
          <Input
            value={form.poNumber}
            onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
            placeholder="e.g. PO-2024-001"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Subtotal (ZAR) *</Label>
          <Input type="number" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} required placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Tax Rate (%)</Label>
          <Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Discount (ZAR)</Label>
          <Input type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Due Date *</Label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
        </div>
        {form.subtotal && (
          <div className="col-span-2 p-3 bg-primary/5 rounded-lg text-sm border border-primary/10">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R {sub.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>VAT ({form.taxRate}%)</span><span>R {tax.toFixed(2)}</span></div>
            {disc > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-R {disc.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold border-t mt-1 pt-1 text-foreground"><span>Total Due</span><span>R {total}</span></div>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Payment Terms</Label>
        <Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>Generate Invoice</Button>
    </form>
  );
}

export default function Invoices() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const utils = trpc.useUtils();
  const { data: invoices = [], isLoading } = trpc.invoices.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: customers = [] } = trpc.crm.listCustomers.useQuery();
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const updateInvoice = trpc.invoices.update.useMutation({
    onSuccess: () => { utils.invoices.list.invalidate(); toast.success("Invoice updated"); },
  });

  const filtered = invoices.filter((i) =>
    !search || i.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerName = (id: number) => customers.find((c) => c.id === id)?.name ?? "Unknown";

  const totalOutstanding = invoices
    .filter((i) => ["sent", "partial", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + parseFloat(i.amountDue as string), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground text-sm">Billing &amp; payment tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Generate Invoice</DialogTitle></DialogHeader>
            <InvoiceForm onSuccess={() => setOpen(false)} customers={customers} orders={orders} />
          </DialogContent>
        </Dialog>
      </div>

      {totalOutstanding > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold text-foreground">
                R {totalOutstanding.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <FileText className="h-10 w-10 text-primary/30" />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["draft","sent","viewed","partial","paid","overdue","cancelled"].map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No invoices found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv) => (
            <Card key={inv.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-foreground">{inv.invoiceNumber}</span>
                      <Badge className={`text-[10px] px-2 py-0 ${statusColors[inv.status]}`}>{inv.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-muted-foreground">
                      <span>Client: {getCustomerName(inv.customerId)}</span>
                      <span>Total: <strong className="text-foreground">R {parseFloat(inv.total as string).toLocaleString()}</strong></span>
                      <span>Due: <strong className={inv.status === "overdue" ? "text-red-600" : "text-foreground"}>{new Date(inv.dueDate).toLocaleDateString()}</strong></span>
                      {(inv as any).poNumber && (
                        <span className="inline-flex items-center gap-1 text-purple-600 font-medium">
                          <Hash className="h-3 w-3" />PO: {(inv as any).poNumber}
                        </span>
                      )}
                      {parseFloat(inv.amountPaid as string) > 0 && (
                        <span>Paid: R {parseFloat(inv.amountPaid as string).toLocaleString()}</span>
                      )}
                      {parseFloat(inv.amountDue as string) > 0 && (
                        <span className="text-amber-600">Balance: R {parseFloat(inv.amountDue as string).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 bg-background"
                      onClick={() => {
                        const url = `/api/invoices/${inv.id}/pdf`;
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `invoice-${inv.invoiceNumber}.pdf`;
                        a.click();
                        toast.success(`Downloading invoice ${inv.invoiceNumber}...`);
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Select
                      value={inv.status}
                      onValueChange={(v) => updateInvoice.mutate({ id: inv.id, status: v as any })}
                    >
                      <SelectTrigger className="h-8 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["draft","sent","viewed","partial","paid","overdue","cancelled"].map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
