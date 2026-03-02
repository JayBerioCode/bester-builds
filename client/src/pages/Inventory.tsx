import { useState } from "react";
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
import { Plus, AlertTriangle, Box, Search, Trash2, Edit, ArrowUpDown } from "lucide-react";

const categoryColors: Record<string, string> = {
  paper: "bg-blue-100 text-blue-700",
  vinyl: "bg-violet-100 text-violet-700",
  fabric: "bg-pink-100 text-pink-700",
  ink: "bg-cyan-100 text-cyan-700",
  substrate: "bg-amber-100 text-amber-700",
  laminate: "bg-orange-100 text-orange-700",
  hardware: "bg-gray-100 text-gray-700",
  consumable: "bg-lime-100 text-lime-700",
  equipment: "bg-indigo-100 text-indigo-700",
  other: "bg-muted text-muted-foreground",
};

const categories = ["paper", "vinyl", "fabric", "ink", "substrate", "laminate", "hardware", "consumable", "equipment", "other"];

function InventoryForm({ onSuccess, initial }: { onSuccess: () => void; initial?: any }) {
  const utils = trpc.useUtils();
  const create = trpc.inventory.createItem.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); toast.success("Item added"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.inventory.updateItem.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); toast.success("Item updated"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    category: initial?.category ?? "paper",
    description: initial?.description ?? "",
    unit: initial?.unit ?? "roll",
    currentStock: initial?.currentStock ?? "0",
    minStockLevel: initial?.minStockLevel ?? "5",
    maxStockLevel: initial?.maxStockLevel ?? "",
    unitCost: initial?.unitCost ?? "0",
    unitPrice: initial?.unitPrice ?? "0",
    supplier: initial?.supplier ?? "",
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial?.id) update.mutate({ id: initial.id, ...form, category: form.category as any });
    else create.mutate({ ...form, category: form.category as any });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Item Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. VNL-WHT-1520" />
        </div>
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="roll, sheet, litre, kg..." />
        </div>
        <div className="space-y-1.5">
          <Label>Current Stock</Label>
          <Input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Min Stock Level</Label>
          <Input type="number" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Stock Level</Label>
          <Input type="number" value={form.maxStockLevel} onChange={(e) => setForm({ ...form, maxStockLevel: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit Cost (ZAR)</Label>
          <Input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit Price (ZAR)</Label>
          <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Supplier</Label>
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Storage Location</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Shelf A3" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending || update.isPending}>
        {initial ? "Update Item" : "Add Item"}
      </Button>
    </form>
  );
}

function TransactionForm({ itemId, onSuccess }: { itemId: number; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const add = trpc.inventory.addTransaction.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); toast.success("Stock updated"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const [form, setForm] = useState({ type: "purchase", quantity: "", unitCost: "", reference: "", notes: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    add.mutate({ itemId, ...form, type: form.type as any });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Transaction Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="purchase">Purchase (Add Stock)</SelectItem>
              <SelectItem value="usage">Usage (Consume)</SelectItem>
              <SelectItem value="adjustment">Adjustment (Set to)</SelectItem>
              <SelectItem value="return">Return</SelectItem>
              <SelectItem value="waste">Waste</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Unit Cost (ZAR)</Label>
          <Input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Reference</Label>
          <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="PO number, order ref..." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={add.isPending}>Record Transaction</Button>
    </form>
  );
}

export default function Inventory() {
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [txItem, setTxItem] = useState<any>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.inventory.listItems.useQuery({
    category: filterCategory === "all" ? undefined : filterCategory,
    lowStock: filterLowStock || undefined,
  });
  const deleteItem = trpc.inventory.deleteItem.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); toast.success("Item deleted"); },
  });

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter((i) => parseFloat(i.currentStock as string) <= parseFloat(i.minStockLevel as string)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground text-sm">Materials, substrates, inks &amp; equipment</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle></DialogHeader>
            <InventoryForm onSuccess={() => { setOpen(false); setEditItem(null); }} initial={editItem} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{lowStockCount} item{lowStockCount !== 1 ? "s" : ""} below minimum stock level</p>
              <p className="text-xs text-amber-700">Review and reorder to avoid production delays.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setFilterLowStock(true)}
            >
              View Low Stock
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant={filterLowStock ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterLowStock(!filterLowStock)}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Low Stock Only
        </Button>
      </div>

      {/* Items Table */}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Box className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No inventory items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const stock = parseFloat(item.currentStock as string);
            const min = parseFloat(item.minStockLevel as string);
            const isLow = stock <= min;
            return (
              <Card key={item.id} className={`border-0 shadow-sm hover:shadow-md transition-shadow ${isLow ? "border-l-4 border-l-amber-400" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[item.category]}`}>
                      <Box className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{item.name}</span>
                        {item.sku && <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>}
                        <Badge className={`text-[10px] px-2 py-0 ${categoryColors[item.category]}`}>{item.category}</Badge>
                        {isLow && <Badge className="text-[10px] px-2 py-0 bg-amber-100 text-amber-700"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Low Stock</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span>Stock: <strong className={isLow ? "text-amber-600" : "text-foreground"}>{stock} {item.unit}</strong></span>
                        <span>Min: {min} {item.unit}</span>
                        {item.supplier && <span>Supplier: {item.supplier}</span>}
                        {item.location && <span>Location: {item.location}</span>}
                        <span>Cost: R{parseFloat(item.unitCost as string).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setTxItem(item); setTxOpen(true); }}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                        Stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditItem(item); setOpen(true); }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Delete this item?")) deleteItem.mutate({ id: item.id }); }}
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

      {/* Transaction Dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update Stock — {txItem?.name}</DialogTitle></DialogHeader>
          {txItem && <TransactionForm itemId={txItem.id} onSuccess={() => setTxOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
