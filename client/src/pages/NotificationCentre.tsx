import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Bell,
  CheckCircle2,
  XCircle,
  Info,
  Search,
  Users,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type NotificationType = "shift_approved" | "shift_rejected" | "general";

function TypeBadge({ type }: { type: NotificationType }) {
  if (type === "shift_approved")
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs gap-1">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </Badge>
    );
  if (type === "shift_rejected")
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs gap-1">
        <XCircle className="w-3 h-3" /> Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs gap-1">
      <Info className="w-3 h-3" /> General
    </Badge>
  );
}

export default function NotificationCentre() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");

  const { data: notifications = [], isLoading } = trpc.notifications.listAll.useQuery(
    { limit: 200 },
    { refetchInterval: 60_000 }
  );

  const filtered = (notifications as any[]).filter((n) => {
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      n.recipientName?.toLowerCase().includes(q) ||
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  // Summary counts
  const totalSent = (notifications as any[]).length;
  const approvedCount = (notifications as any[]).filter((n) => n.type === "shift_approved").length;
  const rejectedCount = (notifications as any[]).filter((n) => n.type === "shift_rejected").length;
  const unreadCount = (notifications as any[]).filter((n) => !n.isRead).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-purple-500" />
          Notification Centre
        </h1>
        <p className="text-muted-foreground mt-1">
          All notifications sent to employees — track delivery and read status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{totalSent}</p>
                <p className="text-xs text-muted-foreground">Total sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejections</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employee or message…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="shift_approved">Approvals</SelectItem>
            <SelectItem value="shift_rejected">Rejections</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground ml-auto">
          {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No notifications found.</p>
              <p className="text-sm mt-1">
                Notifications are sent automatically when you approve or reject shifts.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="max-w-[300px]">Message</TableHead>
                  <TableHead>Sent by</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Read</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n: any) => (
                  <TableRow key={n.id} className={!n.isRead ? "bg-blue-50/40 dark:bg-blue-900/5" : ""}>
                    <TableCell>
                      <TypeBadge type={n.type} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {n.recipientName || <span className="italic text-muted-foreground">Unknown</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{n.title}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate" title={n.message}>
                        {n.message}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {n.sentByName || "System"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <span title={format(new Date(n.createdAt), "dd MMM yyyy HH:mm:ss")}>
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {n.isRead ? (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          Read
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          Unread
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
