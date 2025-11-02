import { create } from "zustand";

interface UIState {
  selectedRoomId: string | null;
  selectedChannelId: string | null;
  isSidebarCollapsed: boolean;
  showFriendsPanel: boolean;
  setRoom: (roomId: string | null) => void;
  setChannel: (channelId: string | null) => void;
  toggleSidebar: () => void;
  toggleFriendsPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedRoomId: null,
  selectedChannelId: null,
  isSidebarCollapsed: false,
  showFriendsPanel: true,
  setRoom: (roomId) => set({ selectedRoomId: roomId, selectedChannelId: null }),
  setChannel: (channelId) => set({ selectedChannelId: channelId }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleFriendsPanel: () => set((state) => ({ showFriendsPanel: !state.showFriendsPanel })),
}));


