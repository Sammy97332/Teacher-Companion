import { useEffect, useState } from "react";
import { api } from "../api/client";

const TYPES = ["quiz", "test", "exercise", "exam"];

export default function SubjectsTab({ classId, students }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newSubject, setNewSubject] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [assessmentType, setAssessmentType] = useState("quiz");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [savingScore, setSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, [classId]);

  async function loadSubjects() {
    setLoading(true);
    try {
      const data = await api.getSubjects(classId);
      setSubjects(data);
      if (data.length > 0 && !selectedSubjectId) setSelectedSubjectId(String(data[0].id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    setAddingSubject(true);
    setError("");
    try {
      await api.addSubject(classId, { name: newSubject });
      setNewSubject("");
      await loadSubjects();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingSubject(false);
    }
  }

  async function handleRecordScore(e) {
    e.preventDefault();
    setSavingScore(true);
    setScoreSaved(false);
    setError("");
    try {
      await api.addAssessment(selectedStudentId, {
        assessment_type: assessmentType,
        subject_id: Number(selectedSubjectId),
        term,
        title: title || undefined,
        score: Number(score),
        max_score: Number(maxScore),
      });
      setScore("");
      setTitle("");
      setScoreSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingScore(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display font-semibold text-lg text-chalkboard mb-3">Subjects</h2>
        <form onSubmit={handleAddSubject} className="flex gap-2 mb-4">
          <input
            required
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="flex-1 max-w-xs px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
          />
          <button
            type="submit"
            disabled={addingSubject}
            className="bg-chalkboard hover:bg-chalkboard2 text-paper px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-60"
          >
            Add subject
          </button>
        </form>

        {loading ? (
          <p className="text-slate/50 text-sm">Loading…</p>
        ) : subjects.length === 0 ? (
          <p className="text-slate/60 text-sm">No subjects yet — add one above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span
                key={s.id}
                className="px-3 py-1 rounded-full bg-white border border-line text-sm text-chalkboard"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {subjects.length > 0 && students.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg text-chalkboard mb-3">
            Record a score
          </h2>
          <form
            onSubmit={handleRecordScore}
            className="bg-white border border-line rounded-lg p-4 grid sm:grid-cols-3 gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate/70 mb-1">Student</label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber/50"
              >
                <option value="">Select…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate/70 mb-1">Subject</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber/50"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate/70 mb-1">Term</label>
              <input
                required
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate/70 mb-1">Type</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber/50 capitalize"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate/70 mb-1">Title (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quiz 1 - Fractions"
                className="w-full px-3 py-2 border border-line rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate/70 mb-1">Score</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-md text-sm font-tabular focus:outline-none focus:ring-2 focus:ring-amber/50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate/70 mb-1">Max</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="w-full px-3 py-2 border border-line rounded-md text-sm font-tabular focus:outline-none focus:ring-2 focus:ring-amber/50"
                />
              </div>
            </div>

            {error && <p className="text-sm text-terracotta sm:col-span-3">{error}</p>}

            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingScore}
                className="bg-amber hover:bg-amber/90 text-chalkboard font-medium px-4 py-2 rounded-md text-sm transition disabled:opacity-60"
              >
                {savingScore ? "Saving…" : "Record score"}
              </button>
              {scoreSaved && <span className="text-sm text-chalkboard">Score recorded.</span>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
