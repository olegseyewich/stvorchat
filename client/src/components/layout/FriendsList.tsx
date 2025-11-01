import { clsx } from "clsx";
import type { User } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface RoomInviteControls {
  memberIds: Set<string>;
  onInvite: (friend: User) => void;
  invitingFriendId: string | null;
}

interface FriendsListProps {
  friends: User[];
  onSelectFriend: (friend: User) => void;
  isOnline: (userId: string) => boolean;
  activeFriendId: string | null;
  inviteControls?: RoomInviteControls;
}

export const FriendsList = ({ friends, onSelectFriend, isOnline, activeFriendId, inviteControls }: FriendsListProps) => {
  return (
    <div className="rounded-2xl bg-panel/70 p-5">
      <h3 className="text-sm font-semibold text-text">Список друзей</h3>
      <div className="mt-4 flex flex-col gap-3">
        {friends.map((friend) => {
          const isActive = activeFriendId === friend.id;
          const isInviting = inviteControls?.invitingFriendId === friend.id;

          return (
            <div
              key={friend.id}
              className={clsx(
                "flex w-full items-center gap-3 rounded-2xl bg-surface/70 px-4 py-3",
                isActive && "bg-surface",
              )}
            >
              <button
                type="button"
                className="flex flex-1 items-center gap-3 text-left text-sm text-text/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => onSelectFriend(friend)}
                title={friend.displayName}
              >
                <Avatar src={friend.avatarUrl} fallback={friend.displayName} size="sm" isOnline={isOnline(friend.id)} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{friend.displayName}</p>
                  <p className="text-xs text-muted">{isOnline(friend.id) ? "Онлайн" : "Оффлайн"}</p>
                </div>
              </button>

              {inviteControls && !inviteControls.memberIds.has(friend.id) && (
                <Button
                  variant="ghost"
                  className="rounded-xl border border-border px-3 py-1 text-xs font-medium text-primary"
                  disabled={isInviting}
                  onClick={(event) => {
                    event.stopPropagation();
                    inviteControls.onInvite(friend);
                  }}
                >
                  {isInviting ? "Приглашаем..." : "Пригласить"}
                </Button>
              )}

              {inviteControls && inviteControls.memberIds.has(friend.id) && (
                <span className="rounded-xl border border-border px-3 py-1 text-xs text-muted">В комнате</span>
              )}
            </div>
          );
        })}
        {friends.length === 0 && <p className="text-sm text-muted">Добавьте друзей, чтобы общаться!</p>}
      </div>
    </div>
  );
};

