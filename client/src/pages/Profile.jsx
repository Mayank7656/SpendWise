import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    currency: user.currency,
    currentPassword: "",
    newPassword: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense", color: "#2563eb" });

  const loadCategories = async () => {
    const { data } = await api.get("/categories");
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const payload = { ...form };
      if (!payload.newPassword) {
        delete payload.currentPassword;
        delete payload.newPassword;
      }
      const { data } = await api.put("/auth/profile", payload);
      updateUser(data.user);
      setForm({ ...form, currentPassword: "", newPassword: "" });
      setMessage("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile");
    }
  };

  const addCategory = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/categories", categoryForm);
      setCategoryForm({ name: "", type: "expense", color: "#2563eb" });
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save category");
    }
  };

  const removeCategory = async (id) => {
    setError("");
    try {
      await api.delete(`/categories/${id}`);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete category");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Profile</h1>
        <p className="text-sm text-slate-500">Manage your name, currency, and password.</p>
      </div>

      <form onSubmit={submit} className="panel space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Name</label>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Currency</label>
          <input className="field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={5} required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Current Password</label>
            <input className="field" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">New Password</label>
            <input className="field" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} minLength={8} />
          </div>
        </div>
        {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary">Save Changes</button>
      </form>

      <section className="panel space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Categories</h2>
          <p className="text-sm text-slate-500">Create income and expense labels for transactions.</p>
        </div>
        <form onSubmit={addCategory} className="grid gap-3 md:grid-cols-4">
          <input className="field" placeholder="Category name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
          <select className="field" value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input className="field h-10" type="color" value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })} />
          <button className="btn-primary">Add Category</button>
        </form>
        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category._id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                <div>
                  <div className="text-sm font-semibold text-ink">{category.name}</div>
                  <div className="text-xs capitalize text-slate-500">{category.type}</div>
                </div>
              </div>
              <button className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => removeCategory(category._id)} title="Delete category" type="button">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
