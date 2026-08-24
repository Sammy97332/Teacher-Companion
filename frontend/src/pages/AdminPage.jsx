import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [ov, ts] = await Promise.all([api.getAdminOverview(), api.getAdminTeachers()]);
      setOverview(ov);
      setTeachers(ts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-slate/50 text-sm">Loading school overview…</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2">
          {error}
        </p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="font-display text-2xl font-semibold text-chalkboard mb-1">
        School overview
      </h1>
      <p className="text-sm text-slate/60 mb-6">
        Best Brain Foundation Academy — all teachers and classes.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Teachers</p>
          <p className="font-display text-3xl font-semibold text-chalkboard font-tabular">
            {overview.teacher_count}
          </p>
        </div>
        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Classes</p>
          <p className="font-display text-3xl font-semibold text-chalkboard font-tabular">
            {overview.class_count}
          </p>
        </div>
        <div className="bg-white border border-line rounded-lg p-5">
          <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Students</p>
          <p className="font-display text-3xl font-semibold text-amber font-tabular">
            {overview.student_count}
          </p>
        </div>
      </div>

      <h2 className="font-display font-semibold text-lg text-chalkboard mb-3">By teacher</h2>

      {teachers.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg">
          <p className="text-slate/60 text-sm">No teachers have registered yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((t) => (
            <div key={t.id} className="bg-white border border-line rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-paper/50 transition"
              >
                <div>
                  <p className="font-medium text-chalkboard">{t.full_name}</p>
                  <p className="text-xs text-slate/50">{t.email}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate/60">
                  <span className="font-tabular">
                    {t.classes.length} class{t.classes.length === 1 ? "" : "es"}
                  </span>
                  <span className="text-slate/30">{expanded === t.id ? "▲" : "▼"}</span>
                </div>
              </button>

              {expanded === t.id && (
                <div className="border-t border-line divide-y divide-line">
                  {t.classes.length === 0 ? (
                    <p className="px-5 py-3 text-sm text-slate/50">No classes yet.</p>
                  ) : (
                    t.classes.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/classes/${c.id}`)}
                        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-paper/50 transition"
                      >
                        <div>
                          <p className="text-sm font-medium text-chalkboard">{c.name}</p>
                          <p className="text-xs text-slate/50">
                            {c.academic_year} · {c.term}
                          </p>
                        </div>
                        <span className="text-sm text-amber font-medium font-tabular">
                          {c.student_count} student{c.student_count === 1 ? "" : "s"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
