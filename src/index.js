import React from 'react';
import ReactDOM from 'react-dom/client';
import RFB from '@novnc/novnc/core/rfb';
import WebSocketAsPromised from 'websocket-as-promised';
import TextInput from './textinput';
import './index.css';

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

class VNCScreen extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id='screen'></div>
        );
    }
}

const BaseScreen = props => {
    return (
        <div className='screen-outer'>
            <div className='screen-middle'>
                <div className={`screen-inner ${props.error ? 'screen-error' : 'screen-info'}`}>
                    {props.children}
                </div>
            </div>
        </div>
    );
}

const ErrorScreen = props => {
    return <BaseScreen error={true}>An error occurred: {props.error}</BaseScreen>;
};

const MachineSelectScreen = props => {
    return (
        <BaseScreen error={false}>
            <h2>Select Machine</h2>
            <ul>
                {props.machines.map(name => <li key={name}><a onClick={() => props.selectCallback(name)}>{name}</a></li>)}
            </ul>
        </BaseScreen>
    );
}

const Screen = props => {
    if (props.error)
        return <ErrorScreen error={props.error} />
    else if (props.machines)
        return <MachineSelectScreen machines={props.machines} selectCallback={props.selectCallback} />
    else
        return <VNCScreen />
};

class Client extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            handle: null,
            address: null,
            port: null,
            error: null,
            machines: null
        }
        this.displayMachines = this.displayMachines.bind(this);
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
        if (response.success) {
            const state = {...this.state, machines: response.machines};
            this.setState(state);
        } else {
            const state = {...this.state, error: response.error};
            this.setState(state);
        }
    }

    selectMachine(name) {
        console.log(`Selected machine ${name}`);
        const state = {...this.state, machines: null};
        this.setState(state);
    }

    connect() {
        if (!this.state.address)
            return;
        connectWs(this.state.address, this.state.port ? this.state.port : port).then(() => {
            return socket.sendRequest({request: 'machines'});
        }).then(this.displayMachines);
    }

    render() {
        return (
            <div>
                <Screen
                    error={this.state.error}
                    machines={this.state.machines}
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
