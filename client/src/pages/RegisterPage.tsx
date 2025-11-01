import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthLayout title="Создайте аккаунт" subtitle="Присоединяйтесь к Stvor, чтобы открыть для себя новую атмосферу общения.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Имя пользователя</label>
          <Input
            placeholder="Например, София"
            value={form.displayName}
            onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text">Пароль</label>
          <Input
            type="password"
            placeholder="Минимум 8 символов"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" disabled={isLoading} className="w-full py-3 text-base">
          {isLoading ? "Регистрация..." : "Зарегистрироваться"}
        </Button>
      </form>
      <p className="text-sm text-muted">
        Уже есть аккаунт? <Link to="/login" className="font-medium text-primary">Войдите</Link>
      </p>
    </AuthLayout>
  );
};

