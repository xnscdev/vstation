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
                {props.machines.machines.map(machine => <li key={machine.name}><button className='button-link' onClick={() => props.selectCallback(machine)}>{machine.name}</button></li>)}
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