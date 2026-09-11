import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

function VerifyForm({ email, onBack }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { verifyEmail, resendCode } = useAuth();
  const navigate = useNavigate();

   async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const verifiedUser = await verifyEmail(email, code.trim());
      navigate(verifiedUser.role === "admin" ? "/admin" : "/classes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await resendCode(email);
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-white border border-line rounded-lg shadow-sm p-6">
      <h2 className="font-display text-lg font-semibold text-chalkboard mb-1">
        Check your email
      </h2>
      <p className="text-sm text-slate/60 mb-5">
        We sent a 6-digit code to <span className="font-medium text-slate">{email}</span>.
        Enter it below to verify you're part of the staff.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate mb-1">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2 border border-line rounded-md text-center text-lg tracking-[0.3em] font-tabular focus:outline-none focus:ring-2 focus:ring-amber/50"
            placeholder="······"
          />
        </div>

        {error && (
          <div className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {info && (
          <div className="text-sm text-chalkboard bg-chalkboard/5 border border-chalkboard/10 rounded-md px-3 py-2">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full bg-chalkboard hover:bg-chalkboard2 text-paper font-medium py-2.5 rounded-md transition disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Verify and continue"}
        </button>

        <div className="flex justify-between text-sm pt-1">
          <button type="button" onClick={onBack} className="text-slate/50 hover:text-slate">
            ← Back
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-amber hover:underline disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState(null);
  const [adminSlotsAvailable, setAdminSlotsAvailable] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.checkAdminAvailability()
      .then((data) => setAdminSlotsAvailable(data.admin_slots_available))
      .catch(() => setAdminSlotsAvailable(1)); // fail open — don't block signup if this check fails
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const loggedInUser = await login(email, password);
        navigate(loggedInUser.role === "admin" ? "/admin" : "/classes");
      } else {
        await register(fullName, email, password, role);
        setPendingVerifyEmail(email);
      }
    } catch (err) {
      // Login blocked because the account isn't verified yet — send them
      // straight to the code-entry screen instead of just showing an error.
      if (err.status === 403 && err.data?.email_verified === false) {
        setPendingVerifyEmail(err.data.email);
      } else {
        setError(err.message);
      }
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

        {pendingVerifyEmail ? (
          <VerifyForm email={pendingVerifyEmail} onBack={() => setPendingVerifyEmail(null)} />
        ) : (
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
                    {adminSlotsAvailable > 0 && (
                      <option value="admin">Admin / Headmaster</option>
                    )}
                  </select>
                  {adminSlotsAvailable === 0 && (
                    <p className="text-xs text-slate/50 mt-1">
                      All admin accounts have already been claimed.
                    </p>
                  )}
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
        )}
      </div>
    </div>
  );
}