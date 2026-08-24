import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ClassesPage from "./pages/ClassesPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import ReportCardPage from "./pages/ReportCardPage";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:classId"
        element={
          <ProtectedRoute>
            <ClassDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:studentId/report-card"
        element={
          <ProtectedRoute>
            <ReportCardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/classes" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
