import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import StudentsTab from "../components/StudentsTab";
import AttendanceTab from "../components/AttendanceTab";
import SubjectsTab from "../components/SubjectsTab";
import { api } from "../api/client";

const TABS = [
  { key: "students", label: "Students" },
  { key: "attendance", label: "Attendance" },
  { key: "subjects", label: "Subjects & CA" },
];

export default function ClassDetailPage() {
  const { classId } = useParams();
  const [schoolClass, setSchoolClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState("students");
  const [error, setError] = useState("");

  useEffect(() => {
    loadClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function loadClass() {
    try {
      const data = await api.getClass(classId);
      setSchoolClass(data);
      setStudents(data.students || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshStudents() {
    const data = await api.getStudents(classId);
    setStudents(data);
  }

  if (error) {
    return (
      <Layout>
        <p className="text-terracotta text-sm">{error}</p>
      </Layout>
    );
  }

  if (!schoolClass) {
    return (
      <Layout>
        <p className="text-slate/50 text-sm">Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to="/classes" className="text-sm text-slate/50 hover:text-slate mb-2 inline-block">
        ← All classes
      </Link>
      <h1 className="font-display text-2xl font-semibold text-chalkboard mb-1">
        {schoolClass.name}
      </h1>
      <p className="text-sm text-slate/60 mb-6">
        {schoolClass.academic_year} · {schoolClass.term}
      </p>

      <div className="flex gap-1 border-b border-line mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t.key
                ? "border-amber text-chalkboard"
                : "border-transparent text-slate/50 hover:text-slate"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "students" && (
        <StudentsTab classId={classId} students={students} onStudentsChange={refreshStudents} />
      )}
      {tab === "attendance" && <AttendanceTab classId={classId} students={students} />}
      {tab === "subjects" && <SubjectsTab classId={classId} students={students} />}
    </Layout>
  );
}
