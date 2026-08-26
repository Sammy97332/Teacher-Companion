import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

const STATUS_STYLES = {
  present: "bg-chalkboard text-paper",
  absent: "bg-terracotta text-paper",
  late: "bg-amber text-chalkboard",
};

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export default function AttendanceHistoryPage() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api.getStudentAttendance(studentId);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <Link to="/classes" className="text-sm text-slate/50 hover:text-slate mb-4 inline-block">
        ← All classes
      </Link>

      <h1 className="font-display text-2xl font-semibold text-chalkboard mb-1">
        Attendance history
      </h1>

      {loading && <p className="text-slate/50 text-sm">Loading…</p>}
      {error && (
        <p className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {data && (
        <>
          <div className="grid sm:grid-cols-4 gap-4 my-6">
            <div className="bg-white border border-line rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Days recorded</p>
              <p className="font-display text-2xl font-semibold text-chalkboard font-tabular">
                {data.total_days_recorded}
              </p>
            </div>
            <div className="bg-white border border-line rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Present</p>
              <p className="font-display text-2xl font-semibold text-chalkboard font-tabular">
                {data.present}
              </p>
            </div>
            <div className="bg-white border border-line rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Absent</p>
              <p className="font-display text-2xl font-semibold text-terracotta font-tabular">
                {data.absent}
              </p>
            </div>
            <div className="bg-white border border-line rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-slate/50 mb-1">Attendance rate</p>
              <p className="font-display text-2xl font-semibold text-amber font-tabular">
                {data.attendance_rate !== null ? `${data.attendance_rate}%` : "—"}
              </p>
            </div>
          </div>

          <h2 className="font-display font-semibold text-lg text-chalkboard mb-3">
            Full record
          </h2>

          {data.records.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-line rounded-lg">
              <p className="text-slate/60 text-sm">No attendance has been recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper text-left text-slate/60">
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r) => (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-chalkboard">{formatDate(r.date)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
