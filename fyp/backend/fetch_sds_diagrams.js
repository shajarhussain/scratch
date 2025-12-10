const axios = require('axios');
const fs = require('fs');
const path = require('path');

const downloadImage = async (name, mermaidCode) => {
    const encoded = Buffer.from(mermaidCode).toString('base64');
    const url = `https://mermaid.ink/img/${encoded}`;
    const dest = path.join(__dirname, '../docs', `${name}.png`);

    try {
        console.log(`Downloading ${name}...`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`Saved: ${dest}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download ${name}:`, error.message);
    }
};

const archDiagram = `
graph TD
    User[User Client] -- HTTPS --> Frontend[React Frontend]
    Frontend -- REST API --> Backend[Node/Express Backend]
    Backend -- Auth --> AuthC[Auth Controller]
    Backend -- Logic --> MainC[Main Controllers]
    MainC -- Mongoose --> DB[(MongoDB Database)]
    
    subgraph Frontend Logic
        Context[Auth Context]
        Pages[Dashboard/Forms]
    end
    
    subgraph Backend Logic
        AuthC
        MainC
    end
`;

const classDiagram = `
classDiagram
    class User {
        +String name
        +String email
        +String role
        +login()
    }
    class Group {
        +String groupCode
        +List members
        +submitProposal()
    }
    class Schedule {
        +Date date
        +String eventType
        +assignEvaluator()
    }
    class Evaluation {
        +Number marks
        +Object rubric
        +submitScore()
    }
    
    User "1" --> "1" Group : Member
    User "1" --> "*" Schedule : Evaluator
    Group "1" --> "*" Schedule : Assigned
    Schedule "1" --> "1" Evaluation : Result
`;

const seqDiagram = `
sequenceDiagram
    participant C as Coordinator
    participant S as System
    participant E as Evaluator
    participant D as Database

    C->>S: Create Schedule (Date, Group, Evaluator)
    S->>D: Save Schedule
    S->>E: Send Notification
    E->>S: Login & View Dashboard
    S->>D: Fetch Assignments
    D-->>E: Return Schedule List
    E->>S: Submit Evaluation (Rubric Score)
    S->>D: Update Evaluation & Mark Completed
    S-->>C: Notify Result Available
`;

async function main() {
    const dir = path.resolve(__dirname, '../docs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await downloadImage('sds_architecture', archDiagram);
    await downloadImage('sds_class_diagram', classDiagram);
    await downloadImage('sds_sequence_diagram', seqDiagram);
}

main();
