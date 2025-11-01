import type { User } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

interface SearchResultsListProps {
  results: User[];
  disabledIds: Set<string>;
  pendingIds?: Set<string>;
  onSendRequest: (user: User) => Promise<void> | void;
  isLoading?: boolean;
  infoMessage?: string | null;
  errorMessage?: string | null;
}

export const SearchResultsList = ({
  results,
  disabledIds,
  pendingIds,
  onSendRequest,
  isLoading,
  infoMessage,
  errorMessage,
}: SearchResultsListProps) => {
  return (
    <div className="rounded-2xl bg-panel/70 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Результаты поиска</h3>
        {isLoading && <span className="text-xs text-muted">Поиск...</span>}
      </div>

      {infoMessage && <p className="mt-2 text-xs text-success">{infoMessage}</p>}
      {errorMessage && <p className="mt-2 text-xs text-error">{errorMessage}</p>}

      <div className="mt-4 space-y-3">
        {results.map((user) => {
          const disabled = disabledIds.has(user.id);
          const pending = pendingIds?.has(user.id);
          return (
            <div
              key={user.id}
              className={clsx(
                "flex flex-col gap-3 rounded-2xl bg-surface/70 p-3 sm:flex-row sm:items-center sm:justify-between",
                disabled && "opacity-70",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={user.avatarUrl} fallback={user.displayName} size="sm" isOnline={user.isOnline} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate" title={user.displayName}>
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted truncate" title={user.email}>
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full px-3 py-1 text-sm sm:w-auto"
                disabled={disabled}
                onClick={() => onSendRequest(user)}
              >
                {pending ? "Ожидает подтверждения" : disabled ? "Уже в друзьях" : "Добавить"}
              </Button>
            </div>
          );
        })}

        {results.length === 0 && !isLoading && !errorMessage && (
          <p className="text-sm text-muted">Совпадений не найдено.</p>
        )}
      </div>
    </div>
  );
};

