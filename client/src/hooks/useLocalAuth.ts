import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export type LocalUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "employee";
  employeeId: number | null;
};

export function useLocalAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const logoutMutation = trpc.localAuth.logout.useMutation({
    onSuccess: () => {
      utils.localAuth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    utils.localAuth.me.setData(undefined, null);
    await utils.localAuth.me.invalidate();
  }, [logoutMutation, utils]);

  const user = meQuery.data as LocalUser | null | undefined;

  return {
    user: user ?? null,
    loading: meQuery.isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    isEmployee: user?.role === "employee",
    logout,
    refresh: () => meQuery.refetch(),
  };
}
