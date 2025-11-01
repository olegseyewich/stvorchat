import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRooms } from "@/hooks/useRooms";
import { useFriends } from "@/hooks/useFriends";
import { usePresence } from "@/hooks/usePresence";
import { useMessages } from "@/hooks/useMessages";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MessageList } from "@/components/layout/MessageList";
import { MessageComposer } from "@/components/layout/MessageComposer";
import { FriendRequestsPanel } from "@/components/layout/FriendRequestsPanel";
import { FriendsList } from "@/components/layout/FriendsList";
import { SearchResultsList } from "@/components/layout/SearchResultsList";
import { CreateRoomModal } from "@/components/ui/CreateRoomModal";
import type { Channel, Room, User } from "@/types/api";
import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";

interface DirectChannel extends Channel {
  members: { id: string; user: User }[];
}

export const DashboardPage = () => {
  const { data: rooms = [] } = useRooms();
  const { friends, requests, refetch } = useFriends();
  const { isOnline } = usePresence();
  const [directChannels, setDirectChannels] = useState<DirectChannel[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchInfo, setSearchInfo] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const socket = useSocket();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const selectedRoomId = useUIStore((state) => state.selectedRoomId);
  const selectedChannelId = useUIStore((state) => state.selectedChannelId);
  const setRoom = useUIStore((state) => state.setRoom);
  const setChannel = useUIStore((state) => state.setChannel);

  useEffect(() => {
    if (!selectedRoomId && rooms.length > 0) {
      setRoom(rooms[0].id);
      const firstChannel = rooms[0].channels[0];
      if (firstChannel) {
        setChannel(firstChannel.id);
      }
    }
  }, [rooms, selectedRoomId, setRoom, setChannel]);

  const currentRoom: Room | null = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find((room) => room.id === selectedRoomId) ?? null;
  }, [rooms, selectedRoomId]);

  const currentRoomMemberIds = useMemo(() => {
    if (!currentRoom) return new Set<string>();
    return new Set((currentRoom.members ?? []).map((member) => member.id));
  }, [currentRoom]);

  const isCurrentRoomOwner = currentRoom?.role === "OWNER";

  const currentChannel: Channel | DirectChannel | null = useMemo(() => {
    if (!selectedChannelId) return null;
    if (currentRoom) {
      return currentRoom.channels.find((channel) => channel.id === selectedChannelId) ?? null;
    }
    return directChannels.find((channel) => channel.id === selectedChannelId) ?? null;
  }, [currentRoom, directChannels, selectedChannelId]);

  const activeFriendId = useMemo(() => {
    if (!currentChannel || currentChannel.type !== "DIRECT" || !user) return null;
    const direct = currentChannel as DirectChannel;
    const companion = direct.members.find((member) => member.user.id !== user.id);
    return companion?.user.id ?? null;
  }, [currentChannel, user]);

  const { messages, isLoading: messagesLoading, sendMessage } = useMessages(selectedChannelId ?? null);
  const {
    data: searchedUsers = [],
    isFetching: searchLoading,
  } = useUserSearch(searchValue);

  const handleSelectChannel = (roomId: string | null, channelId: string) => {
    setRoom(roomId);
    setChannel(channelId);
  };

  const handleCreateRoom = async (name: string) => {
    try {
      const { data } = await api.post<{ room: Room; channel: Channel }>("/rooms", { name });
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      handleSelectChannel(data.room.id, data.channel.id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectFriend = async (friend: User) => {
    const { data } = await api.post<{ channel: DirectChannel }>("/channels/direct", {
      targetUserId: friend.id,
    });

    setDirectChannels((prev) => {
      const filtered = prev.filter((channel) => channel.id !== data.channel.id);
      return [data.channel, ...filtered];
    });

    handleSelectChannel(null, data.channel.id);
  };

  const filteredFriends = useMemo(() => {
    if (!searchValue) return friends;
    return friends.filter((friend) =>
      friend.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [friends, searchValue]);

  useEffect(() => {
    if (searchValue.trim().length <= 1) {
      setSearchInfo(null);
      setSearchError(null);
    }
  }, [searchValue]);

  useEffect(() => {
    if (!socket) {
      console.log("[Friends] Socket not available for friends refresh listener");
      return;
    }

    console.log("[Friends] Setting up friends refresh listener");

    const handleRoomsRefresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    };

    const handleFriendsRefresh = async () => {
      console.log("[Friends] Refresh event received - invalidating queries and refetching");
      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      await queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      await refetch();
      console.log("[Friends] Refresh completed");
    };

    socket.on("rooms:refresh", handleRoomsRefresh);
    socket.on("friends:refresh", handleFriendsRefresh);
    console.log("[Friends] Listeners registered");

    return () => {
      console.log("[Friends] Cleaning up listeners");
      socket.off("rooms:refresh", handleRoomsRefresh);
      socket.off("friends:refresh", handleFriendsRefresh);
    };
  }, [queryClient, socket, refetch]);

  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends]);
  const outgoingPending = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      requests
        .filter((request) => request.sender.id === user.id && request.status === "PENDING")
        .map((request) => request.receiver.id),
    );
  }, [requests, user]);
  const incomingPending = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      requests
        .filter((request) => request.receiver.id === user.id && request.status === "PENDING")
        .map((request) => request.sender.id),
    );
  }, [requests, user]);

  const pendingSearchIds = useMemo(() => {
    const set = new Set<string>();
    outgoingPending.forEach((id) => set.add(id));
    incomingPending.forEach((id) => set.add(id));
    return set;
  }, [incomingPending, outgoingPending]);

  const disabledSearchIds = useMemo(() => {
    const set = new Set<string>();
    friendIds.forEach((id) => set.add(id));
    pendingSearchIds.forEach((id) => set.add(id));
    if (user?.id) set.add(user.id);
    return set;
  }, [friendIds, pendingSearchIds, user?.id]);

  const handleSendFriendRequest = async (target: User) => {
    if (disabledSearchIds.has(target.id)) return;
    setSearchInfo(null);
    setSearchError(null);
    try {
      await api.post("/friends/requests", { receiverId: target.id });
      setSearchInfo(`Запрос отправлен пользователю ${target.displayName}`);
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
      void queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    } catch (error) {
      setSearchError("Не удалось отправить запрос. Попробуйте позже.");
      console.error(error);
    }
  };

  const handleInviteToRoom = async (friend: User) => {
    if (!currentRoom || currentRoom.role !== "OWNER") {
      return;
    }

    setInvitingFriendId(friend.id);
    try {
      await api.post(`/rooms/${currentRoom.id}/invite`, { userId: friend.id });
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
    } catch (error) {
      console.error("Не удалось пригласить в комнату", error);
    } finally {
      setInvitingFriendId(null);
    }
  };

  return (
    <div className="flex min-h-screen gap-6 bg-surface px-6 py-6 text-text">
      <Sidebar
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        selectedChannelId={selectedChannelId}
        onSelectChannel={handleSelectChannel}
        onCreateRoom={() => setIsCreateRoomModalOpen(true)}
        currentUser={user}
      />

      <main className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-4">
        <TopBar
          currentRoom={currentRoom}
          currentChannel={currentChannel}
          onSearch={setSearchValue}
          onLogout={logout}
          currentUser={user}
        />

        <div className="grid flex-1 grid-cols-[minmax(0,1fr)_320px] gap-6">
          <section className="flex h-full flex-col rounded-2xl bg-panel/70">
            {messagesLoading && (
              <div className="flex flex-1 items-center justify-center text-muted">
                Загружаем сообщения...
              </div>
            )}
            {!messagesLoading && currentChannel && <MessageList messages={messages} />}
            {currentChannel ? (
              <MessageComposer onSend={(value) => sendMessage(value)} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted">
                Выберите комнату или друга, чтобы начать общаться.
              </div>
            )}
          </section>

          <aside className="flex h-full flex-col gap-4">
            {searchValue.trim().length > 1 && (
              <SearchResultsList
                results={searchedUsers.filter((candidate) => !friendIds.has(candidate.id))}
                disabledIds={disabledSearchIds}
                pendingIds={pendingSearchIds}
                onSendRequest={handleSendFriendRequest}
                isLoading={searchLoading}
                infoMessage={searchInfo}
                errorMessage={searchError}
              />
            )}
            <FriendRequestsPanel
              requests={requests}
              onChange={refetch}
              currentUserId={user?.id}
            />
            <FriendsList
              friends={filteredFriends}
              onSelectFriend={handleSelectFriend}
              isOnline={isOnline}
              activeFriendId={activeFriendId}
              inviteControls={
                isCurrentRoomOwner
                  ? {
                      memberIds: currentRoomMemberIds,
                      onInvite: handleInviteToRoom,
                      invitingFriendId,
                    }
                  : undefined
              }
            />
          </aside>
        </div>
      </main>
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onSubmit={handleCreateRoom}
      />
    </div>
  );
};

