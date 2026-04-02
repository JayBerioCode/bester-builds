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
import { toast } from "sonner";
import { Plus, Calendar, Clock, MapPin, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const typeColors: Record<string, string> = {
  client_consultation: "bg-purple-100 text-purple-700",
  production: "bg-blue-100 text-blue-700",
  delivery: "bg-emerald-100 text-emerald-700",
  equipment_maintenance: "bg-orange-100 text-orange-700",
  team_meeting: "bg-indigo-100 text-indigo-700",
  other: "bg-gray-100 text-gray-600",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  rescheduled: "bg-amber-100 text-amber-700",
};

function AppointmentForm({ onSuccess, customers, employees, orders }: {
  onSuccess: () => void;
  customers: any[];
  employees: any[];
  orders: any[];
}) {
  const utils = trpc.useUtils();
  const create = trpc.scheduling.create.useMutation({
    onSuccess: () => { utils.scheduling.list.invalidate(); toast.success("Appointment booked"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const now = new Date();
  const defaultDate = now.toISOString().split("T")[0];
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:00`;

  const [form, setForm] = useState({
    title: "",
    type: "client_consultation",
    customerId: "",
    orderId: "",
    assignedTo: "",
    startDate: defaultDate,
    startTime: defaultTime,
    endDate: defaultDate,
    endTime: `${String(now.getHours() + 1).padStart(2, "0")}:00`,
    location: "",
    description: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = new Date(`${form.startDate}T${form.startTime}`);
    const endTime = new Date(`${form.endDate}T${form.endTime}`);
    if (endTime <= startTime) { toast.error("End time must be after start time"); return; }
    create.mutate({
      title: form.title,
      type: form.type as any,
      customerId: form.customerId ? parseInt(form.customerId) : undefined,
      orderId: form.orderId ? parseInt(form.orderId) : undefined,
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined,
      startTime,
      endTime,
      location: form.location,
      description: form.description,
      notes: form.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Client consultation — ABC Corp" />
        </div>
        <div className="space-y-1.5">
          <Label>Type *</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="client_consultation">Client Consultation</SelectItem>
              <SelectItem value="production">Production Run</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="equipment_maintenance">Equipment Maintenance</SelectItem>
              <SelectItem value="team_meeting">Team Meeting</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
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
          <Label>Start Date *</Label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Start Time *</Label>
          <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>End Date *</Label>
          <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>End Time *</Label>
          <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Assigned To</Label>
          <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
            <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Linked Order</Label>
          <Select value={form.orderId} onValueChange={(v) => setForm({ ...form, orderId: v })}>
            <SelectTrigger><SelectValue placeholder="Select order..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">No order</SelectItem>
              {orders.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.orderNumber}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Print shop, Client office, On-site..." />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>Book Appointment</Button>
    </form>
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Scheduling() {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: appointments = [], isLoading } = trpc.scheduling.list.useQuery();
  const { data: customers = [] } = trpc.crm.listCustomers.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: orders = [] } = trpc.orders.list.useQuery();
  const deleteAppt = trpc.scheduling.delete.useMutation({
    onSuccess: () => { utils.scheduling.list.invalidate(); toast.success("Appointment deleted"); },
  });
  const updateAppt = trpc.scheduling.update.useMutation({
    onSuccess: () => { utils.scheduling.list.invalidate(); toast.success("Status updated"); },
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });

  const getApptsForDay = (day: number) => {
    return appointments.filter((a) => {
      const d = new Date(a.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const selectedAppts = selectedDay ? getApptsForDay(selectedDay) : [];

  const getCustomerName = (id?: number | null) => id ? (customers.find((c) => c.id === id)?.name ?? "") : "";
  const getEmployeeName = (id?: number | null) => id ? (employees.find((e) => e.id === id)?.name ?? "") : "";

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling"
        subtitle="Appointments, production timelines &amp; deliveries"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Appointment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
              <AppointmentForm onSuccess={() => setOpen(false)} customers={customers} employees={employees} orders={orders} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="font-semibold text-foreground">{monthName}</h2>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayAppts = getApptsForDay(day);
                  const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                  const isSelected = selectedDay === day;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`relative min-h-[52px] p-1 rounded-lg text-left transition-colors border ${
                        isSelected ? "bg-primary text-primary-foreground border-primary" :
                        isToday ? "bg-primary/10 border-primary/30" :
                        "hover:bg-muted border-transparent"
                      }`}
                    >
                      <span className={`text-xs font-medium block ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}>
                        {day}
                      </span>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {dayAppts.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary-foreground/70" : "bg-primary"}`}
                          />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className={`text-[9px] ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>+{dayAppts.length - 3}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">
            {selectedDay
              ? `${monthName.split(" ")[0]} ${selectedDay} — ${selectedAppts.length} appointment${selectedAppts.length !== 1 ? "s" : ""}`
              : "Upcoming Appointments"}
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (selectedDay ? selectedAppts : appointments.filter((a) => new Date(a.startTime) >= new Date()).slice(0, 10)).length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  {selectedDay ? "No appointments this day" : "No upcoming appointments"}
                </p>
              </CardContent>
            </Card>
          ) : (
            (selectedDay ? selectedAppts : appointments.filter((a) => new Date(a.startTime) >= new Date()).slice(0, 10)).map((appt) => (
              <Card key={appt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{appt.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-[9px] px-1.5 py-0 ${typeColors[appt.type]}`}>
                          {appt.type.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={`text-[9px] px-1.5 py-0 ${statusColors[appt.status]}`}>
                          {appt.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(appt.startTime).toLocaleString("en-ZA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {appt.location && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />{appt.location}
                        </div>
                      )}
                      {getCustomerName(appt.customerId) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Client: {getCustomerName(appt.customerId)}</p>
                      )}
                      {getEmployeeName(appt.assignedTo) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Staff: {getEmployeeName(appt.assignedTo)}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Select
                        value={appt.status}
                        onValueChange={(v) => updateAppt.mutate({ id: appt.id, status: v as any })}
                      >
                        <SelectTrigger className="h-6 text-[9px] w-[90px] px-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["scheduled","confirmed","in_progress","completed","cancelled","rescheduled"].map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm("Delete appointment?")) deleteAppt.mutate({ id: appt.id }); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
