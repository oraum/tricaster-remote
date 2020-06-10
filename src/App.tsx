import React, {MouseEventHandler} from 'react';
import './App.scss'
import {ConnectedConnectForm as ConnectForm} from "./ConnectForm";
import {NavBar} from "./NavBar";
import {connect} from "react-redux";
import {RootState} from "./reducers";
import {Action, Controller} from "./Controller";

const mapStateToProps = (state: RootState) => ({
    uri: state.app.uri,
    connected: state.app.connected
});

const connector = connect(
    mapStateToProps
)

type AppProps = ReturnType<typeof mapStateToProps>

const App = (props: AppProps) =>
    <>
        <NavBar/>
        <div className={'modal' + (!props.connected ? ' is-active' : '')}>
            <div className="modal-background"/>
            <div className="modal-content">
                <ConnectForm/>
            </div>
        </div>
        {props.connected && props.uri &&
        <section className="section">
            <Controller uri={props.uri}/>
        </section>
        }
    </>;


export default connector(App);







export class MainButtons extends React.Component<{ onAction(action: string): void }, {}> {
    render() {
        return (
            <div style={{marginTop: '1em'}}>
                <ControlButton label="AUTO" onClick={() => this.props.onAction('name=main_auto')}/>
                <ControlButton label="TAKE" onClick={() => this.props.onAction('name=main_take')}/>
                <ControlButton label="DSK1" onClick={() => this.props.onAction('name=main_dsk1_auto')}/>
                <ControlButton label="DSK2" onClick={() => this.props.onAction('name=main_dsk2_auto')}/>
                <ControlButton label="DSK3" onClick={() => this.props.onAction('name=main_dsk3_auto')}/>
                <ControlButton label="DSK4" onClick={() => this.props.onAction('name=main_dsk4_auto')}/>
            </div>
        );
    }
}

type ControllButtonProps = { active?: boolean, label: string, onClick?: MouseEventHandler }

/**
 * Simple Button with onClick Handler, label and active flag
 * @param props
 * @constructor
 */
function ControlButton(props: ControllButtonProps) {
    let className = "button" + (props.active ? ' is-active' : '');
    return (
        <>
            <button className={className} onClick={props.onClick}>{props.label}</button>
        </>
    )
}

export function Row(props: { label: string, className?: string, inputs: Action[] }) {
    let buttons = props.inputs.map(value =>
        <ControlButton label={value.label}
                       active={value.active} key={value.label}
                       onClick={value.action}/>
    )
    return (
        <>
            <div className={props.className}>
                <div className="label">{props.label}</div>
                {buttons}
            </div>
        </>
    )
}

