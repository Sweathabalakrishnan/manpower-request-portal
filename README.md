🚀 Manpower Request Portal

A full-stack Manpower Request Management System designed to streamline hiring workflows with role-based approvals.

Built using React, Node.js, Express, and MySQL.

📌 Overview

This system allows organizations to manage manpower requests through a structured approval hierarchy:

Requester → Manager → CTO → HR → Recruiter

Each role has controlled access to view, approve, or process requests.

✨ Features
🔐 Authentication
Secure login using JWT
Role-based access control
📄 Request Management
Create manpower requests
Auto-assign approval hierarchy
Track request status in real-time
✅ Approval Workflow
Manager → CTO → HR sequential approvals
Comments required for rejection
HR adds candidate selection remarks
📊 Dashboard
Request counts (Total, Pending, Approved, Rejected)
Clean UI with status indicators
🔍 Search & Filters
Search by request number, employee, designation
Filter by status and department
📜 Logs
Complete audit trail for each request
🛠 Tech Stack
Layer	Technology
Frontend	React.js, CSS
Backend	Node.js, Express
Database	MySQL
Auth	JWT, bcrypt
📂 Project Structure
manpower-portal/
│
├── backend/
│   ├── server.js
│   ├── db.js
│   └── package.json
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
└── README.md
⚙️ Setup Instructions
1️⃣ Clone Repository
git clone https://github.com/your-username/manpower-portal.git
cd manpower-portal
2️⃣ Backend Setup
cd backend
npm install

Create .env file:

PORT=5000
JWT_SECRET=your_secret_key

Run backend:

npm start
3️⃣ Database Setup

Open MySQL and run:

CREATE DATABASE hrd_portal;
USE hrd_portal;

Then execute your schema (tables + sample data).

4️⃣ Frontend Setup
cd frontend
npm install
npm start
🔑 Default Users
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
🔄 Workflow
Submitted
→ Manager Approval
→ CTO Approval
→ HR Approval
→ Recruitment Process
→ Closed
🎨 Status Indicators
🟡 Submitted
🟢 Approved
🔴 Rejected
🔵 In Progress
⚫ Closed
⚠️ Important Rules
Rejection requires comments
HR must provide candidate remarks
Each role only sees assigned requests
Approval flow is strictly hierarchical
🚀 Future Enhancements
Email notifications 📧
Resume upload 📎
Analytics dashboard 📊
Notification system 🔔
Mobile responsive UI 📱
👨‍💻 DEVELOPED

Sweatha B
Infonet Comm
