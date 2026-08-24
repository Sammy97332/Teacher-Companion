import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-chalkboard text-paper">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/classes" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber text-chalkboard font-display font-semibold flex items-center justify-center text-sm">
                T
              </div>
              <span className="font-display font-semibold tracking-tight">
                Teacher's Companion
              </span>
            </Link>
            {user?.role === "admin" && (
              <nav className="flex items-center gap-4 text-sm">
                <Link to="/admin" className="text-paper/70 hover:text-paper transition">
                  School overview
                </Link>
                <Link to="/classes" className="text-paper/70 hover:text-paper transition">
                  My classes
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-paper/70">
              {user?.full_name} <span className="text-amber">· {user?.role}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded border border-paper/20 hover:bg-paper/10 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
