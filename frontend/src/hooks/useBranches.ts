import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchApi } from "../api/branchApi";
import type { CreateBranchPayload, UpdateBranchPayload } from "../types/branch";

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

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: CreateBranchPayload) => branchApi.createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });
  return {
    createBranch: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

export function useUpdateBranch(id: number) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: UpdateBranchPayload) => branchApi.updateBranch(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.setQueryData(["branch", id], updated);
    },
  });
  return {
    updateBranch: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

export function useToggleBranchStatus() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: number) => branchApi.toggleBranchStatus(id),
    onSuccess: (updatedBranch) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.setQueryData(["branch", updatedBranch.id], updatedBranch);
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
