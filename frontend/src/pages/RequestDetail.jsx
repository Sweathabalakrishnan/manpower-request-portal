
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [request, setRequest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadData() {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.request);
      setLogs(res.data.logs || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load request");
    }
  }

  async function handleAction(type, action) {
    if (action === "Rejected" && !comments.trim()) {
      setMessage("Comments required for rejection");
      return;
    }

    if (type === "hr" && !comments.trim()) {
      setMessage("HR comments are required");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/requests/${id}/${type}-action`, {
        action,
        comments: comments.trim()
      });

      setMessage("Action completed successfully");
      setComments("");
      loadData();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  if (!request) return <div className="card">Loading...</div>;

  const currentUserId = Number(user?.id);

  const canManagerAct =
    user?.role === "Manager" &&
    Number(request.manager_user_id) === currentUserId &&
    request.manager_status === "Pending";

  const canCtoAct =
    user?.role === "CTO" &&
    Number(request.cto_user_id) === currentUserId &&
    request.manager_status === "Approved" &&
    request.cto_status === "Pending";

  const canHrAct =
    user?.role === "HR" &&
    Number(request.hr_user_id) === currentUserId &&
    request.manager_status === "Approved" &&
    request.cto_status === "Approved" &&
    request.hr_status === "Pending";

  const canRecruiterAct =
    user?.role === "Recruiter" &&
    Number(request.recruiter_user_id) === currentUserId &&
    request.manager_status === "Approved" &&
    request.cto_status === "Approved" &&
    request.hr_status === "Approved";

  const canComment = canManagerAct || canCtoAct || canHrAct || canRecruiterAct;

  return (
    <div className="card">
      {message && <div className="success-box">{message}</div>}

      <h2>Request Detail</h2>

      <div className="detail-grid">
        <p><b>Request No:</b> {request.request_number}</p>
        <p><b>Employee:</b> {request.employee_name}</p>
        <p><b>EMP ID:</b> {request.employee_emp_id}</p>
        <p><b>Zone:</b> {request.zone}</p>
        <p><b>Branch:</b> {request.branch}</p>
        <p><b>Type:</b> {request.request_type}</p>
        <p><b>Department:</b> {request.department}</p>
        <p><b>Designation:</b> {request.designation}</p>
        <p><b>Status:</b> {request.final_status}</p>
        <p><b>Manager Status:</b> {request.manager_status}</p>
        <p><b>CTO Status:</b> {request.cto_status}</p>
        <p><b>HR Status:</b> {request.hr_status}</p>
        <p><b>Recruiter Status:</b> {request.recruiter_status}</p>
      </div>

      <div className="full-width">
        <label>
          {user?.role === "HR"
            ? "Selected Candidate / HR Comments"
            : "Comments"}
        </label>

        <textarea
          placeholder={
            user?.role === "HR"
              ? "Enter selected candidate / HR remarks"
              : "Enter comments"
          }
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={!canComment || loading}
        />
      </div>

      {canManagerAct && (
        <div className="btn-group">
          <button
            className="approve"
            onClick={() => handleAction("manager", "Approved")}
            disabled={loading}
          >
            Approve
          </button>

          <button
            className="reject"
            onClick={() => handleAction("manager", "Rejected")}
            disabled={loading}
          >
            Reject
          </button>
        </div>
      )}

      {canCtoAct && (
        <div className="btn-group">
          <button
            className="approve"
            onClick={() => handleAction("cto", "Approved")}
            disabled={loading}
          >
            Approve
          </button>

          <button
            className="reject"
            onClick={() => handleAction("cto", "Rejected")}
            disabled={loading}
          >
            Reject
          </button>
        </div>
      )}

      {canHrAct && (
        <div className="btn-group">
          <button
            className="approve"
            onClick={() => handleAction("hr", "Approved")}
            disabled={loading}
          >
            Approve
          </button>

          <button
            className="reject"
            onClick={() => handleAction("hr", "Rejected")}
            disabled={loading}
          >
            Reject
          </button>
        </div>
      )}

      {canRecruiterAct && (
        <div className="btn-group">
          <button
            onClick={() => handleAction("recruiter", "Received")}
            disabled={loading}
          >
            Received
          </button>

          <button
            onClick={() => handleAction("recruiter", "In Progress")}
            disabled={loading}
          >
            In Progress
          </button>

          <button
            onClick={() => handleAction("recruiter", "Closed")}
            disabled={loading}
          >
            Closed
          </button>
        </div>
      )}

      {!canComment && (
        <div className="info-box">
          You can view this request, but no action is pending for your login.
        </div>
      )}

      <h3>Logs</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Stage</th>
            <th>Action</th>
            <th>User</th>
            <th>Comments</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.stage}</td>
              <td>{log.action_taken}</td>
              <td>{log.actor_name}</td>
              <td>{log.comments}</td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}