import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [term, setTerm] = useState("Term 1");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    setLoading(true);
    try {
      const data = await api.getClasses();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.createClass({ name, academic_year: academicYear, term });
      setName("");
      setShowForm(false);
      await loadClasses();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-chalkboard">
            Your classes
          </h1>
          <p className="text-sm text-slate/60 mt-1">
            Manage students, attendance, and report cards.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-chalkboard hover:bg-chalkboard2 text-paper px-4 py-2 rounded-md text-sm font-medium transition"
        >
          {showForm ? "Cancel" : "+ New class"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-line rounded-lg p-5 mb-6 grid sm:grid-cols-4 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate/70 mb-1">Class name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Basic 5"
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate/70 mb-1">Academic year</label>
            <input
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate/70 mb-1">Term</label>
            <input
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={creating}
              className="bg-amber hover:bg-amber/90 text-chalkboard font-medium px-4 py-2 rounded-md text-sm transition disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create class"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate/50 text-sm">Loading…</p>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-line rounded-lg">
          <p className="text-slate/60">No classes yet.</p>
          <p className="text-sm text-slate/40 mt-1">Create your first class to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/classes/${c.id}`)}
              className="text-left bg-white border border-line rounded-lg p-5 hover:border-amber hover:shadow-sm transition"
            >
              <h3 className="font-display font-semibold text-lg text-chalkboard">{c.name}</h3>
              <p className="text-sm text-slate/60 mt-1">
                {c.academic_year} · {c.term}
              </p>
              <p className="text-sm text-amber font-medium mt-3 font-tabular">
                {c.student_count} student{c.student_count === 1 ? "" : "s"}
              </p>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
