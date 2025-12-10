const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mermaidCode = `
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
    package "Authentication" {
        usecase "Login" as UC1
        usecase "Forgot Password" as UC2
        usecase "Register User" as UC3
    }
    package "Group & Proposal" {
        usecase "Create Group" as UC4
        usecase "Request Supervisor" as UC5
        usecase "Submit Proposal" as UC6
        usecase "Approve Proposal" as UC7
    }
    package "Monitoring" {
        usecase "Submit Weekly Log" as UC8
        usecase "Review Log" as UC9
        usecase "View Analytics" as UC10
    }
    package "Evaluation" {
        usecase "Create Schedule" as UC11
        usecase "Assign Panel" as UC12
        usecase "Grade Defense" as UC13
        usecase "View Results" as UC14
    }
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
    EE --> UC13
    HOD --> UC1
    HOD --> UC10
    A --> UC1
    A --> UC3
`;

// Simple Base64 encoding
const encoded = Buffer.from(mermaidCode).toString('base64');
const url = `https://mermaid.ink/img/${encoded}`;

console.log('Fetching diagram from:', url);

async function download() {
    const dir = path.resolve(__dirname, '../docs');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const writer = fs.createWriteStream(path.join(dir, 'use_case_diagram.png'));

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('Diagram saved to docs/use_case_diagram.png');
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error fetching image:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

download();
