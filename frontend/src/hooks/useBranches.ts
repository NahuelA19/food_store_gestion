import { useEffect, useState, useCallback } from "react";
import { branchApi } from "../api/branchApi";
import type { Branch } from "../types/branch";

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await branchApi.getBranches();
        setBranches(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch branches");
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return { branches, setBranches, isLoading, error };
}

export function useBranch(id: number) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchBranch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await branchApi.getBranch(id);
        setBranch(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch branch");
        setBranch(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranch();
  }, [id]);

  return { branch, isLoading, error };
}

export function useToggleBranchStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await branchApi.toggleBranchStatus(id);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to toggle branch status";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { toggleStatus, isLoading, error };
}
