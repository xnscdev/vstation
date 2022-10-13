/* textinput.jsx -- This file is part of VStation.
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
                className='space-right'
                value={this.state.value}
                onChange={e => this.handleChange(e)}
                {...input}
            />
        );
    }
}
