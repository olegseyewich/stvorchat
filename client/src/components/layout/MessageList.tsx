import type { Message } from "@/types/api";
import { MessageBubble } from "./MessageBubble";
import { formatMessageDate } from "@/lib/format";

interface MessageListProps {
  messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let lastDateLabel: string | null = null;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
      {sorted.map((message) => {
        const dateLabel = formatMessageDate(message.createdAt);
        const showSeparator = dateLabel !== lastDateLabel;
        lastDateLabel = dateLabel;

        return (
          <div key={message.id} className="space-y-3">
            {showSeparator && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted">{dateLabel}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}
            <MessageBubble message={message} />
          </div>
        );
      })}
      {sorted.length === 0 && (
        <div className="mt-16 text-center text-sm text-muted">
          Здесь пока пусто — напишите что-нибудь, чтобы начать диалог.
        </div>
      )}
    </div>
  );
};

