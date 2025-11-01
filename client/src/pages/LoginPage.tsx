import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(form);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthLayout title="Добро пожаловать" subtitle="Войдите в Stvor, чтобы продолжить общение с друзьями и командой.">
      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="••••••••"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" disabled={isLoading} className="w-full py-3 text-base">
          {isLoading ? "Вход..." : "Войти"}
        </Button>
      </form>
      <p className="text-sm text-muted">
        Нет аккаунта? <Link to="/register" className="font-medium text-primary">Зарегистрируйтесь</Link>
      </p>
    </AuthLayout>
  );
};

