import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboardApi";
import type { DashboardStats } from "../types/dashboard";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await dashboardApi.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard stats");
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}
