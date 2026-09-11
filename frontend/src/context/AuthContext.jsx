import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("tc_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem("tc_token", data.access_token);
    localStorage.setItem("tc_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  // Registering no longer logs the user in directly — an email verification
  // step happens first. This just creates the (unverified) account.
  const register = useCallback(async (full_name, email, password, role) => {
    const data = await api.register({ full_name, email, password, role });
    return data;
  }, []);

  const verifyEmail = useCallback(async (email, code) => {
    const data = await api.verifyEmail({ email, code });
    localStorage.setItem("tc_token", data.access_token);
    localStorage.setItem("tc_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const resendCode = useCallback(async (email) => {
    return api.resendCode({ email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("tc_token");
    localStorage.removeItem("tc_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, verifyEmail, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
