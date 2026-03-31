

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function NewRequest() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    employee_user_id: "",
    zone: "",
    branch: "",
    request_type: "New Openings",
    department: "",
    designation: "",
    reporting_manager: "",
    openings: 1,
    experience_required: "",
    salary_range: "",
    key_skills: "",
    preferred_education: "",
    additional_skills: "",
    replaced_emp_id: "",
    replaced_emp_name: "",
    reason_for_requirement: "",
    priority_level: "Medium",
    required_joining_date: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadUsers() {
    try {
      const res = await api.get("/users/options");
      setUserOptions(res.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      setMessage("Failed to load employee list");
    }
  }

  const employees = useMemo(() => {
    return userOptions.filter((u) => u.role === "Requester");
  }, [userOptions]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function handleEmployeeSelect(userId) {
    const selectedUser = employees.find(
      (u) => String(u.id) === String(userId)
    );

    if (!selectedUser) {
      setForm((prev) => ({
        ...prev,
        employee_user_id: "",
        zone: "",
        branch: "",
        department: "",
        designation: ""
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      employee_user_id: String(selectedUser.id),
      zone: selectedUser.zone || "",
      branch: selectedUser.branch || "",
      department: selectedUser.department || "",
      designation: selectedUser.designation || ""
    }));
  }

  function validateForm() {
    if (!form.employee_user_id) return "Please select employee";
    if (!form.zone.trim()) return "Please enter zone";
    if (!form.branch.trim()) return "Please enter branch";
    if (!form.request_type) return "Please select request type";
    if (!form.department.trim()) return "Please enter department";
    if (!form.designation.trim()) return "Please enter designation";

    if (
      form.request_type === "Replacement" &&
      (!form.replaced_emp_id.trim() || !form.replaced_emp_name.trim())
    ) {
      return "Please fill replaced employee ID and name";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        employee_user_id: Number(form.employee_user_id),
        openings: Number(form.openings || 1),
        salary_range: form.salary_range ? Number(form.salary_range) : 0,
        zone: form.zone.trim(),
        branch: form.branch.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        reporting_manager: form.reporting_manager.trim(),
        experience_required: form.experience_required.trim(),
        key_skills: form.key_skills.trim(),
        preferred_education: form.preferred_education.trim(),
        additional_skills: form.additional_skills.trim(),
        replaced_emp_id: form.replaced_emp_id.trim(),
        replaced_emp_name: form.replaced_emp_name.trim(),
        reason_for_requirement: form.reason_for_requirement.trim()
      };

      const res = await api.post("/requests", payload);
      setMessage(res.data?.message || "Request created successfully");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Create request failed:", error);
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to submit request"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      {message && <div className="success-box">{message}</div>}

      <div className="page-title-row">
        <h2>New Request</h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="full-width">
          <label>Select Employee</label>
          <select
            name="employee_user_id"
            value={form.employee_user_id}
            onChange={(e) => {
              handleChange(e);
              handleEmployeeSelect(e.target.value);
            }}
            required
          >
            <option value="">-- Select Employee --</option>
            {employees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} - {u.emp_id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Zone</label>
          <input
            name="zone"
            value={form.zone}
            onChange={handleChange}
            placeholder="Zone"
            required
          />
        </div>

        <div>
          <label>Branch</label>
          <input
            name="branch"
            value={form.branch}
            onChange={handleChange}
            placeholder="Branch"
            required
          />
        </div>

        <div>
          <label>Type</label>
          <select
            name="request_type"
            value={form.request_type}
            onChange={handleChange}
            required
          >
            <option value="New Openings">New Openings</option>
            <option value="Replacement">Replacement</option>
          </select>
        </div>

        <div>
          <label>Department</label>
          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="Department"
            required
          />
        </div>

        <div>
          <label>Designation</label>
          <input
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Designation"
            required
          />
        </div>

        <div>
          <label>Reporting Manager</label>
          <input
            name="reporting_manager"
            value={form.reporting_manager}
            onChange={handleChange}
            placeholder="Reporting Manager"
          />
        </div>

        <div>
          <label>No. of Openings</label>
          <input
            type="number"
            min="1"
            name="openings"
            value={form.openings}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Experience Required</label>
          <input
            name="experience_required"
            value={form.experience_required}
            onChange={handleChange}
            placeholder="Experience Required"
          />
        </div>

        <div>
          <label>Salary Range</label>
          <input
            type="number"
            min="0"
            name="salary_range"
            value={form.salary_range}
            onChange={handleChange}
            placeholder="Salary Range"
          />
        </div>

        <div>
          <label>Priority</label>
          <select
            name="priority_level"
            value={form.priority_level}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label>Required Joining Date</label>
          <input
            type="date"
            name="required_joining_date"
            value={form.required_joining_date}
            onChange={handleChange}
          />
        </div>

        <div className="full-width">
          <label>Key Skills</label>
          <textarea
            name="key_skills"
            value={form.key_skills}
            onChange={handleChange}
            placeholder="Key Skills"
          />
        </div>

        <div>
          <label>Preferred Education</label>
          <input
            name="preferred_education"
            value={form.preferred_education}
            onChange={handleChange}
            placeholder="Preferred Education"
          />
        </div>

        <div>
          <label>Additional Skills</label>
          <input
            name="additional_skills"
            value={form.additional_skills}
            onChange={handleChange}
            placeholder="Additional Skills"
          />
        </div>

        {form.request_type === "Replacement" && (
          <>
            <div>
              <label>Replaced Employee ID</label>
              <input
                name="replaced_emp_id"
                value={form.replaced_emp_id}
                onChange={handleChange}
                placeholder="Replaced Employee ID"
              />
            </div>

            <div>
              <label>Replaced Employee Name</label>
              <input
                name="replaced_emp_name"
                value={form.replaced_emp_name}
                onChange={handleChange}
                placeholder="Replaced Employee Name"
              />
            </div>
          </>
        )}

        <div className="full-width">
          <label>Reason for Requirement</label>
          <textarea
            name="reason_for_requirement"
            value={form.reason_for_requirement}
            onChange={handleChange}
            placeholder="Reason for Requirement"
          />
        </div>

        <div className="full-width">
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}