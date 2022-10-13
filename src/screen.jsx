/* screen.jsx -- This file is part of VStation.
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
                {props.machines.machines.map(name => <li key={name}><button className='button-link' onClick={() => props.selectCallback(name)}>{name}</button></li>)}
            </ul>
        </BaseScreen>
    );
}

const Screen = props => {
    if (props.error)
        return <ErrorScreen error={props.error} />;
    else if (props.machines && !props.machines.selected)
        return <MachineSelectScreen machines={props.machines} selectCallback={props.selectCallback} />;
    else
        return <div id='screen'></div>;
};

export default Screen;
