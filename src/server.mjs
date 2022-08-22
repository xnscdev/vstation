import express from 'express';
import expressWs from 'express-ws';
import http from 'http';
import DBus from 'dbus';

const port = 5962;

const bus = DBus.getBus('session');

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
                getMachines(ws, json.id);
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

function getMachines(ws, id) {
    bus.getInterface('com.github.xnscdev.VStation', '/VStation', 'com.github.xnscdev.VStation', (err, iface) => {
        if (err) {
            sendFailure(ws, id, err.toString());
        } else {
            try {
                iface.GetMachines({timeout: 3000}, (err, result) => {
                    if (err) {
                        sendFailure(ws, id, err.toString());
                    } else {
                        sendSuccess(ws, id, {machines: result});
                    }
                });
            } catch (e) {
                sendFailure(ws, id, e.stack);
            }
        }
    });
}
