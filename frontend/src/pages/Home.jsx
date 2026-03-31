


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  const [summary, setSummary] = useState({
    total: 0,
    pending_my_approval: 0,
    approved_flow: 0,
    rejected: 0,
    recruitment: 0,
    closed: 0
  });

  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    department: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadSummary() {
    try {
      const res = await api.get("/home-summary");
      setSummary(res.data);
    } catch (error) {
      console.error("Summary load failed:", error);
      setMessage(error?.response?.data?.message || "Failed to load summary");
    }
  }

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await api.get("/requests", { params: filters });
      setRows(res.data || []);
    } catch (error) {
      console.error("Requests load failed:", error);
      setMessage(error?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function getStatusClass(status) {
    if (
      status === "Manager Approved" ||
      status === "CTO Approved" ||
      status === "HR Approved"
    ) {
      return "status approved";
    }

    if (
      status === "Manager Rejected" ||
      status === "CTO Rejected" ||
      status === "HR Rejected"
    ) {
      return "status rejected";
    }

    if (
      status === "Recruiter Received" ||
      status === "Recruitment In Progress"
    ) {
      return "status progress";
    }

    if (status === "Closed") {
      return "status closed";
    }

    return "status submitted";
  }

  return (
    <div>
      {message && <div className="success-box">{message}</div>}

      <div className="stats-grid stats-grid-6">
        <div className="stat-card">
          <span>Total</span>
          <h3>{summary.total}</h3>
        </div>

        <div className="stat-card">
          <span>Pending My Approval</span>
          <h3>{summary.pending_my_approval}</h3>
        </div>

        <div className="stat-card">
          <span>Approved</span>
          <h3>{summary.approved_flow}</h3>
        </div>

        <div className="stat-card">
          <span>Rejected</span>
          <h3>{summary.rejected}</h3>
        </div>

        <div className="stat-card">
          <span>Recruitment</span>
          <h3>{summary.recruitment}</h3>
        </div>

        <div className="stat-card">
          <span>Closed</span>
          <h3>{summary.closed}</h3>
        </div>
      </div>

      <div className="card">
        <div className="page-title-row">
          <div>
            <h2>{user?.role} Portal</h2>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Logged in as {user?.full_name}
            </p>
          </div>

          {(user?.role === "Requester" || user?.role === "Admin") && (
            <Link to="/requests/new" className="primary-btn">
              + New Request
            </Link>
          )}
        </div>

        <div className="filter-row">
          <input
            type="text"
            name="search"
            placeholder="Search by request no / emp id / employee name / designation"
            value={filters.search}
            onChange={handleFilterChange}
          />

          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Status</option>
            <option value="Submitted">Submitted</option>
            <option value="Manager Approved">Manager Approved</option>
            <option value="Manager Rejected">Manager Rejected</option>
            <option value="CTO Approved">CTO Approved</option>
            <option value="CTO Rejected">CTO Rejected</option>
            <option value="HR Approved">HR Approved</option>
            <option value="HR Rejected">HR Rejected</option>
            <option value="Recruiter Received">Recruiter Received</option>
            <option value="Recruitment In Progress">Recruitment In Progress</option>
            <option value="Closed">Closed</option>
          </select>

          <input
            type="text"
            name="department"
            placeholder="Filter by department"
            value={filters.department}
            onChange={handleFilterChange}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request No</th>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Zone</th>
                <th>Branch</th>
                <th>Type</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Open</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10">Loading...</td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.request_number}</td>
                    <td>{row.employee_emp_id}</td>
                    <td>{row.employee_name}</td>
                    <td>{row.zone}</td>
                    <td>{row.branch}</td>
                    <td>{row.request_type}</td>
                    <td>{row.department}</td>
                    <td>{row.designation}</td>
                    <td>
                      <span className={getStatusClass(row.final_status)}>
                        {row.final_status}
                      </span>
                    </td>
                    <td>
                      <Link className="link-btn" to={`/requests/${row.id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}