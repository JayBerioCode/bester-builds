import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";

const PRINT_TYPES = [
  "banner",
  "vinyl_wrap",
  "canvas",
  "poster",
  "mesh",
  "backlit",
  "floor_graphic",
  "window_graphic",
  "wallpaper",
  "other",
] as const;

const PRINT_TYPE_LABELS: Record<string, string> = {
  banner: "Banner",
  vinyl_wrap: "Vinyl Wrap",
  canvas: "Canvas",
  poster: "Poster",
  mesh: "Mesh",
  backlit: "Backlit",
  floor_graphic: "Floor Graphic",
  window_graphic: "Window Graphic",
  wallpaper: "Wallpaper",
  other: "Other",
};

type RateRow = {
  id: number;
  printType: string;
  material: string;
  ratePerSqm: string;
  setupFee: string;
  minCharge: string;
  laminationRatePerSqm: string | null;
  eyeletRatePerMetre: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

type RateForm = {
  printType: string;
  material: string;
  ratePerSqm: string;
  setupFee: string;
  minCharge: string;
  laminationRatePerSqm: string;
  eyeletRatePerMetre: string;
};

const emptyForm: RateForm = {
  printType: "banner",
  material: "",
  ratePerSqm: "0.00",
  setupFee: "0.00",
  minCharge: "0.00",
  laminationRatePerSqm: "0.00",
  eyeletRatePerMetre: "0.00",
};

function fmt(val: string | null | undefined) {
  return val ? `R ${parseFloat(val).toFixed(2)}` : "—";
}

export default function PricingRates() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: rates = [], isLoading } = trpc.pricing.list.useQuery();

  const createMut = trpc.pricing.create.useMutation({
    onSuccess: () => {
      utils.pricing.list.invalidate();
      toast.success("Rate created successfully");
      setShowAdd(false);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.pricing.update.useMutation({
    onSuccess: () => {
      utils.pricing.list.invalidate();
      toast.success("Rate updated");
      setEditRate(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.pricing.delete.useMutation({
    onSuccess: () => {
      utils.pricing.list.invalidate();
      toast.success("Rate deleted");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editRate, setEditRate] = useState<RateRow | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<RateForm>(emptyForm);
  const [editForm, setEditForm] = useState<RateForm>(emptyForm);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const map: Record<string, RateRow[]> = {};
    for (const r of rates as RateRow[]) {
      if (!map[r.printType]) map[r.printType] = [];
      map[r.printType].push(r);
    }
    return map;
  }, [rates]);

  function openEdit(r: RateRow) {
    setEditRate(r);
    setEditForm({
      printType: r.printType,
      material: r.material,
      ratePerSqm: r.ratePerSqm,
      setupFee: r.setupFee,
      minCharge: r.minCharge,
      laminationRatePerSqm: r.laminationRatePerSqm ?? "0.00",
      eyeletRatePerMetre: r.eyeletRatePerMetre ?? "0.00",
    });
  }

  function toggleCollapse(pt: string) {
    setCollapsed((prev) => ({ ...prev, [pt]: !prev[pt] }));
  }

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="text-lg font-medium">Admin access required</p>
        <p className="text-sm">Only administrators can manage pricing rates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pricing Rates"
        subtitle="Manage material rates used by the print cost calculator. Changes apply immediately to new quotes."
        actions={
          <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Rate
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Rates</p>
          <p className="text-2xl font-bold text-foreground mt-1">{(rates as RateRow[]).length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{(rates as RateRow[]).filter((r) => r.isActive).length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Inactive</p>
          <p className="text-2xl font-bold text-muted-foreground mt-1">{(rates as RateRow[]).filter((r) => !r.isActive).length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Print Types</p>
          <p className="text-2xl font-bold text-primary mt-1">{Object.keys(grouped).length}</p>
        </div>
      </div>

      {/* Grouped tables */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading rates…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No pricing rates found. Add one to get started.</div>
      ) : (
        <div className="space-y-4">
          {PRINT_TYPES.filter((pt) => grouped[pt]).map((pt) => (
            <div key={pt} className="border rounded-lg overflow-hidden bg-card">
              {/* Group header */}
              <button
                onClick={() => toggleCollapse(pt)}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {collapsed[pt] ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-semibold text-foreground">{PRINT_TYPE_LABELS[pt] ?? pt}</span>
                  <Badge variant="secondary" className="text-xs">{grouped[pt].length} material{grouped[pt].length !== 1 ? "s" : ""}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Avg rate: R {(grouped[pt].reduce((s, r) => s + parseFloat(r.ratePerSqm), 0) / grouped[pt].length).toFixed(2)}/m²
                </span>
              </button>

              {/* Rates table */}
              {!collapsed[pt] && (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Rate/m²</TableHead>
                      <TableHead className="text-right">Setup Fee</TableHead>
                      <TableHead className="text-right">Min Charge</TableHead>
                      <TableHead className="text-right">Lamination/m²</TableHead>
                      <TableHead className="text-right">Eyelet/m</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[pt].map((r) => (
                      <TableRow key={r.id} className={!r.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{r.material}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.ratePerSqm)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.setupFee)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.minCharge)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.laminationRatePerSqm)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(r.eyeletRatePerMetre)}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={r.isActive ?? true}
                            onCheckedChange={(val) =>
                              updateMut.mutate({ id: r.id, isActive: val })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEdit(r)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(r.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Rate Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Pricing Rate</DialogTitle>
          </DialogHeader>
          <RateFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate(form)}
              disabled={createMut.isPending || !form.material}
            >
              {createMut.isPending ? "Saving…" : "Add Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={!!editRate} onOpenChange={(o) => !o && setEditRate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Rate — {editRate?.material}</DialogTitle>
          </DialogHeader>
          <RateFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRate(null)}>Cancel</Button>
            <Button
              onClick={() => editRate && updateMut.mutate({ id: editRate.id, ...editForm })}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the rate. Orders already created will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMut.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Shared form fields component ────────────────────────────────────────────
function RateFormFields({
  form,
  setForm,
}: {
  form: RateForm;
  setForm: React.Dispatch<React.SetStateAction<RateForm>>;
}) {
  function f(field: keyof RateForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <div className="grid grid-cols-2 gap-4 py-2">
      <div className="col-span-2 space-y-1">
        <Label>Print Type</Label>
        <Select
          value={form.printType}
          onValueChange={(v) => setForm((p) => ({ ...p, printType: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRINT_TYPES.map((pt) => (
              <SelectItem key={pt} value={pt}>
                {PRINT_TYPE_LABELS[pt] ?? pt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2 space-y-1">
        <Label>Material Name</Label>
        <Input
          placeholder="e.g. PVC 440gsm"
          value={form.material}
          onChange={f("material")}
        />
      </div>

      <div className="space-y-1">
        <Label>Rate per m² (R)</Label>
        <Input type="number" step="0.01" min="0" value={form.ratePerSqm} onChange={f("ratePerSqm")} />
      </div>

      <div className="space-y-1">
        <Label>Setup Fee (R)</Label>
        <Input type="number" step="0.01" min="0" value={form.setupFee} onChange={f("setupFee")} />
      </div>

      <div className="space-y-1">
        <Label>Minimum Charge (R)</Label>
        <Input type="number" step="0.01" min="0" value={form.minCharge} onChange={f("minCharge")} />
      </div>

      <div className="space-y-1">
        <Label>Lamination per m² (R)</Label>
        <Input type="number" step="0.01" min="0" value={form.laminationRatePerSqm} onChange={f("laminationRatePerSqm")} />
      </div>

      <div className="col-span-2 space-y-1">
        <Label>Eyelet per metre (R)</Label>
        <Input type="number" step="0.01" min="0" value={form.eyeletRatePerMetre} onChange={f("eyeletRatePerMetre")} />
      </div>
    </div>
  );
}
