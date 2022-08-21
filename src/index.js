import React from 'react';
import ReactDOM from 'react-dom/client';
import RFB from '@novnc/novnc/core/rfb';
import './index.css';

const port = 5962;
let socket;

function connectWs(address, port) {
    return new Promise((resolve, reject) => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${address}:${port}/ws/`;
        socket = new WebSocket(url);

        socket.onopen = () => {
            socket.send(JSON.stringify({request: 'ping'}));
        }

        socket.onmessage = data => {
            let json = JSON.parse(data.data);
            console.log(json);
            resolve();
        }

        socket.onerror = e => {
            console.log(e);
            reject();
        }
    });
}

class TextInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ''
        };
    }

    handleChange(e) {
        this.props.handler(e.target.value);
        this.setState({value: e.target.value});
    }

    render() {
        let number = this.props.number;
        let input = {};
        if (number) {
            let arr = number.split(',');
            input = {min: arr[0], max: arr[1]};
        }
        return (
            <input
                type={this.props.number ? 'number' : 'text'}
                className='space-right' value={this.state.value}
                onChange={e => this.handleChange(e)}
                {...input}
            />
        );
    }
}

class Client extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            handle: null,
            address: null,
            port: null
        }
    }

    handleAddress(value) {
        const state = {...this.state, address: value};
        this.setState(state);
    }

    handlePort(value) {
        const state = {...this.state, port: value};
        this.setState(state);
    }

    connect() {
        if (!this.state.address)
            return;
        connectWs(this.state.address, this.state.port ? this.state.port : port).then(() => {
            socket.send(JSON.stringify({request: 'machines'}));
        });
    }

    render() {
        return (
            <div>
                <div id='screen'></div>
                <div id='bottom'>
                    <h3>Manage Connection</h3>
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
