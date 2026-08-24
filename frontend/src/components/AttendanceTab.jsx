import { useEffect, useState } from "react";
import { api } from "../api/client";

const STATUSES = ["present", "absent", "late"];

const STATUS_STYLES = {
  present: "bg-chalkboard text-paper",
  absent: "bg-terracotta text-paper",
  late: "bg-amber text-chalkboard",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendanceTab({ classId, students }) {
  const [date, setDate] = useState(today());
  const [marks, setMarks] = useState({}); // studentId -> status
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadForDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, students]);

  async function loadForDate(d) {
    if (students.length === 0) return;
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const records = await api.getClassAttendance(classId, d);
      const map = {};
      records.forEach((r) => {
        map[r.student_id] = r.status;
      });
      setMarks(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function setStatus(studentId, status) {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
    setSaved(false);
  }

  function markAll(status) {
    const map = {};
    students.forEach((s) => (map[s.id] = status));
    setMarks(map);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const records = students
        .filter((s) => marks[s.id])
        .map((s) => ({ student_id: s.id, status: marks[s.id] }));

      if (records.length === 0) {
        setError("Mark at least one student before saving.");
        setSaving(false);
        return;
      }

      await api.markAttendance(classId, { date, records });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-line rounded-lg">
        <p className="text-slate/60 text-sm">Add students to this class before taking attendance.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate/70">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
          />
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => markAll("present")}
            className="px-3 py-1.5 rounded-md border border-line hover:bg-white transition"
          >
            Mark all present
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate/50 text-sm">Loading…</p>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-slate/60">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-chalkboard font-medium">{s.full_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatus(s.id, status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition border ${
                            marks[s.id] === status
                              ? STATUS_STYLES[status] + " border-transparent"
                              : "border-line text-slate/50 hover:border-slate/30"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-chalkboard hover:bg-chalkboard2 text-paper px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save attendance"}
        </button>
        {saved && <span className="text-sm text-chalkboard">Saved for {date}.</span>}
      </div>
    </div>
  );
}
