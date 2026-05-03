import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { money } from "../utils/format";

const emptyForm = { name: "", type: "bank", balance: "", currency: "" };

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = async () => {
    const { data } = await api.get("/accounts");
    setAccounts(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/accounts", {
        ...form,
        balance: Number(form.balance || 0),
        currency: form.currency || user.currency
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save account");
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await api.delete(`/accounts/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete account");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Accounts</h1>
        <p className="text-sm text-slate-500">Track bank, cash, card, and wallet balances.</p>
      </div>

      <form onSubmit={submit} className="panel grid gap-3 md:grid-cols-5">
        <input className="field" placeholder="Account name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="bank">Bank</option>
          <option value="cash">Cash</option>
          <option value="wallet">Wallet</option>
          <option value="card">Card</option>
          <option value="investment">Investment</option>
        </select>
        <input className="field" type="number" step="0.01" placeholder="Opening balance" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
        <input className="field" placeholder={user.currency} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={5} />
        <button className="btn-primary">Add Account</button>
      </form>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <article key={account._id} className="panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{account.name}</h2>
                <p className="text-sm capitalize text-slate-500">{account.type}</p>
              </div>
              <button className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(account._id)} title="Delete account">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 text-2xl font-bold text-ink">{money(account.balance, account.currency)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}
