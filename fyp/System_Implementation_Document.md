# FYP Management System - Technical Implementation Document

## 1. System Overview & Architecture
The FYP (Final Year Project) Management System is a comprehensive web-based platform designed to streamline the lifecycle of academic projects. It follows a **Monolithic Client-Server Architecture** using the **MERN Stack**:
- **Frontend**: React.js (Vite) with Tailwind CSS for styling.
- **Backend**: Node.js with Express.js framework.
- **Database**: MongoDB (NoSQL) using Mongoose ODM.
- **API**: RESTful API communicating via JSON.

---

## 2. Authentication & Security Module
**Implementation Details:**
- **JWT (JSON Web Tokens)**: Used for stateless authentication. Upon login, the server issues a token signed with a secret key, which the client stores in `localStorage`.
- **Middleware (`authMiddleware.js`)**:
  - `protect`: Verifies the JWT token on every protected request.
  - `authorize(...roles)`: Checks if the authenticated user has the required permission level (Student, Supervisor, Coordinator, etc.).
- **Password Security**: Passwords are hashed using `bcryptjs` before storage.
- **Magic Links (External Evaluators)**:
  - Uses `crypto` to generate secure, random tokens.
  - Stored in `ExternalToken` collection with an expiration date.
  - Allows authentication without a traditional account password for external guests.

---

## 3. Database Schema Design (Key Models)

### 3.1 User & Groups
- **User**: Stores profile, role (Student, Supervisor, Coordinator, Admin, External), and credentials.
- **Group**: Connects `students` (Array of User IDs) and `supervisor` (User ID). Contains the `status` of the group formation and `proposal` data.

### 3.2 Scheduling Engine (`scheduleModel.js`)
The core of the system's logic. A Schedule represents any event (Viva, Proposal, Deadline).
- **Fields**: `eventType`, `eventDate`, `startTime`, `endTime`, `venue`, `group` (ref), `panel` (internal/external evaluators).
- **Deliverables**: Embedded objects for `srsDeliverable` (status, fileUrl, comments) and `artifacts` (Array of uploads like Code, PPT).
- **Logic**:
  - **Conflict Detection**: Before saving, the system checks for overlapping times for the same Venue or Panel Members.
  - **Status**: Scheduled, Completed, Cancelled.

### 3.3 Evaluations (`evaluationModel.js`)
Stores the actual grades and feedback.
- **Structure**: One document per `Schedule`.
- **Evaluators Array**: Contains individual objects for each evaluator's feedback:
  - `evaluator`: User ID.
  - `scores`: Object (Technical, Implementation, Presentation, etc.).
  - `feedback`: Text comments.
  - `recommendation`: Pass/Fail/Revise.
- **Calculation**: Automatically computes averages upon submission.

---

## 4. Key Functional Modules

### 4.1 Group Formation & Proposal
- **Workflow**: Student creates group -> invites members -> submits proposal -> Supervisor accepts/rejects.
- **Implementation**: Frontend uses `GroupCreation.jsx` to manage state. Backend ensures a student can belongs to only one active group.

### 4.2 Event Scheduling & Management
- **Components**: `Schedules.jsx` (Coordinator view).
- **Features**:
  - **CRUD Operations**: create, update, delete schedules.
  - **Conflict Check**: API endpoint `/api/schedules/check-conflicts` runs MongoDB queries with `$or` conditions to find time overlaps.
  - **Notification Trigger**: Creating/Updating a schedule automatically calls `notificationService` to alert relevant users.

### 4.3 Evaluation Process
- **Internal**: Logged-in evaluators see distinct "My Assignments" view.
- **External**:
  - Accessed via Magic Link (no login required) or specific External Portal.
  - **Two-Phase Fetching**: The `evaluatorController` separates fetching public data vs. protected data to prevent crashes if an internal evaluator is missing.
- **Scoring**: `EvaluationForm.jsx` handles state for rubric sliders/inputs and submits to `/api/evaluator/assignment/:id`.

### 4.4 Deliverables & Artifacts
- **Storage**: Files are uploaded to local server storage (`uploads/` directory) via `multer` middleware.
- **Validation**:
  - **Deadlines**: Backend compares `Date.now()` vs `schedule.eventDate` or `srsUploadStartDate`.
  - **File Types**: Validates extensions (.pdf, .zip, .docx).
- **Flow**: Student Uploads -> Supervisor Reviews (Approve/Request Changes) -> Evaluator Views.

### 4.5 Performance Tracking (Progress Logs)
- **Weekly Logs**: Students submit text/image logs.
- **Supervisor Review**: Supervisors can grade (1-10) and comment on logs.
- **Analytics**: `CoordinatorInsights.jsx` aggregates these logs to show class performance trends.

---

## 5. Frontend Implementation Highlights
- **Role-Based Routing**: `App.jsx` uses wrapper components to check `user.role` and redirect unauthorized access.
- **State Management**: React `Context` (AuthContext) manages the global user session. Local state (`useState`, `useEffect`) handles data fetching for specific pages.
- **UI/UX**:
  - **Tailwind CSS**: Utility-first styling for consistency.
  - **Dynamic Components**: Modals, Alerts, and Tabbed interfaces (e.g., in `EvaluationForm`) improve usability without page reloads.

## 6. Notification System
- **Database Notifications**: `Notification` model stores alerts for in-app display (`NotificationBell.jsx`).
- **Email Service**: `nodemailer` is configured to send transactional emails for:
  - Account creation.
  - Schedule creation/updates.
  - External Evaluator invitations (Magic Links).
  - Feedback submission alerts.

---

## 7. Recent Enhancements
- **Robust Error Handling**: Added detailed try-catch blocks in critical controllers (`evaluatorController`) to prevent "500 Internal Server Errors" on malformed data.
- **Coordinator Visibility**: Relaxed role-checks to allow Coordinators to view Evaluation Forms normally reserved for panelists, enabling managerial oversight.
- **SRS Date Control**: Added explicit "Start Date" configuration for SRS uploads to prevent premature submissions or lockouts.
