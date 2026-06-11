

Harvest Haven SACCO Management System is a web-based application designed to simplify the management of SACCO members and their savings. The system provides administrators with tools to register members, manage savings contributions, monitor monthly savings, and view member financial records through a centralized dashboard.

The application helps SACCO organizations maintain accurate savings records while improving transparency and efficiency in member account management.

Features
Authentication & Security
User Registration
Secure Login
OTP Verification
Forgot Password Functionality
Protected Routes
Session Management
Dashboard
Overview of SACCO activities
Quick access to system modules
Savings statistics and summaries
Member Management
Register new members
View member details
Manage member information
Update member records
Savings Management
Add member savings
Track individual savings records
View savings history
Monitor savings growth
Monthly Savings Tracking
Record monthly contributions
Monitor monthly savings trends
Generate monthly summaries
Savings Reports
View savings records
Track member contributions
Review transaction history
Technology Stack
Frontend
React
TypeScript
Vite
Routing
React Router DOM
State Management
Context API (AuthContext)
Styling
CSS / Custom Components
Charts & Analytics
Recharts
HTTP Requests
Axios
Project Structure
src/
├── assets/
├── components/
│   ├── Layout
│   └── ProtectedRoute
│
├── config/
├── context/
│   └── AuthContext
│
├── pages/
│   ├── Login
│   ├── SignupPage
│   ├── DashboardPage
│   ├── AddSavingsPage
│   ├── ManageMembersPage
│   ├── MonthlySavingsPage
│   ├── ViewSavingsPage
│   ├── OtpVerificationPage
│   └── ForgotPassword
│
├── services/
├── types/
└── App.tsx
System Modules
Login Module

Allows registered users to securely access the system.

OTP Verification Module

Provides an additional layer of security during authentication.

Dashboard Module

Displays key SACCO information and navigation links.

Member Management Module

Enables administrators to manage SACCO members.

Savings Module

Allows recording and monitoring of member savings contributions.

Monthly Savings Module

Tracks and analyzes monthly savings performance.

Reports Module

Provides access to member savings records and transaction information.

Installation
Clone the Repository
git clone https://github.com/your-username/harvest-haven-sacco.git
Navigate to the Project
cd harvest-haven-sacco
Install Dependencies
npm install
Start Development Server
npm run dev
Build for Production
npm run build
Authentication Flow
User signs up.
User receives OTP.
User verifies OTP.
User logs in.
AuthContext stores authentication state.
ProtectedRoute restricts unauthorized access.
Authenticated users access dashboard features.
Key Pages
Route	Description
/login	User login
/signup	User registration
/forgot-password	Password recovery
/verify-otp	OTP verification
/dashboard	Main dashboard
/dashboard/ViewSavingsPage	View savings
/dashboard/AddSavingsPage	Add savings
/dashboard/manage-member	Manage members
/dashboard/MonthlySavingsPage	Monthly savings
Future Enhancements
Loan Management
Withdraw Requests
Share Capital Tracking
Financial Reports Export
SMS Notifications
Email Notifications
Mobile Application Integration
Audit Logs
Role-Based Permissions
Author

Kennedy Mutebi
Bachelor of Science in Computer Science
Makerere University

License

This project is intended for SACCO management and educational purposes. It may be modified and extended according to organizational requirements.