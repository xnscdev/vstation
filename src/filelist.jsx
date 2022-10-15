/* filelist.jsx -- This file is part of VStation.
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

const FileList = props => {
    if (!props.files)
	return null;
    return (
	<div className='file-list screen-info'>
	    <h3>Index of {props.path === '.' ? '/' : '/' + props.path}</h3>
	    <button className='button-link file-list-close' onClick={props.closeCallback}>Close</button>
	    <ul>
		<li><button className='button-link button-link-2' onClick={() => props.selectCallback('..')}>Parent directory</button></li>
		{props.files.map(name => <li key={name}><button className='button-link' onClick={() => props.selectCallback(name)}>{name}</button></li>)}
	    </ul>
	</div>
    );
}

export default FileList;
