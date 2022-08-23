import express from 'express';
import expressWs from 'express-ws';
import http from 'http';
import {sessionBus} from 'dbus-next';

const port = 5962;

const bus = sessionBus();

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
            case 'machines':
                await getMachines(ws, json.id);
                break;
            case 'start':
                await startMachine(ws, json.id, json.name);
                break;
            default:
                sendFailure(ws, json.id, `Unknown request ${msg.request}`);
        }
    });
})

function sendFailure(ws, id, msg) {
    ws.send(JSON.stringify({
        id: id,
        success: false,
        error: msg
    }));
}

function sendSuccess(ws, id, obj) {
    obj = {
        ...obj,
        id: id,
        success: true
    };
    ws.send(JSON.stringify(obj));
}

function formattedError(err) {
    return `${err.type}: ${err.text}`;
}

async function getMachines(ws, id) {
    const obj = await bus.getProxyObject('com.github.xnscdev.VStation', '/VStation');
    const iface = obj.getInterface('com.github.xnscdev.VStation');
    iface.GetMachines().then(result => sendSuccess(ws, id, {machines: result})).catch(err => sendFailure(ws, id, formattedError(err)));
}

async function startMachine(ws, id, name) {
    const obj = await bus.getProxyObject('com.github.xnscdev.VStation', '/VStation');
    const iface = obj.getInterface('com.github.xnscdev.VStation');
    iface.StartMachine(name).then(() => sendSuccess(ws, id, {})).catch(err => sendFailure(ws, id, formattedError(err)));
}