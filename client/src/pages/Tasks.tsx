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
import { Plus, CheckSquare, Trash2, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  normal: "bg-blue-50 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-700",
};

const statusFlow = ["pending", "in_progress", "review", "completed"];

function TaskForm({ onSuccess, employees, orders }: { onSuccess: () => void; employees: any[]; orders: any[] }) {
  const utils = trpc.useUtils();
  const create = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task created"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "normal",
    assignedTo: "",
    orderId: "",
    dueDate: "",
    estimatedHours: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      title: form.title,
      description: form.description,
      status: form.status as any,
      priority: form.priority as any,
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined,
      orderId: form.orderId ? parseInt(form.orderId) : undefined,
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      estimatedHours: form.estimatedHours || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Task Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Print & laminate 3 banners for Client X" />
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
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Assign To</Label>
          <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
            <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.role.replace(/_/g, " ")})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Linked Order</Label>
          <Select value={form.orderId} onValueChange={(v) => setForm({ ...form, orderId: v })}>
            <SelectTrigger><SelectValue placeholder="Select order..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No order</SelectItem>
              {orders.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.orderNumber} — {o.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Estimated Hours</Label>
          <Input type="number" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} placeholder="e.g. 2.5" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>Create Task</Button>
    </form>
  );
}

export default function Tasks() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const utils = trpc.useUtils();
  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task deleted"); },
  });
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => { utils.tasks.list.invalidate(); toast.success("Task updated"); },
  });

  const getEmployeeName = (id?: number | null) => id ? (employees.find((e) => e.id === id)?.name ?? "Unknown") : "Unassigned";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm">Production tasks &amp; workload management</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
            <TaskForm onSuccess={() => setOpen(false)} employees={employees} orders={orders} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", ...statusFlow, "cancelled"].map((s) => {
          const count = s === "all" ? tasks.length : tasks.filter((t) => t.status === s).length;
          return (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} ({count})
            </Button>
          );
        })}
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
      ) : tasks.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const nextStatus = statusFlow[statusFlow.indexOf(task.status) + 1];
            return (
              <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] px-2 py-0 ${statusColors[task.status]}`}>
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={`text-[10px] px-2 py-0 ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="font-semibold text-foreground mt-1">{task.title}</p>
                      <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-muted-foreground">
                        <span>Assigned: {getEmployeeName(task.assignedTo)}</span>
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        {task.estimatedHours && <span>Est: {task.estimatedHours}h</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {nextStatus && task.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => updateTask.mutate({ id: task.id, status: nextStatus as any })}
                        >
                          <ChevronRight className="h-3.5 w-3.5 mr-1" />
                          {nextStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Delete task?")) deleteTask.mutate({ id: task.id }); }}
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
