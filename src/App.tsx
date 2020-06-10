import React from 'react';
import './App.scss'
import {ConnectedConnectForm as ConnectForm} from "./ConnectForm";
import {NavBar} from "./NavBar";
import {connect} from "react-redux";
import {RootState} from "./reducers";
import {Controller} from "./Controller";

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
            <Controller/>
        </section>
        }
    </>;


export default connector(App);
