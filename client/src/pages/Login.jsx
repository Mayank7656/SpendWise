import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Banknote } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-xl font-bold text-ink">
          <Banknote className="h-6 w-6 text-mint" />
          Money Notebook
        </div>
        <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
        <div className="mt-6 space-y-4">
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={saving}>
          {saving ? "Signing in..." : "Login"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here? <Link className="font-semibold text-mint" to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
