import { Plus, Settings, Users } from "lucide-react";
import type { Room, User } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

interface SidebarProps {
  rooms: Room[];
  selectedRoomId: string | null;
  selectedChannelId: string | null;
  onSelectChannel: (roomId: string | null, channelId: string) => void;
  onCreateRoom: () => void;
  currentUser: User | null;
}

export const Sidebar = ({
  rooms,
  selectedRoomId,
  selectedChannelId,
  onSelectChannel,
  onCreateRoom,
  currentUser,
}: SidebarProps) => {
  return (
    <aside className="flex h-full w-full max-w-sm flex-col rounded-2xl bg-panel/80 backdrop-blur-xl md:w-72">
      <div className="relative rounded-2xl bg-nyx-gradient p-5 text-text">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-surface/30 p-2">
            <Users className="h-6 w-6 text-text" />
          </div>
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-widest text-text/70 truncate">Stvor</p>
            <h2 className="text-xl font-semibold text-text truncate">Messenger</h2>
          </div>
        </div>
        {currentUser && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface/50 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar src={currentUser.avatarUrl} fallback={currentUser.displayName} isOnline />
              <div className="min-w-0">
                <p className="font-medium text-text truncate">{currentUser.displayName}</p>
                <p className="text-xs text-text/70 truncate">{currentUser.statusMessage ?? "Онлайн"}</p>
              </div>
            </div>
            <Button variant="ghost" className="px-2" title="Настройки">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <section>
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-text">
            <span>Комнаты</span>
            <Button variant="ghost" className="px-2" onClick={onCreateRoom} title="Создать комнату">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-2xl bg-surface/60 p-3">
                <button
                  type="button"
                  className={clsx(
                    "w-full truncate text-left text-sm font-semibold text-text transition",
                    room.id === selectedRoomId ? "text-primary" : "text-text/80 hover:text-text",
                  )}
                  onClick={() => {
                    const firstChannel = room.channels[0];
                    if (firstChannel) {
                      onSelectChannel(room.id, firstChannel.id);
                    }
                  }}
                >
                  {room.name}
                </button>
                <div className="mt-2 space-y-1.5">
                  {room.channels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      className={clsx(
                        "w-full rounded-xl px-3 py-2 text-left text-sm text-text/80 transition hover:bg-hover/70 truncate",
                        selectedChannelId === channel.id && "bg-surface text-primary",
                      )}
                      onClick={() => onSelectChannel(room.id, channel.id)}
                    >
                      #{channel.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-sm text-muted">Вы ещё не присоединились к комнатам.</p>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
};

