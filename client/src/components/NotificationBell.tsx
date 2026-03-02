import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Info,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationType = "shift_approved" | "shift_rejected" | "general";

function NotifIcon({ type }: { type: NotificationType }) {
  if (type === "shift_approved")
    return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
  if (type === "shift_rejected")
    return <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
  return <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
}

export function NotificationBell() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = trpc.notifications.countUnread.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery(
    { limit: 30 },
    { enabled: open }
  );

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.countUnread.invalidate();
      utils.notifications.list.invalidate();
    },
  });

  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.countUnread.invalidate();
      utils.notifications.list.invalidate();
      toast.success("All notifications marked as read.");
    },
  });

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id });
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 shadow-xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] h-4 px-1.5 leading-none">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3 h-3" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (notifications as any[]).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {(notifications as any[]).map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    "w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors",
                    !n.isRead && "bg-blue-50/60 dark:bg-blue-900/10"
                  )}
                  onClick={() => !n.isRead && handleMarkRead(n.id)}
                >
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium leading-tight", !n.isRead && "text-foreground", n.isRead && "text-muted-foreground")}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {(notifications as any[]).length > 0 && (
          <div className="border-t px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              Showing last {(notifications as any[]).length} notification{(notifications as any[]).length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
