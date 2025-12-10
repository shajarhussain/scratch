const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mermaidCode = `
graph TD
    subgraph Client_Side [Client Side]
        Browser[Web Browser]
        subgraph React_App [React Application]
            UI[UI Components]
            Context[Auth Context]
            Axios[Axios Service]
        end
    end

    subgraph Server_Side [Server Side]
        Server[Express Server]
        subgraph Middleware
            AuthMW[Auth Middleware]
            RBAC[Role Check]
        end
        subgraph Controllers
            UC[User logic]
            SC[Schedule logic]
            EC[Eval logic]
        end
    end

    subgraph Database [Data Layer]
        MongoDB[(MongoDB)]
    end

    Browser --> UI
    UI --> Context
    UI --> Axios
    Axios -- JSON/HTTP --> Server
    Server --> AuthMW
    AuthMW --> RBAC
    RBAC --> Controllers
    Controllers -- Mongoose --> MongoDB
`;

const encoded = Buffer.from(mermaidCode).toString('base64');
const url = `https://mermaid.ink/img/${encoded}`;

async function download() {
    const dir = path.resolve(__dirname, '../docs');
    const writer = fs.createWriteStream(path.join(dir, 'architecture_diagram.png'));

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error fetching image');
    }
}

download();
