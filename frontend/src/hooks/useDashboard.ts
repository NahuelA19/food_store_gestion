import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboardApi";

export function useDashboardStats() {
  const query = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getDashboardStats(),
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? query.error instanceof Error ? query.error.message : "Failed to fetch dashboard stats"
      : null,
  };
}
