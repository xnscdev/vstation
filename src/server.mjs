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
            case 'ping':
                ws.send(JSON.stringify({
                    success: true,
                    received: true
                }));
                break;
            case 'machines':
                getMachines(ws);
                break;
            default:
                sendFailure(ws, `Unknown request ${msg.request}`);
        }
    });
})

function sendFailure(ws, msg) {
    ws.send(JSON.stringify({
        success: false,
        error: msg
    }));
}

function getMachines(ws) {
    bus.getInterface('com.github.xnscdev.VStation', '/VStation', 'com.github.xnscdev.VStation', (err, iface) => {
        if (err) {
            sendFailure(ws, err.toString());
        } else {
            try {
                iface.GetMachines({timeout: 3000}, (err, result) => {
                    if (err) {
                        sendFailure(ws, err.toString());
                    } else {
                        console.log(result);
                        ws.send(JSON.stringify({
                            success: true,
                            machines: result
                        }));
                    }
                });
            } catch (e) {
                ws.send(JSON.stringify({
                    success: false,
                    error: e.stack
                }));
            }
        }
    });
}