import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void | Promise<void>;
}

export const CreateRoomModal = ({ isOpen, onClose, onSubmit }: CreateRoomModalProps) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName("");
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-panel/95 p-6 text-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">Создать комнату</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl p-1 text-text/70 hover:bg-hover hover:text-text disabled:opacity-50"
            title="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-sm font-medium text-text">Название комнаты</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название комнаты"
            autoFocus
            disabled={isSubmitting}
            maxLength={60}
            className="mb-4"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Создаём..." : "Создать"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};


