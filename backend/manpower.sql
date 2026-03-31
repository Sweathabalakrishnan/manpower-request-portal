CREATE DATABASE IF NOT EXISTS hrd_portal;
USE hrd_portal;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS manpower_logs;
DROP TABLE IF EXISTS manpower_requests;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS teams;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_name VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    emp_id VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Requester','Manager','CTO','HR','Recruiter','Admin') NOT NULL,
    team_id INT NULL,
    zone VARCHAR(100),
    branch VARCHAR(100),
    department VARCHAR(100),
    designation VARCHAR(150),
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE manpower_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_number VARCHAR(30) NOT NULL UNIQUE,

    employee_user_id INT NOT NULL,
    employee_emp_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(150) NOT NULL,

    zone VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    request_type ENUM('New Openings','Replacement') NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(150) NOT NULL,
    status_label VARCHAR(100) DEFAULT 'Submitted',

    reporting_manager VARCHAR(150),
    openings INT NOT NULL DEFAULT 1,
    experience_required VARCHAR(50),
    salary_range DECIMAL(12,2),
    key_skills TEXT,
    preferred_education VARCHAR(255),
    additional_skills TEXT,
    replaced_emp_id VARCHAR(50),
    replaced_emp_name VARCHAR(150),
    reason_for_requirement TEXT NOT NULL,
    priority_level ENUM('Low','Medium','High','Urgent') DEFAULT 'Medium',
    required_joining_date DATE,

    requester_user_id INT NOT NULL,
    requester_team_id INT NULL,

    manager_user_id INT NULL,
    cto_user_id INT NULL,
    hr_user_id INT NULL,
    recruiter_user_id INT NULL,

    manager_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    manager_comments TEXT,
    manager_approved_at DATETIME NULL,

    cto_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    cto_comments TEXT,
    cto_approved_at DATETIME NULL,

    hr_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    hr_comments TEXT,
    hr_approved_at DATETIME NULL,

    recruiter_status ENUM('Pending','Received','In Progress','Closed') DEFAULT 'Pending',
    recruiter_comments TEXT,
    recruiter_updated_at DATETIME NULL,

    final_status ENUM(
        'Submitted',
        'Manager Approved',
        'Manager Rejected',
        'CTO Approved',
        'CTO Rejected',
        'HR Approved',
        'HR Rejected',
        'Recruiter Received',
        'Recruitment In Progress',
        'Closed'
    ) DEFAULT 'Submitted',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_user_id) REFERENCES users(id),
    FOREIGN KEY (requester_user_id) REFERENCES users(id),
    FOREIGN KEY (requester_team_id) REFERENCES teams(id),
    FOREIGN KEY (manager_user_id) REFERENCES users(id),
    FOREIGN KEY (cto_user_id) REFERENCES users(id),
    FOREIGN KEY (hr_user_id) REFERENCES users(id),
    FOREIGN KEY (recruiter_user_id) REFERENCES users(id)
);

CREATE TABLE manpower_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    stage VARCHAR(50),
    action_taken VARCHAR(50),
    actor_user_id INT,
    actor_name VARCHAR(150),
    actor_emp_id VARCHAR(50),
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES manpower_requests(id) ON DELETE CASCADE
);

INSERT INTO teams (team_name) VALUES
('Branch'),
('CTO Office'),
('HR'),
('Recruitment');

SET @pwd = '$2b$10$Myw.yoStJ50jo/G2vjhepO6NWmBi8sR/Ma.c3CjMzy4nQF9dKBKiS';

INSERT INTO users (emp_id, full_name, email, password, role, team_id, zone, branch, department, designation) VALUES
('EMP001', 'Admin User', 'admin@company.com', @pwd, 'Admin', 1, 'West', 'HQ', 'Admin', 'Administrator'),
('EMP002', 'Requester User', 'requester@company.com', @pwd, 'Requester', 1, 'West', 'Coimbatore', 'IT', 'Executive'),
('EMP003', 'Manager User', 'manager@company.com', @pwd, 'Manager', 1, 'West', 'Coimbatore', 'IT', 'Manager'),
('EMP004', 'CTO User', 'cto@company.com', @pwd, 'CTO', 2, 'Corporate', 'HQ', 'Technology', 'CTO'),
('EMP005', 'HR User', 'hr@company.com', @pwd, 'HR', 3, 'Corporate', 'HQ', 'HR', 'HR Manager'),
('EMP006', 'Recruiter User', 'recruiter@company.com', @pwd, 'Recruiter', 4, 'Corporate', 'HQ', 'Recruitment', 'Recruiter');

INSERT INTO manpower_requests (
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
    reason_for_requirement,
    priority_level,
    requester_user_id,
    requester_team_id,
    manager_user_id,
    cto_user_id,
    hr_user_id,
    recruiter_user_id,
    final_status
) VALUES (
    'MPR-2026-1001',
    2,
    'EMP002',
    'Requester User',
    'West',
    'Coimbatore',
    'New Openings',
    'IT',
    'Network Engineer',
    'Submitted',
    'Manager User',
    2,
    '2-4 Years',
    25000,
    'Need additional manpower for expansion',
    'High',
    2,
    1,
    3,
    4,
    5,
    6,
    'Submitted'
);

SELECT id, full_name, emp_id, role FROM users;

SELECT * FROM users WHERE role='Manager';
SELECT
  id,
  request_number,
  manager_user_id,
  cto_user_id,
  hr_user_id,
  recruiter_user_id,
  manager_status,
  cto_status,
  hr_status
FROM manpower_requests;