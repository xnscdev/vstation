/* fileinput.jsx -- This file is part of VStation.
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

export class FileInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: ''
        };
    }

    handleChange(e) {
        this.setState({files: e.target.files});
    }

    uploadFile() {
	if (this.state.files)
            this.props.handler(this.state.files[0]);
    }

    render() {
	let input = {};
	if (!this.props.enabled)
	    input = {disabled: 'disabled'};
        return (
            <span>
                <input
                    type='file'
                    onChange={e => this.handleChange(e)}
		    {...input}
                />
                <button onClick={() => this.uploadFile()} {...input}>Upload</button>
            </span>
        );
    }
}

export const DownloadButton = props => {
    let input = {};
    if (!props.enabled)
	input = {disabled: 'disabled'};
    return <button onClick={props.handler} {...input}>Download</button>
};
