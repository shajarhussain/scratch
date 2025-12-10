# FYP Management System - BPMN To-Be Model

This diagram represents the "To-Be" process flow for the FYP Management System, using Swimlanes to define the responsibilities of each actor.

```mermaid
graph TB
    %% BPMN-style representation using Mermaid Flowchart with Subgraphs as Swimlanes

    subgraph Student_Lane [Student]
        direction TB
        Start((Start)) --> Reg[Register & Login]
        Reg --> CreateGrp[Create Group]
        CreateGrp --> ReqSup[Request Supervisor]
        ReqSup --> WaitSup{Supervisor Response}
        
        WaitSup -- Rejected --> ReqSup
        WaitSup -- Approved --> SubProp[Submit Proposal]
        
        SubProp --> WaitProp{Proposal Status}
        WaitProp -- Changes Req --> RevProp[Revise Proposal]
        RevProp --> SubProp
        
        WaitProp -- Approved --> DevPhase[Development Phase]
        
        %% Weekly Loop
        DevPhase --> SubLog[Submit Weekly Log]
        SubLog --> WaitAtt[Expect Attendance]
        WaitAtt --> DevPhase
        
        %% Defense
        DevPhase --> AttendDef[Attend Defense/Viva]
        AttendDef --> ViewRes[View Results]
        ViewRes --> End((End))
    end

    subgraph Supervisor_Lane [Supervisor]
        direction TB
        RecReq[Receive Request] --> DecReq{Accept Group?}
        DecReq -- No --> RejReq[Reject Request]
        DecReq -- Yes --> AppReq[Approve Request]
        
        AppReq --> RevPropSup[Review Proposal]
        RevPropSup --> DecProp{Valid?}
        DecProp -- No --> ReqChange[Request Changes]
        DecProp -- Yes --> AppProp[Approve Proposal]
        
        %% Monitoring
        AppProp --> MonProg[Monitor Progress]
        MonProg --> CheckLog[Check Weekly Log]
        CheckLog --> MarkAtt[Mark Attendance]
        MarkAtt --> MonProg
    end

    subgraph Coordinator_Lane [Coordinator]
        direction TB
        AppProp --> SchedDef[Schedule Defense]
        SchedDef --> AssignEval[Assign Evaluators]
        AssignEval --> PubRes[Publish Results]
    end

    subgraph Evaluator_Lane [Evaluator]
        direction TB
        RecAssign[Receive Assignment] --> EvalDef[Evaluate Defense]
        EvalDef --> SubScore[Submit Rubric Score]
    end

    %% Cross-Lane Connections
    ReqSup -.-> RecReq
    RejReq -.-> WaitSup
    AppReq -.-> WaitSup
    
    SubProp -.-> RevPropSup
    ReqChange -.-> WaitProp
    AppProp -.-> WaitProp
    
    SubLog -.-> CheckLog
    MarkAtt -.-> WaitAtt
    
    SchedDef -.-> RecAssign
    SubScore -.-> PubRes
    PubRes -.-> ViewRes
```

## Process Descriptions

### 1. Initiation Phase
The process begins with the **Student** registering and forming a group. They send a request to a **Supervisor**. The Supervisor can accept or reject this request. If accepted, the group is formalized.

### 2. Proposal Phase
The group submits a project proposal. The **Supervisor** reviews it. If it meets standards, it is approved; otherwise, revisions are requested. Approval triggers the **Coordinator** to eventually schedule the Proposal Defense.

### 3. Execution & Monitoring Phase
This is a recurring loop. Students submit **Weekly Logs**. Supervisors review these logs to track progress and mark **Attendance**. This ensures continuous monitoring throughout the semester.

### 4. Evaluation Phase
The **Coordinator** creates schedules for various evaluations (Proposal, Mid-term, Final). **Evaluators** (Internal/External) are assigned to these schedules. They conduct the defense, grade usage a digital rubric, and submit scores. finally, the Coordinator publishes the results for the Students to view.
