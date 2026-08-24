import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { api } from "../api/client";

const GRADE_COLORS = {
  A: "text-chalkboard",
  B: "text-chalkboard",
  C: "text-amber",
  D: "text-amber",
  E: "text-terracotta",
  F: "text-terracotta",
};

export default function ReportCardPage() {
  const { studentId } = useParams();
  const [term, setTerm] = useState("Term 1");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport(term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function loadReport(t) {
    setLoading(true);
    setError("");
    try {
      const data = await api.getReportCard(studentId, t);
      setReport(data);
    } catch (err) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="print:hidden">
        <Link to="/classes" className="text-sm text-slate/50 hover:text-slate mb-4 inline-block">
          ← All classes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-slate/70 mb-1">Term</label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadReport(term)}
                className="px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
              />
            </div>
            <button
              onClick={() => loadReport(term)}
              className="bg-chalkboard hover:bg-chalkboard2 text-paper px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Load
            </button>
          </div>
          {report && (
            <button
              onClick={() => window.print()}
              className="bg-amber hover:bg-amber/90 text-chalkboard px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Print report card
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-slate/50 text-sm">Loading…</p>}
      {error && (
        <p className="text-sm text-terracotta bg-terracotta/10 border border-terracotta/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {report && (
        <div className="bg-white border border-line rounded-lg p-8 max-w-2xl mx-auto print:border-0 print:shadow-none">
          <div className="text-center border-b-2 border-chalkboard pb-4 mb-6">
            <p className="text-xs tracking-widest uppercase text-slate/50 mb-1">
              Best Brain Foundation Academy
            </p>
            <h1 className="font-display text-xl font-semibold text-chalkboard">
              Termly Report Card
            </h1>
          </div>

          <div className="flex justify-between text-sm mb-6">
            <div>
              <p className="text-slate/50 text-xs uppercase tracking-wide">Student</p>
              <p className="font-medium text-chalkboard">{report.student.full_name}</p>
            </div>
            <div className="text-right">
              <p className="text-slate/50 text-xs uppercase tracking-wide">Term</p>
              <p className="font-medium text-chalkboard">{report.term}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-chalkboard/30 text-left text-slate/60">
                <th className="py-2 font-medium">Subject</th>
                <th className="py-2 font-medium text-right">CA (30%)</th>
                <th className="py-2 font-medium text-right">Exam (70%)</th>
                <th className="py-2 font-medium text-right">Final</th>
                <th className="py-2 font-medium text-right">Grade</th>
              </tr>
            </thead>
            <tbody>
              {report.subjects.map((s) => (
                <tr key={s.subject} className="border-b border-line">
                  <td className="py-2.5 text-chalkboard">{s.subject}</td>
                  <td className="py-2.5 text-right font-tabular text-slate">
                    {s.ca_score ?? "—"}
                  </td>
                  <td className="py-2.5 text-right font-tabular text-slate">
                    {s.exam_score ?? "—"}
                  </td>
                  <td className="py-2.5 text-right font-tabular font-medium text-chalkboard">
                    {s.final_score ?? "—"}
                  </td>
                  <td
                    className={`py-2.5 text-right font-semibold ${
                      s.grade ? GRADE_COLORS[s.grade] : "text-slate/30"
                    }`}
                  >
                    {s.grade ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.subjects.some((s) => s.status !== "complete") && (
            <p className="text-xs text-terracotta mb-6">
              Some subjects are missing CA or exam scores and show as "—" until recorded.
            </p>
          )}

          <div className="flex justify-between items-center border-t-2 border-chalkboard pt-4">
            <span className="font-display font-semibold text-chalkboard">Overall average</span>
            <div className="text-right">
              <span className="font-tabular font-semibold text-lg text-chalkboard mr-2">
                {report.overall_average ?? "—"}
              </span>
              {report.overall_grade && (
                <span className={`font-display font-bold text-xl ${GRADE_COLORS[report.overall_grade]}`}>
                  {report.overall_grade}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
