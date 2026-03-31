import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Home from "./pages/Home";
import NewRequest from "./pages/NewRequest";
import RequestDetail from "./pages/RequestDetail";
import { useAuth } from "./context/AuthContext";

function ProtectedLayout({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) return <div style={{ padding: "30px" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-panel">
        <Header />
        <div className="page-body">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
      <Route path="/requests/new" element={<ProtectedLayout><NewRequest /></ProtectedLayout>} />
      <Route path="/requests/:id" element={<ProtectedLayout><RequestDetail /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}