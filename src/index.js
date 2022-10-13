/* index.js -- This file is part of VStation.
   Copyright (C) 2022 XNSC

   VStation is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as
   published by the Free Software Foundation, either version 3 of the
   License, or (at your option) any later version.

   VStation is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with VStation. If not, see <https://www.gnu.org/licenses/>. */

import React from 'react';
import ReactDOM from 'react-dom/client';
import WebSocketAsPromised from 'websocket-as-promised';
import TextInput from './textinput';
import FileInput from './fileinput';
import Screen from './screen';
import RFB from "@novnc/novnc/core/rfb";
import {ToastContainer, toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const port = 5962;
let socket;

async function connectWs(address, port) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${address}:${port}/`;
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
            machineSelect: null,
	    fxfEnabled: false
        }
        this.displayMachines = this.displayMachines.bind(this);
        this.openVNC = this.openVNC.bind(this);
        this.checkStart = this.checkStart.bind(this);
	this.finishUpload = this.finishUpload.bind(this);
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
                    handle: this.createVNCHandle(address, port),
		    fxfEnabled: response.fxf
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
        if (this.state.handle)
            this.state.handle.disconnect();
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
	handle.scaleViewport = true;
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

    uploadFile(file) {
        if (!this.state.vncAddress)
            return;
	if (file.size > 0x8000000) {
	    toast.error('File exceeds maximum allowed size of 128 MiB');
	    return;
	}
        const reader = new FileReader();
        reader.onload = () => socket.sendRequest({request: 'upload', name: this.state.machineSelect.selected, contents: reader.result, filename: file.name}).then(this.finishUpload);
	reader.readAsBinaryString(file);
    }

    finishUpload(response) {
	return new Promise((resolve, reject) => {
	    if (response.success) {
		toast.success(`File successfully uploaded as ${response.filename} in the FXF drive`);
		resolve();
	    } else {
		toast.error(response.error);
		reject();
	    }
	});
    }

    render() {
        return (
            <div>
		<div>
                    <Screen
			error={this.state.error}
			machines={this.state.machineSelect}
			selectCallback={name => this.selectMachine(name)}
                    />
		</div>
                <div id='bottom'>
                    <h2>Manage Connection</h2>
                    Address: <TextInput handler={value => this.handleAddress(value)} />
                    Port: <TextInput number='0,65535' handler={value => this.handlePort(value)} />
                    <button onClick={() => this.connect()}>Connect</button>
                    File transfer: <FileInput handler={files => this.uploadFile(files)} enabled={this.state.fxfEnabled} />
                </div>
		<ToastContainer
		    position='bottom-right'
		    autoClose={4000}
		    hideProgressBar
		    newestOnTop={false}
		    closeOnClick
		    rtl={false}
		    pauseOnFocusLoss
		    draggable
		    pauseOnHover
		    theme='light'
		/>
            </div>
        );
    }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Client />);
