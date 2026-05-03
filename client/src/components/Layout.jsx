import { Link, NavLink, Outlet } from "react-router-dom";
import { Banknote, ChartPie, CreditCard, LogOut, ReceiptText, Target, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: ChartPie },
  { to: "/accounts", label: "Accounts", icon: CreditCard },
  { to: "/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/profile", label: "Profile", icon: UserRound }
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-ink">
          <Banknote className="h-6 w-6 text-mint" />
          Money Notebook
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-teal-50 text-mint" : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-ink lg:hidden">
              <Banknote className="h-5 w-5 text-mint" />
              Money Notebook
            </Link>
            <div className="hidden text-sm text-slate-500 lg:block">Signed in as {user?.name}</div>
            <button onClick={logout} className="btn-secondary">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm ${
                      isActive ? "bg-teal-50 text-mint" : "text-slate-600"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
