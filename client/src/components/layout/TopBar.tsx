import { Search, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Room, Channel, User } from "@/types/api";

interface TopBarProps {
  currentRoom?: Room | null;
  currentChannel?: Channel | null;
  onSearch: (value: string) => void;
  onLogout: () => void;
  currentUser: User | null;
}

export const TopBar = ({ currentRoom, currentChannel, onSearch, onLogout, currentUser }: TopBarProps) => {
  return (
    <header className="flex flex-col gap-4 rounded-2xl bg-nyx-gradient px-4 py-4 text-text md:flex-row md:items-center md:justify-between md:px-6">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-text/70 truncate">
          {currentRoom ? currentRoom.name : "Stvor"}
        </p>
        <h1 className="text-2xl font-semibold text-text truncate">
          {currentChannel ? `#${currentChannel.name}` : currentUser?.displayName ?? "Добро пожаловать"}
        </h1>
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
        <div className="relative flex-1 min-w-[200px] max-w-sm md:min-w-[260px]">
          <Input
            placeholder="Поиск по друзьям и каналам"
            className="w-full bg-surface/70 pl-10"
            onChange={(event) => onSearch(event.target.value)}
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        <ThemeToggle className="shrink-0" />
        <Button variant="ghost" className="shrink-0 rounded-full bg-surface/40 p-3" title="Уведомления">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" className="shrink-0 rounded-full bg-surface/40 p-3" onClick={onLogout} title="Выйти">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

