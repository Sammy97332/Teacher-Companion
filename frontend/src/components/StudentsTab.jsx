import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

function StudentForm({ initial, onSubmit, onCancel, saving, error, submitLabel }) {
  const [fullName, setFullName] = useState(initial?.full_name || "");
  const [admissionNumber, setAdmissionNumber] = useState(initial?.admission_number || "");
  const [gender, setGender] = useState(initial?.gender || "");
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardian_phone || "");

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      full_name: fullName,
      admission_number: admissionNumber || null,
      gender: gender || null,
      guardian_phone: guardianPhone || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
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
      <div className="sm:col-span-4 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber hover:bg-amber/90 text-chalkboard font-medium px-4 py-2 rounded-md text-sm transition disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md text-sm border border-line text-slate/70 hover:bg-paper transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function StudentsTab({ classId, students, onStudentsChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(payload) {
    setSaving(true);
    setError("");
    try {
      await api.addStudent(classId, payload);
      setShowAddForm(false);
      onStudentsChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(studentId, payload) {
    setSaving(true);
    setError("");
    try {
      await api.updateStudent(studentId, payload);
      setEditingId(null);
      onStudentsChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(studentId) {
    setSaving(true);
    setError("");
    try {
      await api.deleteStudent(studentId);
      setDeletingId(null);
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
          onClick={() => {
            setShowAddForm((v) => !v);
            setEditingId(null);
            setError("");
          }}
          className="text-sm bg-chalkboard hover:bg-chalkboard2 text-paper px-3 py-1.5 rounded-md font-medium transition"
        >
          {showAddForm ? "Cancel" : "+ Add student"}
        </button>
      </div>

      {showAddForm && (
        <StudentForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
          saving={saving}
          error={error}
          submitLabel="Add student"
        />
      )}

      {students.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg">
          <p className="text-slate/60 text-sm">No students added yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) =>
            editingId === s.id ? (
              <StudentForm
                key={s.id}
                initial={s}
                onSubmit={(payload) => handleUpdate(s.id, payload)}
                onCancel={() => {
                  setEditingId(null);
                  setError("");
                }}
                saving={saving}
                error={error}
                submitLabel="Save changes"
              />
            ) : null
          )}

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
                {students.map((s) =>
                  editingId === s.id ? null : (
                    <tr key={s.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-chalkboard font-medium">{s.full_name}</td>
                      <td className="px-4 py-2.5 text-slate/70 font-tabular">
                        {s.admission_number || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate/70">{s.gender || "—"}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setShowAddForm(false);
                            setError("");
                          }}
                          className="text-slate/60 hover:text-chalkboard font-medium mr-3"
                        >
                          Edit
                        </button>
                        <Link
                          to={`/students/${s.id}/report-card`}
                          className="text-amber hover:underline font-medium mr-3"
                        >
                          Report card
                        </Link>
                        {deletingId === s.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-terracotta text-xs">Delete?</span>
                            <button
                              onClick={() => handleDelete(s.id)}
                              disabled={saving}
                              className="text-terracotta font-semibold hover:underline"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-slate/50 hover:underline"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingId(s.id)}
                            className="text-terracotta/70 hover:text-terracotta font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
