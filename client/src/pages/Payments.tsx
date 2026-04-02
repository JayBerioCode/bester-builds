import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, CreditCard, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const methodColors: Record<string, string> = {
  cash: "bg-emerald-100 text-emerald-700",
  bank_transfer: "bg-blue-100 text-blue-700",
  card: "bg-violet-100 text-violet-700",
  eft: "bg-indigo-100 text-indigo-700",
  cheque: "bg-amber-100 text-amber-700",
  other: "bg-gray-100 text-gray-600",
};

const statusColors2: Record<string, string> = {
  pending: "text-amber-600",
  completed: "text-emerald-600",
  failed: "text-red-600",
  refunded: "text-blue-600",
};

function PaymentForm({ onSuccess, customers, invoices }: { onSuccess: () => void; customers: any[]; invoices: any[] }) {
  const utils = trpc.useUtils();
  const create = trpc.payments.create.useMutation({
    onSuccess: () => { utils.payments.list.invalidate(); toast.success("Payment recorded"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: "",
    method: "bank_transfer",
    reference: "",
    description: "",
    notes: "",
    paidAt: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    create.mutate({
      customerId: form.customerId ? parseInt(form.customerId) : 0,
      invoiceId: form.invoiceId ? parseInt(form.invoiceId) : 0,
      amount: form.amount,
      method: form.method as any,
      reference: form.reference,
      notes: form.description,
      paidAt: new Date(form.paidAt),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Invoice INV-001 payment received" />
        </div>
        <div className="space-y-1.5">
          <Label>Payment Method *</Label>
          <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="eft">EFT</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Amount (ZAR) *</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
            <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No customer</SelectItem>
              {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Linked Invoice</Label>
          <Select value={form.invoiceId} onValueChange={(v) => setForm({ ...form, invoiceId: v })}>
            <SelectTrigger><SelectValue placeholder="Select invoice..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No invoice</SelectItem>
              {invoices.filter((i) => ["sent","partial","overdue"].includes(i.status)).map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>{i.invoiceNumber} — R{parseFloat(i.amountDue as string).toLocaleString()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Reference Number</Label>
          <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Bank ref, PO number..." />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>Record Payment</Button>
    </form>
  );
}

export default function Payments() {
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: payments = [], isLoading } = trpc.payments.list.useQuery(
    typeFilter === "all" ? undefined : { status: typeFilter }
  );
  const { data: customers = [] } = trpc.crm.listCustomers.useQuery();
  const { data: invoices = [] } = trpc.invoices.list.useQuery();

  const totalIncome = payments.filter((p) => p.status === "completed").reduce((s, p) => s + parseFloat(p.amount as string), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + parseFloat(p.amount as string), 0);
  const netRevenue = totalIncome;

  const getCustomerName = (id?: number | null) => id ? (customers.find((c) => c.id === id)?.name ?? "Unknown") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Financial transactions &amp; cash flow"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Record Payment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
              <PaymentForm onSuccess={() => setOpen(false)} customers={customers} invoices={invoices} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Income</p>
              <p className="text-xl font-bold text-emerald-700">R {totalIncome.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-xl font-bold text-red-700">R {totalPending.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-amber-700">
                R {totalPending.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "completed", "failed", "refunded"].map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* Transactions */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse flex gap-4">
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-6 w-24 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No transactions recorded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <Card key={payment.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${methodColors[payment.method]}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground text-sm">{payment.notes ?? payment.reference ?? "Payment"}</span>
                      <Badge className={`text-[10px] px-2 py-0 ${methodColors[payment.method]}`}>{payment.method.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-muted-foreground">
                      <span>{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-ZA") : "—"}</span>
                      {getCustomerName(payment.customerId) && <span>Client: {getCustomerName(payment.customerId)}</span>}
                      {payment.reference && <span>Ref: {payment.reference}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-lg font-bold ${statusColors2[payment.status]}`}>
                      R {parseFloat(payment.amount as string).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{payment.status}</p>
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
