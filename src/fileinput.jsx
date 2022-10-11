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
        this.props.handler(this.state.files);
    }

    render() {
        return (
            <span>
                <input
                    type='file'
                    onChange={e => this.handleChange(e)}
                />
                <button className='space-right' onClick={() => this.uploadFile()}>Upload</button>
            </span>
        );
    }
}