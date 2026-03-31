


const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function generateRequestNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MPR-${year}-${random}`;
}

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing in .env");
  }

  return jwt.sign(
    {
      id: user.id,
      emp_id: user.emp_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      team_id: user.team_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

async function addLog(requestId, stage, action, user, comments = "") {
  await pool.query(
    `INSERT INTO manpower_logs
      (request_id, stage, action_taken, actor_user_id, actor_name, actor_emp_id, comments)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      requestId,
      stage,
      action,
      user?.id || null,
      user?.full_name || null,
      user?.emp_id || null,
      comments || "",
    ]
  );
}

function getPortalVisibilityClause(user, params) {
  if (user.role === "Admin") return "";

  if (user.role === "Requester") {
    params.push(Number(user.id));
    return "mr.requester_user_id = ?";
  }

  if (user.role === "Manager") {
    params.push(Number(user.id));
    return "mr.manager_user_id = ?";
  }

  if (user.role === "CTO") {
    params.push(Number(user.id));
    return "mr.cto_user_id = ?";
  }

  if (user.role === "HR") {
    params.push(Number(user.id));
    return "mr.hr_user_id = ?";
  }

  if (user.role === "Recruiter") {
    params.push(Number(user.id));
    return "mr.recruiter_user_id = ?";
  }

  return "1 = 0";
}

app.get("/", (req, res) => {
  res.json({ message: "Backend running successfully" });
});

/* AUTH */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "User inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        emp_id: user.emp_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        team_id: user.team_id,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

/* USERS */

app.get("/api/users/options", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, emp_id, full_name, role, zone, branch, department, designation, team_id
       FROM users
       WHERE is_active = 1
       ORDER BY full_name ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Users options error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
});

/* HOME SUMMARY */

app.get("/api/home-summary", authMiddleware, async (req, res) => {
  try {
    let baseQuery = `SELECT COUNT(*) AS total FROM manpower_requests`;
    let baseParams = [];

    if (req.user.role === "Requester") {
      baseQuery += ` WHERE requester_user_id = ?`;
      baseParams = [Number(req.user.id)];
    } else if (req.user.role === "Manager") {
      baseQuery += ` WHERE manager_user_id = ?`;
      baseParams = [Number(req.user.id)];
    } else if (req.user.role === "CTO") {
      baseQuery += ` WHERE cto_user_id = ?`;
      baseParams = [Number(req.user.id)];
    } else if (req.user.role === "HR") {
      baseQuery += ` WHERE hr_user_id = ?`;
      baseParams = [Number(req.user.id)];
    } else if (req.user.role === "Recruiter") {
      baseQuery += ` WHERE recruiter_user_id = ?`;
      baseParams = [Number(req.user.id)];
    }

    const [[totalRow]] = await pool.query(baseQuery, baseParams);

    let pendingQuery = `SELECT 0 AS pending_my_approval`;
    let pendingParams = [];

    if (req.user.role === "Manager") {
      pendingQuery = `
        SELECT COUNT(*) AS pending_my_approval
        FROM manpower_requests
        WHERE manager_user_id = ? AND manager_status = 'Pending'
      `;
      pendingParams = [Number(req.user.id)];
    } else if (req.user.role === "CTO") {
      pendingQuery = `
        SELECT COUNT(*) AS pending_my_approval
        FROM manpower_requests
        WHERE cto_user_id = ?
          AND manager_status = 'Approved'
          AND cto_status = 'Pending'
      `;
      pendingParams = [Number(req.user.id)];
    } else if (req.user.role === "HR") {
      pendingQuery = `
        SELECT COUNT(*) AS pending_my_approval
        FROM manpower_requests
        WHERE hr_user_id = ?
          AND manager_status = 'Approved'
          AND cto_status = 'Approved'
          AND hr_status = 'Pending'
      `;
      pendingParams = [Number(req.user.id)];
    } else if (req.user.role === "Recruiter") {
      pendingQuery = `
        SELECT COUNT(*) AS pending_my_approval
        FROM manpower_requests
        WHERE recruiter_user_id = ?
          AND manager_status = 'Approved'
          AND cto_status = 'Approved'
          AND hr_status = 'Approved'
          AND recruiter_status IN ('Pending','Received','In Progress')
      `;
      pendingParams = [Number(req.user.id)];
    } else if (req.user.role === "Requester") {
      pendingQuery = `
        SELECT COUNT(*) AS pending_my_approval
        FROM manpower_requests
        WHERE requester_user_id = ?
          AND final_status = 'Submitted'
      `;
      pendingParams = [Number(req.user.id)];
    }

    const [[pendingRow]] = await pool.query(pendingQuery, pendingParams);

    let approvedQuery = `SELECT COUNT(*) AS approved_flow FROM manpower_requests WHERE final_status IN ('Manager Approved','CTO Approved','HR Approved','Recruiter Received','Recruitment In Progress','Closed')`;
    let approvedParams = [];

    if (req.user.role === "Requester") {
      approvedQuery += ` AND requester_user_id = ?`;
      approvedParams = [Number(req.user.id)];
    } else if (req.user.role === "Manager") {
      approvedQuery += ` AND manager_user_id = ?`;
      approvedParams = [Number(req.user.id)];
    } else if (req.user.role === "CTO") {
      approvedQuery += ` AND cto_user_id = ?`;
      approvedParams = [Number(req.user.id)];
    } else if (req.user.role === "HR") {
      approvedQuery += ` AND hr_user_id = ?`;
      approvedParams = [Number(req.user.id)];
    } else if (req.user.role === "Recruiter") {
      approvedQuery += ` AND recruiter_user_id = ?`;
      approvedParams = [Number(req.user.id)];
    }

    const [[approvedRow]] = await pool.query(approvedQuery, approvedParams);

    let rejectedQuery = `SELECT COUNT(*) AS rejected FROM manpower_requests WHERE final_status IN ('Manager Rejected','CTO Rejected','HR Rejected')`;
    let rejectedParams = [];

    if (req.user.role === "Requester") {
      rejectedQuery += ` AND requester_user_id = ?`;
      rejectedParams = [Number(req.user.id)];
    } else if (req.user.role === "Manager") {
      rejectedQuery += ` AND manager_user_id = ?`;
      rejectedParams = [Number(req.user.id)];
    } else if (req.user.role === "CTO") {
      rejectedQuery += ` AND cto_user_id = ?`;
      rejectedParams = [Number(req.user.id)];
    } else if (req.user.role === "HR") {
      rejectedQuery += ` AND hr_user_id = ?`;
      rejectedParams = [Number(req.user.id)];
    }

    const [[rejectedRow]] = await pool.query(rejectedQuery, rejectedParams);

    let recruitmentQuery = `SELECT COUNT(*) AS recruitment FROM manpower_requests WHERE recruiter_status IN ('Received','In Progress')`;
    let recruitmentParams = [];

    if (req.user.role === "Requester") {
      recruitmentQuery += ` AND requester_user_id = ?`;
      recruitmentParams = [Number(req.user.id)];
    } else if (req.user.role === "Recruiter") {
      recruitmentQuery += ` AND recruiter_user_id = ?`;
      recruitmentParams = [Number(req.user.id)];
    }

    const [[recruitmentRow]] = await pool.query(recruitmentQuery, recruitmentParams);

    let closedQuery = `SELECT COUNT(*) AS closed FROM manpower_requests WHERE recruiter_status = 'Closed'`;
    let closedParams = [];

    if (req.user.role === "Requester") {
      closedQuery += ` AND requester_user_id = ?`;
      closedParams = [Number(req.user.id)];
    } else if (req.user.role === "Recruiter") {
      closedQuery += ` AND recruiter_user_id = ?`;
      closedParams = [Number(req.user.id)];
    }

    const [[closedRow]] = await pool.query(closedQuery, closedParams);

    res.json({
      total: Number(totalRow?.total || 0),
      pending_my_approval: Number(pendingRow?.pending_my_approval || 0),
      approved_flow: Number(approvedRow?.approved_flow || 0),
      rejected: Number(rejectedRow?.rejected || 0),
      recruitment: Number(recruitmentRow?.recruitment || 0),
      closed: Number(closedRow?.closed || 0),
    });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ message: "Failed to load summary", error: error.message });
  }
});

/* REQUEST LIST */

app.get("/api/requests", authMiddleware, async (req, res) => {
  try {
    const { search = "", status = "", department = "" } = req.query;

    const params = [];
    const clauses = [];

    const visibility = getPortalVisibilityClause(req.user, params);
    if (visibility) clauses.push(visibility);

    if (search) {
      clauses.push(
        `(mr.request_number LIKE ? OR mr.employee_emp_id LIKE ? OR mr.employee_name LIKE ? OR mr.designation LIKE ?)`
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      clauses.push("mr.final_status = ?");
      params.push(status);
    }

    if (department) {
      clauses.push("mr.department LIKE ?");
      params.push(`%${department}%`);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT
         mr.id,
         mr.request_number,
         mr.employee_emp_id,
         mr.employee_name,
         mr.zone,
         mr.branch,
         mr.request_type,
         mr.department,
         mr.designation,
         mr.status_label,
         mr.manager_status,
         mr.cto_status,
         mr.hr_status,
         mr.recruiter_status,
         mr.final_status,
         mr.created_at,
         mr.manager_user_id,
         mr.cto_user_id,
         mr.hr_user_id,
         mr.recruiter_user_id
       FROM manpower_requests mr
       ${whereClause}
       ORDER BY mr.id DESC`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ message: "Failed to load requests", error: error.message });
  }
});

/* REQUEST DETAIL */

app.get("/api/requests/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM manpower_requests WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = rows[0];
    const currentUserId = Number(req.user.id);

    if (req.user.role === "Requester" && Number(request.requester_user_id) !== currentUserId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "Manager" && Number(request.manager_user_id) !== currentUserId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "CTO" && Number(request.cto_user_id) !== currentUserId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "HR" && Number(request.hr_user_id) !== currentUserId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "Recruiter" && Number(request.recruiter_user_id) !== currentUserId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [logs] = await pool.query(
      `SELECT * FROM manpower_logs WHERE request_id = ? ORDER BY id DESC`,
      [Number(req.params.id)]
    );

    res.json({ request, logs });
  } catch (error) {
    console.error("Request detail error:", error);
    res.status(500).json({ message: "Failed to load request detail", error: error.message });
  }
});

/* CREATE REQUEST - AUTO HIERARCHY */

app.post("/api/requests", authMiddleware, allowRoles("Requester", "Admin"), async (req, res) => {
  try {
    const data = req.body;

    if (
      !data.employee_user_id ||
      !data.zone ||
      !data.branch ||
      !data.request_type ||
      !data.department ||
      !data.designation
    ) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    if (
      data.request_type === "Replacement" &&
      (!data.replaced_emp_id || !data.replaced_emp_name)
    ) {
      return res.status(400).json({ message: "Replacement employee ID and name are required" });
    }

    const [employeeRows] = await pool.query(
      `SELECT id, emp_id, full_name, team_id FROM users WHERE id = ?`,
      [Number(data.employee_user_id)]
    );

    if (!employeeRows.length) {
      return res.status(400).json({ message: "Selected employee not found" });
    }

    const employee = employeeRows[0];

    const [managerRows] = await pool.query(
      `SELECT id FROM users WHERE role = 'Manager' AND team_id = ? AND is_active = 1 LIMIT 1`,
      [employee.team_id]
    );

    const [ctoRows] = await pool.query(
      `SELECT id FROM users WHERE role = 'CTO' AND is_active = 1 LIMIT 1`
    );

    const [hrRows] = await pool.query(
      `SELECT id FROM users WHERE role = 'HR' AND is_active = 1 LIMIT 1`
    );

    const [recruiterRows] = await pool.query(
      `SELECT id FROM users WHERE role = 'Recruiter' AND is_active = 1 LIMIT 1`
    );

    if (!managerRows.length) {
      return res.status(400).json({ message: "No Manager found for employee team" });
    }

    if (!ctoRows.length || !hrRows.length || !recruiterRows.length) {
      return res.status(400).json({ message: "CTO / HR / Recruiter hierarchy is not configured" });
    }

    const requestNumber = generateRequestNumber();

    const [result] = await pool.query(
      `INSERT INTO manpower_requests (
        request_number,
        employee_user_id,
        employee_emp_id,
        employee_name,
        zone,
        branch,
        request_type,
        department,
        designation,
        status_label,
        reporting_manager,
        openings,
        experience_required,
        salary_range,
        key_skills,
        preferred_education,
        additional_skills,
        replaced_emp_id,
        replaced_emp_name,
        reason_for_requirement,
        priority_level,
        required_joining_date,
        requester_user_id,
        requester_team_id,
        manager_user_id,
        cto_user_id,
        hr_user_id,
        recruiter_user_id,
        manager_status,
        cto_status,
        hr_status,
        recruiter_status,
        final_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending', 'Pending', 'Pending', 'Submitted')`,
      [
        requestNumber,
        Number(employee.id),
        employee.emp_id,
        employee.full_name,
        data.zone,
        data.branch,
        data.request_type,
        data.department,
        data.designation,
        "Submitted",
        data.reporting_manager || "",
        Number(data.openings || 1),
        data.experience_required || "",
        Number(data.salary_range || 0),
        data.key_skills || "",
        data.preferred_education || "",
        data.additional_skills || "",
        data.replaced_emp_id || null,
        data.replaced_emp_name || null,
        data.reason_for_requirement || "",
        data.priority_level || "Medium",
        data.required_joining_date || null,
        Number(req.user.id),
        req.user.team_id || null,
        Number(managerRows[0].id),
        Number(ctoRows[0].id),
        Number(hrRows[0].id),
        Number(recruiterRows[0].id),
      ]
    );

    await addLog(result.insertId, "Requester", "Submitted", req.user, "Request created");

    res.status(201).json({
      success: true,
      message: "Request created successfully",
      id: result.insertId,
      request_number: requestNumber,
    });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ message: "Failed to create request", error: error.message });
  }
});

/* MANAGER ACTION */

app.put("/api/requests/:id/manager-action", authMiddleware, allowRoles("Manager", "Admin"), async (req, res) => {
  try {
    const { action, comments = "" } = req.body;

    if (!["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (action === "Rejected" && !comments.trim()) {
      return res.status(400).json({ message: "Comments required for rejection" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM manpower_requests WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = rows[0];

    if (req.user.role === "Manager" && Number(request.manager_user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (request.manager_status !== "Pending") {
      return res.status(400).json({ message: "Manager action already completed" });
    }

    const finalStatus = action === "Approved" ? "Manager Approved" : "Manager Rejected";

    await pool.query(
      `UPDATE manpower_requests
       SET manager_status = ?,
           manager_comments = ?,
           manager_approved_at = NOW(),
           status_label = ?,
           final_status = ?
       WHERE id = ?`,
      [action, comments, finalStatus, finalStatus, Number(req.params.id)]
    );

    await addLog(Number(req.params.id), "Manager", action, req.user, comments);
    res.json({ success: true, message: "Manager action updated" });
  } catch (error) {
    console.error("Manager action error:", error);
    res.status(500).json({ message: "Manager action failed", error: error.message });
  }
});

/* CTO ACTION */

app.put("/api/requests/:id/cto-action", authMiddleware, allowRoles("CTO", "Admin"), async (req, res) => {
  try {
    const { action, comments = "" } = req.body;

    if (!["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (action === "Rejected" && !comments.trim()) {
      return res.status(400).json({ message: "Comments required for rejection" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM manpower_requests WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = rows[0];

    if (req.user.role === "CTO" && Number(request.cto_user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (request.manager_status !== "Approved") {
      return res.status(400).json({ message: "Manager approval required first" });
    }

    if (request.cto_status !== "Pending") {
      return res.status(400).json({ message: "CTO action already completed" });
    }

    const finalStatus = action === "Approved" ? "CTO Approved" : "CTO Rejected";

    await pool.query(
      `UPDATE manpower_requests
       SET cto_status = ?,
           cto_comments = ?,
           cto_approved_at = NOW(),
           status_label = ?,
           final_status = ?
       WHERE id = ?`,
      [action, comments, finalStatus, finalStatus, Number(req.params.id)]
    );

    await addLog(Number(req.params.id), "CTO", action, req.user, comments);
    res.json({ success: true, message: "CTO action updated" });
  } catch (error) {
    console.error("CTO action error:", error);
    res.status(500).json({ message: "CTO action failed", error: error.message });
  }
});

/* HR ACTION */

app.put("/api/requests/:id/hr-action", authMiddleware, allowRoles("HR", "Admin"), async (req, res) => {
  try {
    const { action, comments = "" } = req.body;

    if (!["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (!comments.trim()) {
      return res.status(400).json({ message: "HR comments are required" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM manpower_requests WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = rows[0];

    if (req.user.role === "HR" && Number(request.hr_user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (request.manager_status !== "Approved" || request.cto_status !== "Approved") {
      return res.status(400).json({ message: "Manager and CTO approval required first" });
    }

    if (request.hr_status !== "Pending") {
      return res.status(400).json({ message: "HR action already completed" });
    }

    const finalStatus = action === "Approved" ? "HR Approved" : "HR Rejected";

    await pool.query(
      `UPDATE manpower_requests
       SET hr_status = ?,
           hr_comments = ?,
           hr_approved_at = NOW(),
           status_label = ?,
           final_status = ?
       WHERE id = ?`,
      [action, comments, finalStatus, finalStatus, Number(req.params.id)]
    );

    await addLog(Number(req.params.id), "HR", action, req.user, comments);
    res.json({ success: true, message: "HR action updated" });
  } catch (error) {
    console.error("HR action error:", error);
    res.status(500).json({ message: "HR action failed", error: error.message });
  }
});

/* RECRUITER ACTION */

app.put("/api/requests/:id/recruiter-action", authMiddleware, allowRoles("Recruiter", "Admin"), async (req, res) => {
  try {
    const { action, comments = "" } = req.body;

    if (!["Received", "In Progress", "Closed"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM manpower_requests WHERE id = ?`,
      [Number(req.params.id)]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = rows[0];

    if (req.user.role === "Recruiter" && Number(request.recruiter_user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      request.manager_status !== "Approved" ||
      request.cto_status !== "Approved" ||
      request.hr_status !== "Approved"
    ) {
      return res.status(400).json({ message: "Manager, CTO and HR approval required first" });
    }

    let finalStatus = "Recruiter Received";
    if (action === "In Progress") finalStatus = "Recruitment In Progress";
    if (action === "Closed") finalStatus = "Closed";

    await pool.query(
      `UPDATE manpower_requests
       SET recruiter_status = ?,
           recruiter_comments = ?,
           recruiter_updated_at = NOW(),
           status_label = ?,
           final_status = ?
       WHERE id = ?`,
      [action, comments, finalStatus, finalStatus, Number(req.params.id)]
    );

    await addLog(Number(req.params.id), "Recruiter", action, req.user, comments);
    res.json({ success: true, message: "Recruiter action updated" });
  } catch (error) {
    console.error("Recruiter action error:", error);
    res.status(500).json({ message: "Recruiter action failed", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});