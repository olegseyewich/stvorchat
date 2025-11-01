import { useState } from "react";
import { Check, X } from "lucide-react";
import type { FriendRequestUserPayload } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api, parseApiError } from "@/lib/api";

interface FriendRequestsPanelProps {
  requests: FriendRequestUserPayload[];
  onChange?: () => Promise<void> | void;
  currentUserId?: string;
}

export const FriendRequestsPanel = ({ requests, onChange, currentUserId }: FriendRequestsPanelProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const incoming = requests.filter(
    (request) => request.status === "PENDING" && request.receiver.id === currentUserId,
  );

  const handle = async (requestId: string, action: "accept" | "decline") => {
    setProcessingId(requestId);
    try {
      await api.post(`/friends/requests/${requestId}/${action}`);
      if (onChange) {
        await onChange();
      }
    } catch (error) {
      console.error(parseApiError(error).message);
    } finally {
      setProcessingId(null);
    }
  };

  if (incoming.length === 0) {
    return (
      <div className="rounded-2xl bg-panel/70 p-5 text-sm text-muted">
        Нет новых запросов в друзья.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incoming.map((request) => (
        <div
          key={request.id}
          className="flex flex-col gap-3 rounded-2xl bg-panel/80 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={request.sender.avatarUrl} fallback={request.sender.displayName} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate" title={request.sender.displayName}>
                {request.sender.displayName}
              </p>
              <p className="text-xs text-muted truncate">хочет добавить вас в друзья</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-full bg-success/40 text-text"
              onClick={() => handle(request.id, "accept")}
              disabled={processingId === request.id}
              title="Принять"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="rounded-full bg-error/40 text-text"
              onClick={() => handle(request.id, "decline")}
              disabled={processingId === request.id}
              title="Отклонить"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

