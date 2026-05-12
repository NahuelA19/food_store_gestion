import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "../api/branchApi";

export function useBranches() {
  const query = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.getBranches(),
  });

  return {
    branches: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch branches"
      : null,
  };
}

export function useBranch(id: number) {
  const query = useQuery({
    queryKey: ["branch", id],
    queryFn: () => branchApi.getBranch(id),
    enabled: !!id,
  });

  return {
    branch: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch branch"
      : null,
  };
}

export function useToggleBranchStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: number) => branchApi.toggleBranchStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  return {
    toggleStatus: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
      ? mutation.error instanceof Error ? mutation.error.message : "Failed to toggle branch status"
      : null,
  };
}
