import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("accessToken")));

  const saveSession = (data) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const clearSession = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const load = async () => {
      if (!localStorage.getItem("accessToken")) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (payload) => {
        const { data } = await api.post("/auth/login", payload);
        saveSession(data);
      },
      register: async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        saveSession(data);
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          clearSession();
        }
      },
      updateUser: (nextUser) => {
        localStorage.setItem("user", JSON.stringify(nextUser));
        setUser(nextUser);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
