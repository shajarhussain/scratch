const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mermaidCode = `
graph TB
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
        DevPhase --> SubLog[Submit Weekly Log]
        SubLog --> WaitAtt[Expect Attendance]
        WaitAtt --> DevPhase
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
`;

// Simple Base64 encoding
const encoded = Buffer.from(mermaidCode).toString('base64');
const url = `https://mermaid.ink/img/${encoded}`;

console.log('Fetching BPMN diagram from:', url);

async function download() {
    const dir = path.resolve(__dirname, '../docs');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const writer = fs.createWriteStream(path.join(dir, 'bpmn_diagram.png'));

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('Diagram saved to docs/bpmn_diagram.png');
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error fetching image:', error.message);
    }
}

download();
