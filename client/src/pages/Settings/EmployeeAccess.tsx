import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Users,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  UserCog,
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeeAccess() {
  const { isAdmin } = useLocalAuth();
  const utils = trpc.useUtils();

  // Allowlist
  const { data: allowlist = [], isLoading: loadingAllowlist } = trpc.allowlist.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: localUsers = [], isLoading: loadingUsers } = trpc.localAuth.listUsers.useQuery();

  const [addEmail, setAddEmail] = useState("");
  const [addEmployeeId, setAddEmployeeId] = useState<string>("none");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: number; name: string; currentRole: string } | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<{ id: number; name: string; isActive: boolean } | null>(null);

  const addMutation = trpc.allowlist.add.useMutation({
    onSuccess: () => {
      utils.allowlist.list.invalidate();
      setAddEmail("");
      setAddEmployeeId("none");
      setAddError(null);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    },
    onError: (err) => setAddError(err.message),
  });

  const removeMutation = trpc.allowlist.remove.useMutation({
    onSuccess: () => {
      utils.allowlist.list.invalidate();
      setDeleteId(null);
    },
  });

  const setActiveMutation = trpc.localAuth.setActive.useMutation({
    onSuccess: () => {
      utils.localAuth.listUsers.invalidate();
      setDeactivateUser(null);
    },
  });

  const setRoleMutation = trpc.localAuth.setRole.useMutation({
    onSuccess: () => {
      utils.localAuth.listUsers.invalidate();
      setRoleChangeUser(null);
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <ShieldOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const handleAddAllowlist = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const empId = addEmployeeId !== "none" ? parseInt(addEmployeeId) : undefined;
    const emp = empId ? employees.find((e: any) => e.id === empId) : undefined;
    addMutation.mutate({
      email: addEmail,
      employeeId: empId,
      employeeName: emp?.name,
    });
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCog className="w-6 h-6 text-purple-500" />
          Employee Access Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Control which employees can sign up for platform access, and manage existing user accounts.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowlist.length}</p>
                <p className="text-xs text-muted-foreground">Allowlisted emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowlist.filter((e: any) => e.hasSignedUp).length}</p>
                <p className="text-xs text-muted-foreground">Signed up</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{localUsers.length}</p>
                <p className="text-xs text-muted-foreground">Total accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add to allowlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4 text-purple-500" />
            Add Employee to Access List
          </CardTitle>
          <CardDescription>
            Add an employee's email so they can sign up for a platform account with clock-in/out access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAllowlist} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px] space-y-1.5">
              <Label htmlFor="allowEmail">Employee email</Label>
              <Input
                id="allowEmail"
                type="email"
                placeholder="employee@example.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-56 space-y-1.5">
              <Label htmlFor="allowEmployee">Link to employee record (optional)</Label>
              <Select value={addEmployeeId} onValueChange={setAddEmployeeId}>
                <SelectTrigger id="allowEmployee">
                  <SelectValue placeholder="Select employee…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No link —</SelectItem>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={addMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
              Add to List
            </Button>
          </form>

          {addError && (
            <Alert className="mt-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-400">{addError}</AlertDescription>
            </Alert>
          )}
          {addSuccess && (
            <Alert className="mt-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">Email added to access list successfully.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Allowlist table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Access List</CardTitle>
          <CardDescription>Emails that are permitted to create employee accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAllowlist ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : allowlist.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No emails on the access list yet.</p>
              <p className="text-sm mt-1">Add an employee's email above to grant them sign-up access.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Linked Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allowlist.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.employeeName || <span className="italic opacity-50">Not linked</span>}
                    </TableCell>
                    <TableCell>
                      {entry.hasSignedUp ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Signed up
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(entry.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteId(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Registered users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Registered Accounts
          </CardTitle>
          <CardDescription>All users who have created platform accounts.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : localUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No accounts registered yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"
                        }
                      >
                        {user.role === "admin" ? (
                          <><ShieldCheck className="w-3 h-3 mr-1" /> Admin</>
                        ) : (
                          <><Users className="w-3 h-3 mr-1" /> Employee</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-300">Deactivated</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.lastSignedIn ? format(new Date(user.lastSignedIn), "dd MMM yyyy HH:mm") : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => setRoleChangeUser({ id: user.id, name: user.name, currentRole: user.role })}
                        >
                          Change Role
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`text-xs h-7 px-2 ${user.isActive ? "text-red-500 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                          onClick={() => setDeactivateUser({ id: user.id, name: user.name, isActive: user.isActive })}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete allowlist entry dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Access List</DialogTitle>
            <DialogDescription>
              This will remove the email from the allowlist. If the employee has already signed up, their account will remain active.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && removeMutation.mutate({ id: deleteId })}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role dialog */}
      <Dialog open={roleChangeUser !== null} onOpenChange={() => setRoleChangeUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role — {roleChangeUser?.name}</DialogTitle>
            <DialogDescription>
              Current role: <strong>{roleChangeUser?.currentRole}</strong>. Select the new role below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 py-2">
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={roleChangeUser?.currentRole === "admin" || setRoleMutation.isPending}
              onClick={() => roleChangeUser && setRoleMutation.mutate({ userId: roleChangeUser.id, role: "admin" })}
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Make Admin
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={roleChangeUser?.currentRole === "employee" || setRoleMutation.isPending}
              onClick={() => roleChangeUser && setRoleMutation.mutate({ userId: roleChangeUser.id, role: "employee" })}
            >
              <Users className="w-4 h-4 mr-2" /> Make Employee
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleChangeUser(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/deactivate dialog */}
      <Dialog open={deactivateUser !== null} onOpenChange={() => setDeactivateUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deactivateUser?.isActive ? "Deactivate" : "Activate"} Account</DialogTitle>
            <DialogDescription>
              {deactivateUser?.isActive
                ? `Deactivating ${deactivateUser?.name}'s account will prevent them from signing in.`
                : `Reactivating ${deactivateUser?.name}'s account will allow them to sign in again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateUser(null)}>Cancel</Button>
            <Button
              variant={deactivateUser?.isActive ? "destructive" : "default"}
              onClick={() => deactivateUser && setActiveMutation.mutate({ userId: deactivateUser.id, isActive: !deactivateUser.isActive })}
              disabled={setActiveMutation.isPending}
            >
              {setActiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {deactivateUser?.isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
