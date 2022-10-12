import React from 'react';

export default class FileInput extends React.Component {
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
