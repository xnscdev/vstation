import express from 'express';
import expressWs from 'express-ws';
import http from 'http';

const port = 5962;

let app = express();
let server = http.createServer(app).listen(port);
expressWs(app, server);

app.get('/', (req, res) => {
    res.status(200).send('VStation server');
});

app.ws('/ws', async ws => {
    ws.on('message', async msg => {
        let json = JSON.parse(msg);
        console.log(json);
        switch (json.request) {
            case 'ping':
                ws.send(JSON.stringify({received: true}));
                break;
            case 'machines':
                ws.send(JSON.stringify({machines: []}));
                break;
            default:
                ws.send(JSON.stringify({error: `Unknown request ${msg.request}`}));
        }
    });
})