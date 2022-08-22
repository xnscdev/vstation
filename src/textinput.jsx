import React from 'react';

export default class TextInput extends React.Component {
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