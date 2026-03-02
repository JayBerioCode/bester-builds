import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  CreditCard,
  FileText,
  Save,
  Shield,
  Hash,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type ProfileForm = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  regNumber: string;
  website: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  paymentReference: string;
  invoiceTerms: string;
};

const empty: ProfileForm = {
  name: "",
  tagline: "",
  email: "",
  phone: "",
  address: "",
  vatNumber: "",
  regNumber: "",
  website: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  branchCode: "",
  accountType: "",
  paymentReference: "",
  invoiceTerms: "",
};

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 rounded-lg bg-purple-100">
        <Icon className="h-4 w-4 text-purple-700" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<ProfileForm>(empty);
  const [dirty, setDirty] = useState(false);

  const { data: profile, isLoading } = trpc.company.getProfile.useQuery();

  const updateMutation = trpc.company.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Company profile saved successfully.");
      utils.company.getProfile.invalidate();
      setDirty(false);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save profile.");
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        tagline: profile.tagline ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        vatNumber: profile.vatNumber ?? "",
        regNumber: profile.regNumber ?? "",
        website: profile.website ?? "",
        bankName: profile.bankName ?? "",
        accountHolder: profile.accountHolder ?? "",
        accountNumber: profile.accountNumber ?? "",
        branchCode: profile.branchCode ?? "",
        accountType: profile.accountType ?? "",
        paymentReference: profile.paymentReference ?? "",
        invoiceTerms: profile.invoiceTerms ?? "",
      });
    }
  }, [profile]);

  const set = (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setDirty(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Company name is required.");
      return;
    }
    updateMutation.mutate(form);
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="text-muted-foreground">Only administrators can manage the company profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-8 w-8 text-purple-400 mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            These details auto-populate on all generated PDFs — invoices and payroll reports.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty || updateMutation.isPending}
          className="bg-purple-700 hover:bg-purple-800 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Company Identity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <SectionHeader
              icon={Building2}
              title="Company Identity"
              subtitle="Name and tagline shown on all documents"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium">Company Name <span className="text-destructive">*</span></Label>
            <Input id="name" value={form.name} onChange={set("name")} placeholder="Bester.Builds" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline" className="text-xs font-medium">Tagline</Label>
            <Input id="tagline" value={form.tagline} onChange={set("tagline")} placeholder="Large Format Printing Specialists" />
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <SectionHeader
              icon={Phone}
              title="Contact Details"
              subtitle="Shown on invoice headers and payroll reports"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="info@besterbuilds.co.za" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
            <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+27 11 000 0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
            <Input id="website" value={form.website} onChange={set("website")} placeholder="https://besterbuilds.co.za" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="address" className="text-xs font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Physical / Postal Address</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={set("address")}
              placeholder={"123 Print Street\nJohannesburg, 2000\nSouth Africa"}
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tax & Registration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <SectionHeader
              icon={Hash}
              title="Tax & Registration"
              subtitle="VAT and company registration numbers for invoices"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="vatNumber" className="text-xs font-medium">VAT Registration Number</Label>
            <Input id="vatNumber" value={form.vatNumber} onChange={set("vatNumber")} placeholder="4xxxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="regNumber" className="text-xs font-medium">Company Registration Number</Label>
            <Input id="regNumber" value={form.regNumber} onChange={set("regNumber")} placeholder="2024/000000/07" />
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <SectionHeader
              icon={Landmark}
              title="Banking Details"
              subtitle="Printed in the Payment Information box on every invoice"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankName" className="text-xs font-medium">Bank Name</Label>
            <Input id="bankName" value={form.bankName} onChange={set("bankName")} placeholder="First National Bank" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountHolder" className="text-xs font-medium">Account Holder</Label>
            <Input id="accountHolder" value={form.accountHolder} onChange={set("accountHolder")} placeholder="Bester Builds (Pty) Ltd" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountNumber" className="text-xs font-medium">Account Number</Label>
            <Input id="accountNumber" value={form.accountNumber} onChange={set("accountNumber")} placeholder="62xxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branchCode" className="text-xs font-medium">Branch Code</Label>
            <Input id="branchCode" value={form.branchCode} onChange={set("branchCode")} placeholder="250655" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountType" className="text-xs font-medium">Account Type</Label>
            <Input id="accountType" value={form.accountType} onChange={set("accountType")} placeholder="Cheque / Current" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentReference" className="text-xs font-medium flex items-center gap-1"><CreditCard className="h-3 w-3" /> Payment Reference Instructions</Label>
            <Input id="paymentReference" value={form.paymentReference} onChange={set("paymentReference")} placeholder="Please use invoice number as reference" />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Terms */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <SectionHeader
              icon={FileText}
              title="Invoice Terms & Conditions"
              subtitle="Printed at the bottom of every invoice"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="invoiceTerms"
            value={form.invoiceTerms}
            onChange={set("invoiceTerms")}
            placeholder="Payment is due within 30 days of invoice date. Late payments may incur a 2% monthly interest charge. Thank you for your business."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Save button at bottom */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          disabled={!dirty || updateMutation.isPending}
          size="lg"
          className="bg-purple-700 hover:bg-purple-800 text-white gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
