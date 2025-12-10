# FYP Management System - Use Case Diagram

```mermaid
useCaseDiagram
    left to right direction
    
    actor "Student" as S
    actor "Supervisor" as Sup
    actor "Coordinator" as C
    actor "Internal Evaluator" as IE
    actor "External Evaluator" as EE
    actor "HOD" as HOD
    actor "Admin" as A

    package "Authentication" {
        usecase "Login" as UC_Login
        usecase "Register" as UC_Register
        usecase "Forgot Password" as UC_Forgot
        usecase "Reset Password" as UC_Reset
    }

    package "Group & Proposal" {
        usecase "Create/Join Group" as UC_CreateGroup
        usecase "Send Supervisor Request" as UC_ReqSup
        usecase "Accept/Reject Group" as UC_ManageGroup
        usecase "Submit Proposal" as UC_SubProp
        usecase "Review Proposal" as UC_RevProp
    }

    package "Monitoring & Logs" {
        usecase "Submit Weekly Log" as UC_SubLog
        usecase "Review Log & Mark Attendance" as UC_RevLog
        usecase "View Attendance Status" as UC_ViewAtt
        usecase "View Progress Analytics" as UC_ViewProg
    }

    package "Scheduling & Evaluation" {
        usecase "Create Schedule" as UC_Sched
        usecase "Assign Evaluators" as UC_Assign
        usecase "Check Conflicts" as UC_Conflict
        usecase "Evaluate Defense (Rubric)" as UC_Eval
        usecase "View Assigned Schedule" as UC_ViewSched
        usecase "Submit Final Grades" as UC_Grade
    }

    package "System" {
        usecase "Send Notifications" as UC_Notify
    }

    %% Student Relationships
    S --> UC_Login
    S --> UC_Register
    S --> UC_Forgot
    S --> UC_CreateGroup
    S --> UC_ReqSup
    S --> UC_SubProp
    S --> UC_SubLog
    S --> UC_ViewAtt
    S --> UC_ViewSched

    %% Supervisor Relationships
    Sup --> UC_Login
    Sup --> UC_ManageGroup
    Sup --> UC_RevProp
    Sup --> UC_RevLog
    Sup --> UC_Eval
    Sup --> UC_ViewSched

    %% Coordinator Relationships
    C --> UC_Login
    C --> UC_Sched
    C --> UC_Assign
    C --> UC_Conflict
    C --> UC_ViewProg
    C --> UC_Grade

    %% Internal Evaluator Relationships
    IE --> UC_Login
    IE --> UC_ViewSched
    IE --> UC_Eval

    %% External Evaluator Relationships
    EE --> UC_Eval

    %% HOD Relationships
    HOD --> UC_Login
    HOD --> UC_ViewProg

    %% Admin Relationships
    A --> UC_Login
    A --> UC_Register

    %% Includes/Extends
    UC_RevLog ..> UC_ViewAtt : updates
    UC_Assign ..> UC_Notify : triggers
    UC_Sched ..> UC_Conflict : includes
```

## Description of Actors

1.  **Student**: Initiates the project by forming groups, submitting proposals, and logging weekly progress.
2.  **Supervisor**: Mentors the group, approves their formation/proposals, checks weekly logs to mark attendance, and participates in evaluations.
3.  **Coordinator**: The central manager who schedules defenses, assigns evaluators, handles conflicts, and oversees the entire cohort's progress.
4.  **Internal Evaluator**: Faculty members assigned to grade specific defenses (Proposal, Interim, etc.) using a rubric.
5.  **External Evaluator**: Industry experts or external faculty invited specifically for the Final Viva to grade the project.
6.  **HOD (Head of Department)**: Has oversight access to view analytics and progress reports.
7.  **Admin**: Manages user accounts and technical system configuration.

## Key Workflows

*   **Group Formation**: Student -> Create Group -> Request Supervisor -> Supervisor Approves.
*   **Proposal**: Student -> Submit Proposal -> Supervisor Reviews -> Coordinator Approves (optional/final).
*   **Weekly Progress**: Student -> Submit Log -> Supervisor Reviews (Attendance Marked).
*   **Evaluation**: Coordinator -> Create Schedule (Assign Evaluators) -> Evaluators -> Grade Group (Rubric) -> System -> Notify Results.
