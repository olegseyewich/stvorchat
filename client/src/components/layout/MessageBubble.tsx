import type { Message } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { formatMessageTime } from "@/lib/format";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwn = message.author.id === currentUserId;

  return (
    <div className={clsx("flex items-start gap-3", isOwn && "flex-row-reverse text-right")}> 
      <Avatar
        src={message.author.avatarUrl}
        fallback={message.author.displayName}
        size="sm"
      />
      <div
        className={clsx(
          "max-w-xl space-y-1 rounded-2xl px-4 py-3",
          isOwn ? "bg-primary/80 text-text" : "bg-surface/90 text-text",
        )}
      >
        <div className="flex items-center justify-between gap-3 text-xs text-text/70">
          <span className="font-semibold text-text">{message.author.displayName}</span>
          <span>{formatMessageTime(message.createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

