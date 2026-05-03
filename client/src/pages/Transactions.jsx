import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { money, todayInput } from "../utils/format";

const makeForm = () => ({
  type: "expense",
  amount: "",
  date: todayInput(),
  description: "",
  category: "",
  fromAccount: "",
  toAccount: ""
});

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(makeForm);
  const [error, setError] = useState("");

  const load = async () => {
    const [transactionRes, accountRes, categoryRes] = await Promise.all([
      api.get("/transactions"),
      api.get("/accounts"),
      api.get("/categories")
    ]);
    setTransactions(transactionRes.data);
    setAccounts(accountRes.data);
    setCategories(categoryRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const payload = {
      ...form,
      amount: Number(form.amount),
      category: form.type === "transfer" ? null : form.category,
      fromAccount: ["expense", "transfer"].includes(form.type) ? form.fromAccount : null,
      toAccount: ["income", "transfer"].includes(form.type) ? form.toAccount : null
    };

    try {
      await api.post("/transactions", payload);
      setForm(makeForm());
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save transaction");
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await api.delete(`/transactions/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete transaction");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Transactions</h1>
        <p className="text-sm text-slate-500">Add income, expenses, and transfers with automatic balance updates.</p>
      </div>

      <form onSubmit={submit} className="panel grid gap-3 lg:grid-cols-6">
        <select className="field" value={form.type} onChange={(e) => setForm({ ...makeForm(), type: e.target.value })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
        <input className="field" type="number" min="0.01" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        {form.type !== "income" && (
          <select className="field" value={form.fromAccount} onChange={(e) => setForm({ ...form, fromAccount: e.target.value })} required>
            <option value="">From account</option>
            {accounts.map((account) => <option key={account._id} value={account._id}>{account.name}</option>)}
          </select>
        )}
        {form.type !== "expense" && (
          <select className="field" value={form.toAccount} onChange={(e) => setForm({ ...form, toAccount: e.target.value })} required>
            <option value="">To account</option>
            {accounts.map((account) => <option key={account._id} value={account._id}>{account.name}</option>)}
          </select>
        )}
        {form.type !== "transfer" && (
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Category</option>
            {filteredCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        )}
        <input className="field lg:col-span-5" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn-primary">Save</button>
      </form>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Category</th>
              <th>Account</th>
              <th className="text-right">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction._id} className="border-t border-slate-100">
                <td className="py-3">{new Date(transaction.date).toLocaleDateString()}</td>
                <td>{transaction.description || "-"}</td>
                <td className="capitalize">{transaction.type}</td>
                <td>{transaction.category?.name || "-"}</td>
                <td>{transaction.type === "transfer" ? `${transaction.fromAccount?.name} to ${transaction.toAccount?.name}` : transaction.fromAccount?.name || transaction.toAccount?.name}</td>
                <td className="text-right font-semibold">{money(transaction.amount, user.currency)}</td>
                <td className="text-right">
                  <button className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => remove(transaction._id)} title="Delete transaction">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
