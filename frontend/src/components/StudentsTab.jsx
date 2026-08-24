import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function StudentsTab({ classId, students, onStudentsChange }) {
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [gender, setGender] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.addStudent(classId, {
        full_name: fullName,
        admission_number: admissionNumber || undefined,
        gender: gender || undefined,
        guardian_phone: guardianPhone || undefined,
      });
      setFullName("");
      setAdmissionNumber("");
      setGender("");
      setGuardianPhone("");
      setShowForm(false);
      onStudentsChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-chalkboard">
          Students ({students.length})
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-chalkboard hover:bg-chalkboard2 text-paper px-3 py-1.5 rounded-md font-medium transition"
        >
          {showForm ? "Cancel" : "+ Add student"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-line rounded-lg p-4 mb-4 grid sm:grid-cols-4 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate/70 mb-1">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
              placeholder="Ama Serwaa"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate/70 mb-1">Admission #</label>
            <input
              value={admissionNumber}
              onChange={(e) => setAdmissionNumber(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
              placeholder="BB-0231"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate/70 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50 bg-white"
            >
              <option value="">—</option>
              <option value="F">Female</option>
              <option value="M">Male</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate/70 mb-1">Guardian phone</label>
            <input
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-line rounded-md focus:outline-none focus:ring-2 focus:ring-amber/50"
              placeholder="024 000 0000"
            />
          </div>
          {error && <p className="text-sm text-terracotta sm:col-span-4">{error}</p>}
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-amber hover:bg-amber/90 text-chalkboard font-medium px-4 py-2 rounded-md text-sm transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Add student"}
            </button>
          </div>
        </form>
      )}

      {students.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg">
          <p className="text-slate/60 text-sm">No students added yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-line rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-slate/60">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Admission #</th>
                <th className="px-4 py-2.5 font-medium">Gender</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-chalkboard font-medium">{s.full_name}</td>
                  <td className="px-4 py-2.5 text-slate/70 font-tabular">
                    {s.admission_number || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate/70">{s.gender || "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={`/students/${s.id}/report-card`}
                      className="text-amber hover:underline font-medium"
                    >
                      Report card →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
