import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { currentMonth, money } from "../utils/format";

export default function Budgets() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [error, setError] = useState("");

  const load = async () => {
    const [budgetRes, categoryRes] = await Promise.all([
      api.get(`/budgets?month=${month}`),
      api.get("/categories")
    ]);
    setBudgets(budgetRes.data);
    setCategories(categoryRes.data.filter((category) => category.type === "expense"));
  };

  useEffect(() => {
    load();
  }, [month]);

  const totals = useMemo(
    () =>
      budgets.reduce(
        (acc, budget) => ({
          planned: acc.planned + budget.amount,
          spent: acc.spent + (budget.spent || 0)
        }),
        { planned: 0, spent: 0 }
      ),
    [budgets]
  );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/budgets", { ...form, month, amount: Number(form.amount) });
      setForm({ category: "", amount: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save budget");
    }
  };

  const remove = async (id) => {
    await api.delete(`/budgets/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-ink">Budgets</h1>
          <p className="text-sm text-slate-500">Set monthly spending targets by category.</p>
        </div>
        <input className="field max-w-48" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel">
          <div className="text-sm font-medium text-slate-500">Planned</div>
          <div className="mt-2 text-2xl font-bold">{money(totals.planned, user.currency)}</div>
        </div>
        <div className="panel">
          <div className="text-sm font-medium text-slate-500">Spent</div>
          <div className="mt-2 text-2xl font-bold">{money(totals.spent, user.currency)}</div>
        </div>
      </div>

      <form onSubmit={submit} className="panel grid gap-3 md:grid-cols-3">
        <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
          <option value="">Expense category</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
        <input className="field" type="number" min="0" step="0.01" placeholder="Monthly amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <button className="btn-primary">Save Budget</button>
      </form>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((budget) => {
          const percent = budget.amount > 0 ? Math.min((budget.spent || 0) / budget.amount, 1) * 100 : 0;
          return (
            <article key={budget._id} className="panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">{budget.category.name}</h2>
                  <p className="text-sm text-slate-500">{money(budget.spent, user.currency)} of {money(budget.amount, user.currency)}</p>
                </div>
                <button className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(budget._id)} title="Delete budget">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-mint" style={{ width: `${percent}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
