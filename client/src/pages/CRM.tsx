import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Users, TrendingUp, Phone, Mail, Building2, Trash2, Edit } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  prospect: "bg-amber-100 text-amber-700",
};

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-indigo-100 text-indigo-700",
  qualified: "bg-violet-100 text-violet-700",
  proposal: "bg-amber-100 text-amber-700",
  negotiation: "bg-orange-100 text-orange-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

function CustomerForm({ onSuccess, initial }: { onSuccess: () => void; initial?: any }) {
  const utils = trpc.useUtils();
  const create = trpc.crm.createCustomer.useMutation({
    onSuccess: () => { utils.crm.listCustomers.invalidate(); toast.success("Customer added"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.crm.updateCustomer.useMutation({
    onSuccess: () => { utils.crm.listCustomers.invalidate(); toast.success("Customer updated"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "South Africa",
    status: initial?.status ?? "prospect",
    customerType: initial?.customerType ?? "individual",
    notes: initial?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial?.id) update.mutate({ id: initial.id, ...form, status: form.status as any, customerType: form.customerType as any });
    else create.mutate({ ...form, status: form.status as any, customerType: form.customerType as any });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
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
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Customer Type</Label>
          <Select value={form.customerType} onValueChange={(v) => setForm({ ...form, customerType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="reseller">Reseller</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending || update.isPending}>
        {initial ? "Update Customer" : "Add Customer"}
      </Button>
    </form>
  );
}

function LeadForm({ onSuccess }: { onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.crm.createLead.useMutation({
    onSuccess: () => { utils.crm.listLeads.invalidate(); toast.success("Lead added"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    source: "website", stage: "new", estimatedValue: "", printingNeeds: "", notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ ...form, source: form.source as any, stage: form.stage as any });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label>Company</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
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
          <Label>Source</Label>
          <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="cold_call">Cold Call</SelectItem>
              <SelectItem value="trade_show">Trade Show</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Stage</Label>
          <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Estimated Value (ZAR)</Label>
          <Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Printing Needs</Label>
        <Textarea value={form.printingNeeds} onChange={(e) => setForm({ ...form, printingNeeds: e.target.value })} rows={2} placeholder="Describe what they need printed..." />
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>Add Lead</Button>
    </form>
  );
}

export default function CRM() {
  const [search, setSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: customers = [], isLoading } = trpc.crm.listCustomers.useQuery({ search });
  const { data: leads = [] } = trpc.crm.listLeads.useQuery();
  const deleteCustomer = trpc.crm.deleteCustomer.useMutation({
    onSuccess: () => { utils.crm.listCustomers.invalidate(); toast.success("Customer deleted"); },
  });
  const deleteLead = trpc.crm.deleteLead.useMutation({
    onSuccess: () => { utils.crm.listLeads.invalidate(); toast.success("Lead deleted"); },
  });
  const updateLead = trpc.crm.updateLead.useMutation({
    onSuccess: () => { utils.crm.listLeads.invalidate(); toast.success("Lead stage updated"); },
  });

  const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-muted-foreground text-sm">Customer relationships &amp; lead pipeline</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />New Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
              <LeadForm onSuccess={() => setLeadOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={customerOpen} onOpenChange={(o) => { setCustomerOpen(o); if (!o) setEditCustomer(null); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Customer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
              <CustomerForm onSuccess={() => { setCustomerOpen(false); setEditCustomer(null); }} initial={editCustomer} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers"><Users className="h-4 w-4 mr-1.5" />Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="leads"><TrendingUp className="h-4 w-4 mr-1.5" />Lead Pipeline ({leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="animate-pulse flex gap-4">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No customers found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Add your first customer to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {customers.map((c) => (
                <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{c.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{c.name}</span>
                          <Badge className={`text-[10px] px-2 py-0 ${statusColors[c.status]}`}>{c.status}</Badge>
                          <Badge variant="outline" className="text-[10px] px-2 py-0">{c.customerType}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          {c.company && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />{c.company}
                            </span>
                          )}
                          {c.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />{c.email}
                            </span>
                          )}
                          {c.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />{c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {c.city}{c.city && c.country ? ", " : ""}{c.country}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => { setEditCustomer(c); setCustomerOpen(true); }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this customer?")) deleteCustomer.mutate({ id: c.id }); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 overflow-x-auto">
            {stages.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              return (
                <div key={stage} className="min-w-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-[10px] px-2 ${stageColors[stage]}`}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageLeads.map((lead) => (
                      <Card key={lead.id} className="border shadow-sm">
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold text-foreground truncate">{lead.name}</p>
                          {lead.company && <p className="text-[10px] text-muted-foreground truncate">{lead.company}</p>}
                          {lead.estimatedValue && (
                            <p className="text-[10px] text-emerald-600 font-medium mt-1">
                              R {parseFloat(lead.estimatedValue as string).toLocaleString()}
                            </p>
                          )}
                          <div className="flex gap-1 mt-2">
                            {stage !== "won" && stage !== "lost" && (
                              <Select
                                value={lead.stage}
                                onValueChange={(v) => updateLead.mutate({ id: lead.id, stage: v as any })}
                              >
                                <SelectTrigger className="h-6 text-[10px] px-1.5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {stages.map((s) => (
                                    <SelectItem key={s} value={s} className="text-xs">
                                      {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive shrink-0"
                              onClick={() => { if (confirm("Delete lead?")) deleteLead.mutate({ id: lead.id }); }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-4 text-[10px] text-muted-foreground/50 border border-dashed rounded-lg">
                        No leads
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
