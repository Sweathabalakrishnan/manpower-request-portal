📌 Manpower Request Portal (HRD System)

A full-stack Manpower Request Management System built using React, Node.js, Express, and MySQL.
This system handles the complete hiring workflow with hierarchical approvals:

👉 Requester → Manager → CTO → HR → Recruiter

🚀 Features
👤 Role-Based Access
Requester – Create manpower requests
Manager – Approve / Reject requests
CTO – Approve / Reject after Manager
HR – Final approval + candidate selection
Recruiter – Recruitment process handling
📄 Request Workflow
Requester creates request
Manager reviews
CTO reviews
HR approves & adds candidate comments
Recruiter processes hiring
✅ Key Functionalities
🔐 JWT Authentication (secure login)
📊 Dashboard with request counts
🔍 Search & filter requests
📌 Status tracking (real-time)
📝 Comments required on rejection
🎯 Role-based visibility
📜 Activity logs (audit trail)
🎨 Clean UI with status badges
🛠 Tech Stack
Frontend
React.js
CSS
Backend
Node.js
Express.js
Database
MySQL
Auth
JWT (JSON Web Token)
bcrypt (password hashing)


📂 Project Structure
manpower-portal/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── NewRequest.jsx
│   │   │   ├── RequestDetail.jsx
│   │   │   └── Login.jsx
│   │   ├── context/
│   │   ├── api.js
│   │   └── App.js
│
├── backend/
│   ├── server.js
│   ├── db.js
│   └── package.json
│
└── README.md


⚙️ Installation & Setup
🔹 1. Clone Repository
git clone https://github.com/your-username/manpower-portal.git
cd manpower-portal
🔹 2. Backend Setup
cd backend
npm install
Create .env
PORT=5000
JWT_SECRET=your_secret_key
Run server
npm start
🔹 3. Database Setup

Open MySQL and run your SQL script:

CREATE DATABASE hrd_portal;
USE hrd_portal;

👉 Then run your full schema (tables + inserts)

🔹 4. Frontend Setup
cd frontend
npm install
npm start
🔑 Default Login Credentials
Role	Email	Password
Admin	admin@company.com
	123456
Requester	requester@company.com
	123456
Manager	manager@company.com
	123456
CTO	cto@company.com
	123456
HR	hr@company.com
	123456
Recruiter	recruiter@company.com
	123456
🔄 Workflow Logic
Stage	Condition
Manager	Sees own assigned requests
CTO	Only after Manager Approved
HR	Only after CTO Approved
Recruiter	Only after HR Approved
🎯 Status Flow
Submitted
→ Manager Approved / Rejected
→ CTO Approved / Rejected
→ HR Approved / Rejected
→ Recruiter Received → In Progress → Closed
📸 UI Highlights
Dashboard cards (counts)
Status color indicators:
🟢 Approved
🔴 Rejected
🟡 Pending
🔵 In Progress
⚠️ Important Notes
Comments are mandatory for rejection
HR must provide candidate details
Role-based access is strictly enforced
Requests are auto-assigned based on hierarchy
🚀 Future Enhancements
📧 Email notifications
📊 Analytics dashboard
📎 Resume upload
📱 Mobile responsive UI
🔔 Notification system
👨‍💻 Author

Sweatha B
Infonet Comm
