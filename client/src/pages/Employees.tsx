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
import { Plus, Users2, Phone, Mail, Trash2, Edit } from "lucide-react";

const roleColors: Record<string, string> = {
  manager: "bg-violet-100 text-violet-700",
  print_operator: "bg-blue-100 text-blue-700",
  designer: "bg-pink-100 text-pink-700",
  sales: "bg-emerald-100 text-emerald-700",
  delivery: "bg-amber-100 text-amber-700",
  admin: "bg-gray-100 text-gray-700",
  other: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  on_leave: "bg-amber-100 text-amber-700",
};

function EmployeeForm({ onSuccess, initial }: { onSuccess: () => void; initial?: any }) {
  const utils = trpc.useUtils();
  const create = trpc.employees.create.useMutation({
    onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee added"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.employees.update.useMutation({
    onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee updated"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    role: initial?.role ?? "print_operator",
    department: initial?.department ?? "",
    status: initial?.status ?? "active",
    hourlyRate: initial?.hourlyRate ?? "",
    skills: initial?.skills ?? "",
    notes: initial?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial?.id) update.mutate({ id: initial.id, ...form, role: form.role as any, status: form.status as any });
    else create.mutate({ ...form, role: form.role as any, status: form.status as any });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Full Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Role *</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="print_operator">Print Operator</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Production, Sales" />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Hourly Rate (ZAR)</Label>
          <Input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Skills</Label>
        <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Roland VersaCAMM, Adobe Illustrator, Laminating" />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending || update.isPending}>
        {initial ? "Update Employee" : "Add Employee"}
      </Button>
    </form>
  );
}

export default function Employees() {
  const [open, setOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: employees = [], isLoading } = trpc.employees.list.useQuery();
  const deleteEmployee = trpc.employees.delete.useMutation({
    onSuccess: () => { utils.employees.list.invalidate(); toast.success("Employee removed"); },
  });

  const byRole = employees.reduce((acc, e) => {
    acc[e.role] = (acc[e.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm">Print shop staff management</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditEmployee(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
            <EmployeeForm onSuccess={() => { setOpen(false); setEditEmployee(null); }} initial={editEmployee} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Summary */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(byRole).map(([role, count]) => (
          <Badge key={role} className={`${roleColors[role]} text-xs px-3 py-1`}>
            {role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}: {count}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-3">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Users2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No employees added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <Card key={emp.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{emp.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{emp.name}</span>
                      <Badge className={`text-[10px] px-2 py-0 ${statusColors[emp.status]}`}>{emp.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge className={`text-[10px] px-2 py-0 ${roleColors[emp.role]}`}>
                        {emp.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                      {emp.department && <span className="text-xs text-muted-foreground">{emp.department}</span>}
                    </div>
                    {emp.email && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />{emp.email}
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />{emp.phone}
                      </div>
                    )}
                    {emp.skills && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{emp.skills}</p>
                    )}
                    {emp.hourlyRate && (
                      <p className="text-xs font-medium text-foreground mt-1">R{parseFloat(emp.hourlyRate as string).toFixed(2)}/hr</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setEditEmployee(emp); setOpen(true); }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Remove this employee?")) deleteEmployee.mutate({ id: emp.id }); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
