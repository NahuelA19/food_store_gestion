import { useEffect, useState } from "react";
import { userApi, type AdminUser } from "../api/userApi";

export function useUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await userApi.getUsers();
        setUsers(data.users);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, isLoading, error };
}
