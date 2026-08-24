const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

function getToken() {
  return localStorage.getItem("tc_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),

  // Classes
  getClasses: () => request("/classes"),
  createClass: (payload) => request("/classes", { method: "POST", body: payload }),
  getClass: (classId) => request(`/classes/${classId}`),

  // Students
  getStudents: (classId) => request(`/classes/${classId}/students`),
  addStudent: (classId, payload) => request(`/classes/${classId}/students`, { method: "POST", body: payload }),

  // Subjects
  getSubjects: (classId) => request(`/classes/${classId}/subjects`),
  addSubject: (classId, payload) => request(`/classes/${classId}/subjects`, { method: "POST", body: payload }),

  // Attendance
  markAttendance: (classId, payload) => request(`/classes/${classId}/attendance`, { method: "POST", body: payload }),
  getClassAttendance: (classId, date) => request(`/classes/${classId}/attendance?date=${date}`),
  getStudentAttendance: (studentId) => request(`/students/${studentId}/attendance`),

  // Assessments
  addAssessment: (studentId, payload) => request(`/students/${studentId}/assessments`, { method: "POST", body: payload }),
  getAssessments: (studentId, term) => request(`/students/${studentId}/assessments${term ? `?term=${encodeURIComponent(term)}` : ""}`),

  // Report card
  getReportCard: (studentId, term) => request(`/students/${studentId}/report-card?term=${encodeURIComponent(term)}`),

  // Admin
  getAdminOverview: () => request("/admin/overview"),
  getAdminTeachers: () => request("/admin/teachers"),
};

export { getToken };
