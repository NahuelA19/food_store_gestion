import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi, type AdminCreateEmployeePayload, type AdminUpdateEmployeePayload } from "../api/userApi";

export function useUsers() {
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.getUsers(),
  });

  return {
    users: query.data?.users ?? [],
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch users"
      : null,
  };
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminCreateEmployeePayload) => userApi.createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminUpdateEmployeePayload) => userApi.updateEmployee(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
