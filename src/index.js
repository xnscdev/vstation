import React from 'react';
import ReactDOM from 'react-dom/client';
import WebSocketAsPromised from 'websocket-as-promised';
import TextInput from './textinput';
import Screen from './screen';
import './index.css';
import RFB from "@novnc/novnc/core/rfb";

const port = 5962;
let socket;

async function connectWs(address, port) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${address}:${port}/ws/`;
    socket = new WebSocketAsPromised(url, {
        packMessage: data => JSON.stringify(data),
        unpackMessage: data => JSON.parse(data),
        attachRequestId: (data, id) => Object.assign({id: id}, data),
        extractRequestId: data => data && data.id
    });
    await socket.open();
}

class Client extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            handle: null,
            address: null,
            port: null,
            vncAddress: null,
            vncPort: null,
            error: null,
            machineSelect: null
        }
        this.displayMachines = this.displayMachines.bind(this);
        this.openVNC = this.openVNC.bind(this);
        this.checkStart = this.checkStart.bind(this);
    }

    handleAddress(value) {
        const state = {...this.state, address: value};
        this.setState(state);
    }

    handlePort(value) {
        const state = {...this.state, port: value};
        this.setState(state);
    }

    displayMachines(response) {
        return new Promise((resolve, reject) => {
            if (response.success) {
                const state = {
                    ...this.state,
                    machineSelect: {
                        machines: response.machines,
                        selected: null,
                        resolve: resolve
                    }
                };
                this.setState(state);
            } else {
                const state = {
                    ...this.state,
                    error: response.error,
                    machineSelect: null
                }
                this.setState(state);
                reject();
            }
        });
    }

    selectMachine(name) {
        const machines = this.state.machineSelect.machines;
        const resolve = this.state.machineSelect.resolve;
        const state = {
            ...this.state,
            machineSelect: {
                machines: machines,
                selected: name,
                resolve: null
            }
        };
        this.setState(state);
        resolve();
    }

    checkStart(response) {
        return new Promise((resolve, reject) => {
            if (response.success) {
                resolve();
            } else {
                const state = {
                    ...this.state,
                    error: response.error
                }
                this.setState(state);
                reject();
            }
        });
    }

    openVNC(response) {
        return new Promise((resolve, reject) => {
            if (response.success) {
                const address = this.state.address;
                const port = response.port;
                const state = {
                    ...this.state,
                    vncAddress: address,
                    vncPort: port,
                    handle: this.createVNCHandle(address, port)
                };
                this.setState(state);
                resolve();
            } else {
                const state = {
                    ...this.state,
                    error: response.error,
                    machineSelect: null
                }
                this.setState(state);
                reject();
            }
        });
    }

    createVNCHandle(address, port) {
        if (this.state.handle) {
            this.state.handle.disconnect();
        }
        const url = `ws://${address}:${port}`; // TODO Setup WebSocket proxy to port
        console.log(`VNC URL: ${url}`);
        const handle = new RFB(document.getElementById('screen'), url);
        handle.addEventListener('connect', () => console.log(`Connected to ${url}`));
        handle.addEventListener('disconnect', e => {
            if (e.detail.clean)
                console.log(`Disconnected from ${url}`);
            else
                console.log('Connection closed unexpectedly');
        });
        handle.addEventListener('credentialsrequired', () => {
            const password = prompt('Enter password to connect:');
            handle.sendCredentials({password: password});
        });
        handle.addEventListener('desktopname', e => console.log(e.detail.name));
        return handle;
    }

    connect() {
        if (!this.state.address)
            return;
        connectWs(this.state.address, this.state.port ? this.state.port : port)
            .then(() => socket.sendRequest({request: 'machines'}))
            .then(this.displayMachines)
            .then(() => socket.sendRequest({request: 'start', name: this.state.machineSelect.selected}))
            .then(this.checkStart)
            .then(() => socket.sendRequest({request: 'setup-ws', name: this.state.machineSelect.selected}))
            .then(this.openVNC);
    }

    render() {
        return (
            <div>
                <Screen
                    error={this.state.error}
                    machines={this.state.machineSelect}
                    selectCallback={name => this.selectMachine(name)}
                />
                <div id='bottom'>
                    <h2>Manage Connection</h2>
                    Address: <TextInput handler={value => this.handleAddress(value)} />
                    Port: <TextInput number='0,65535' handler={value => this.handlePort(value)} />
                    <button onClick={() => this.connect()}>Connect</button>
                </div>
            </div>
        );
    }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Client />);
