# FYP Management System
## Software Requirements Specification: Use Case Model

**Date:** December 08, 2025  
**Project:** Final Year Project (FYP) Management System  
**Version:** 1.0

---

## 1. Introduction
The **FYP Management System** is a comprehensive academic platform designed to streamline the lifecycle of final year projects. From group formation to final grading, the system automates workflows, ensures compliance, and facilitates communication between students, faculty, and administration.

This report details the **Use Case Model** of the system, identifying the primary actors, their goals, and the functional interactions within the system.

---

## 2. Actors & Roles

The system is designed for **seven functional roles**, categorized by their privileges:

| Actor | Description | Key Responsibilities |
| :--- | :--- | :--- |
| **Student** | Final year undergraduate user. | Form groups, submit proposals, log weekly progress, view schedules. |
| **Supervisor** | Faculty member mentoring groups. | Approve groups, review proposals, mark attendance (weekly logs). |
| **Coordinator** | FYP Committee Head. | Create schedules, assign evaluators, manage conflicts, publish results. |
| **Internal Evaluator** | Faculty assigned to grade defenses. | View assigned groups, grade defenses using rubrics. |
| **External Evaluator** | Industry/Academic expert. | Access Final Viva materials via secure link, grade final projects. |
| **HOD** | Head of Department. | Oversight, view analytics and summary reports. |
| **Admin** | System Administrator. | Manage user accounts, system configuration. |

---

## 3. Use Case Diagram

The following diagram illustrates the interactions between actors and the system's core functional modules.

```mermaid
useCaseDiagram
    left to right direction
    skinparam packageStyle rectangle

    actor "Student" as S
    actor "Supervisor" as Sup
    actor "Coordinator" as C
    actor "Internal Evaluator" as IE
    actor "External Evaluator" as EE
    actor "HOD" as HOD
    actor "Admin" as A

    package "Authentication Module" {
        usecase "Login" as UC1
        usecase "Forgot Password" as UC2
        usecase "Register User" as UC3
    }

    package "Group & Proposal Management" {
        usecase "Create/Join Group" as UC4
        usecase "Request Supervisor" as UC5
        usecase "Submit Proposal" as UC6
        usecase "Review & Approve Proposal" as UC7
    }

    package "Progress & Monitoring" {
        usecase "Submit Weekly Log" as UC8
        usecase "Mark Attendance (Review Log)" as UC9
        usecase "View Analytics Dashboard" as UC10
    }

    package "Evaluation & Scheduling" {
        usecase "Create Defense Schedule" as UC11
        usecase "Assign Panel" as UC12
        usecase "Grade Defense (Rubric)" as UC13
        usecase "View Results" as UC14
    }

    %% Relationships
    S --> UC1
    S --> UC2
    S --> UC4
    S --> UC5
    S --> UC6
    S --> UC8
    S --> UC14

    Sup --> UC1
    Sup --> UC7
    Sup --> UC9
    Sup --> UC13

    C --> UC1
    C --> UC11
    C --> UC12
    C --> UC10

    IE --> UC1
    IE --> UC13

    EE --> UC13 : via Magic Link

    HOD --> UC1
    HOD --> UC10

    A --> UC1
    A --> UC3
```

---

## 4. Detailed Use Case Specifications

### 4.1 Authentication
*   **Login**: All users must authenticate to access their respective dashboards.
*   **Forgot Password**: Users can reset credentials using their unique ID (e.g., Registration Number).

### 4.2 Group & Proposal Management
*   **Create Group**: Students can form groups of 1-3 members. The system automatically assigns a unique Group ID (`FYP-202X-XXX`).
*   **Request Supervisor**: Groups send requests to faculty members. A supervisor can accept or reject requests based on their load.
*   **Submit Proposal**: Once a supervisor is confirmed, the group submits their project proposal (Title, Abstract, PDF).
*   **Review Proposal**: Supervisors review the submission. If rejected, students must revise and resubmit.

### 4.3 Progress Monitoring
*   **Weekly Logs**: Students submit a log of their weekly activities and hours spent.
*   **Mark Attendance**: Supervisors review these logs. Approving a log automatically counts as "Present" for that week's attendance record.

### 4.4 Scheduling & Evaluation
*   **Create Schedule**: The Coordinator sets up events (e.g., Proposal Defense, Mid-Term).
*   **Assign Panel**: The Coordinator assigns an Internal Evaluator (and External for Final Viva) to each scheduled group.
*   **Conflict Detection**: The system warns if a venue or evaluator is double-booked.
*   **Grade Defense**: Evaluators access a digital rubric (sliders for Technical, Presentation, etc.) to grade the group. Scores are automatically calculated.

---

## 5. Conclusion
This Use Case model defines the functional scope of the FYP Management System. It ensures that all stakeholder requirements—from day-to-day progress tracking to the complexity of scheduling defenses—are met with clear, role-based interactions.
