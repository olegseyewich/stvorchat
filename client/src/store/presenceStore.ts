import { create } from "zustand";

interface PresenceState {
  onlineUserIds: Set<string>;
  setOnlineUsers: (userIds: string[]) => void;
  updateUser: (userId: string, online: boolean) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: new Set(),
  setOnlineUsers: (userIds) => set({ onlineUserIds: new Set(userIds) }),
  updateUser: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      if (online) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return { onlineUserIds: next };
    }),
}));

