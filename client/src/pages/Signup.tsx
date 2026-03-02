import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { Link } from "wouter";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const signupMutation = trpc.localAuth.signup.useMutation({
    onSuccess: async (data) => {
      await utils.localAuth.me.invalidate();
      if (data.role === "admin") {
        setLocation("/");
      } else {
        setLocation("/employee-portal");
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    signupMutation.mutate({ email, password, name, role });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Printer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Bester.Builds</h1>
          <p className="text-purple-300 mt-1">Large Format Printing — Business Platform</p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Create Account</CardTitle>
            <CardDescription className="text-purple-300">
              Set up your Bester.Builds platform account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-purple-200 text-sm font-medium">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-400 focus:border-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-purple-200 text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-400 focus:border-purple-400"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-purple-200 text-sm font-medium">
                  Account type
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as "admin" | "employee")}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin — Full platform access</SelectItem>
                    <SelectItem value="employee">Employee — Clock In/Out only</SelectItem>
                  </SelectContent>
                </Select>
                {role === "admin" && (
                  <p className="text-amber-400 text-xs flex items-start gap-1.5 mt-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Admin sign-up is only available when no admin account exists yet (first-time setup).
                  </p>
                )}
                {role === "employee" && (
                  <p className="text-purple-400 text-xs flex items-start gap-1.5 mt-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Your email must be added to the employee access list by an admin before you can sign up.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-purple-200 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-400 focus:border-purple-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-purple-200 text-sm font-medium">
                  Confirm password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-400 focus:border-purple-400"
                />
              </div>

              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold h-11 mt-2"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-purple-400 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-purple-300 hover:text-white font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-purple-500 text-xs mt-6">
          © {new Date().getFullYear()} Bester.Builds — All rights reserved
        </p>
      </div>
    </div>
  );
}
