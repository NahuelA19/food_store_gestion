import { useQuery } from "@tanstack/react-query";
import { userApi } from "../api/userApi";

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
