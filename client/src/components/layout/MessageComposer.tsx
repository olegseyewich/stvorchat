import { useState } from "react";
import { Send } from "lucide-react";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";

interface MessageComposerProps {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
}

export const MessageComposer = ({ onSend, disabled }: MessageComposerProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    await onSend(value);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-surface/70 p-4">
      <div className="flex items-end gap-3">
        <TextArea
          rows={3}
          placeholder="Напишите сообщение..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={disabled}
        />
        <Button
          type="submit"
          variant="primary"
          className="h-12 w-12 rounded-full p-0"
          disabled={disabled || !value.trim()}
          title="Отправить"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

