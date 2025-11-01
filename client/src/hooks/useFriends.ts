import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User, FriendRequestUserPayload } from "@/types/api";

const fetchFriends = async () => {
  const { data } = await api.get<{ friends: User[] }>("/friends");
  return data.friends;
};

const fetchFriendRequests = async () => {
  const { data } = await api.get<{ requests: FriendRequestUserPayload[] }>("/friends/requests");
  return data.requests;
};

export const useFriends = () => {
  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
  });

  const requestsQuery = useQuery({
    queryKey: ["friendRequests"],
    queryFn: fetchFriendRequests,
  });

  return {
    friends: friendsQuery.data ?? [],
    isLoading: friendsQuery.isLoading,
    requests: requestsQuery.data ?? [],
    refetch: async () => {
      await Promise.all([friendsQuery.refetch(), requestsQuery.refetch()]);
    },
  };
};

