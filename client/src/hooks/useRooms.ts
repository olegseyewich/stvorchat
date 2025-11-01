import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Room } from "@/types/api";

const fetchRooms = async () => {
  const { data } = await api.get<{ rooms: Room[] }>("/rooms");
  return data.rooms;
};

export const useRooms = () => {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
  });
};

