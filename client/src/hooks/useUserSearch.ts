import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

const fetchUsers = async (query: string) => {
  const { data } = await api.get<{ users: User[] }>("/users/search", {
    params: { q: query, limit: 10 },
  });
  return data.users;
};

export const useUserSearch = (query: string) => {
  return useQuery({
    queryKey: ["user-search", query],
    queryFn: () => fetchUsers(query.trim()),
    enabled: query.trim().length > 1,
    staleTime: 10_000,
  });
};

