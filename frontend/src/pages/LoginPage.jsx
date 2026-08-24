import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let loggedInUser;
      if (mode === "login") {
        loggedInUser = await login(email, password);
      } else {
        loggedInUser = await register(fullName, email, password, role);
      }
      navigate(loggedInUser.role === "admin" ? "/admin" : "/classes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-chalkboard text-paper font-display text-xl mb-4">
            T
          </div>
          <h1 className="font-display text-2xl font-semibold text-chalkboard">
            Teacher's Companion
          </h1>
          <p className="text-sm text-slate/70 mt-1">Best Brain Foundation Academy</p>
        </div>

        <div className="bg-white border border-line rounded-lg shadow-sm p-6">
          <div className="flex gap-1 mb-6 bg-paper rounded-md p-1 border border-line">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded transition ${
                mode === "login" ? "bg-chalkboard text-paper" : "text-slate/60"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded transition ${
                mode === "register" ? "bg-chalkboard text-paper" : "text-slate/60"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate mb-1">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
                  placeholder="Samuel Kojo"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
                placeholder="you@bestbrain.edu.gh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
                placeholder="••••••••"
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50 bg-white"
                >
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin / Headmaster</option>
                </select>
              </div>
            )}

            {error && (
              <div className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chalkboard hover:bg-chalkboard2 text-paper font-medium py-2.5 rounded-md transition disabled:opacity-60"
            >
              {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
