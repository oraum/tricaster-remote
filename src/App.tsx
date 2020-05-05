import React, {MouseEventHandler} from 'react';
import './App.scss'
import {ConnectForm} from "./ConnectForm";
import {NavBar} from "./NavBar";

type AppState = {
    connected: boolean,
    uri?: string
}

class App extends React.Component<{}, AppState> {
    state: AppState = {connected: false}

    render() {
        return (
            <>
                <NavBar/>
                <div className={'modal' + (!this.state.connected ? ' is-active' : '')}>
                    <div className="modal-background"/>
                    <div className="modal-content">
                        <ConnectForm onIPChange={ip => {
                            console.log(ip);
                            this.setState({connected: true, uri: ip})
                            localStorage.setItem('ip', ip)

                        }} ip={localStorage.getItem('ip') ?? undefined}/>
                    </div>
                </div>
                {this.state.uri &&
                <section className="section">
                    <Controller uri={this.state.uri}/>
                </section>
                }
            </>
        );
    }
}

export default App;


class Input {
    constructor(public name: string, public index: number, public pgm: boolean = false, public prev: boolean = false) {
    }
}

class Controller extends React.Component<{ uri: string }, { inputs: Input[] }> {
    state = {inputs: []}
    ws: WebSocket = new WebSocket(`ws://${this.props.uri}:5951/v1/change_notifications`)



    componentDidMount() {
        //connect websocket
        this.connectWebsocket();
        // get tally
        this.getTally();
    }

    componentWillUnmount() {
        this.ws.close();
    }

    connectWebsocket = () => {
        // let url = `ws://${this.props.uri}:5951/v1/change_notifications`;
        // let ws = new WebSocket(url);
        this.ws.onclose = this.connectWebsocket
        this.ws.onopen = () => {
            console.debug("TriCaster WebSocket Opened")
        }
        this.ws.onmessage = (msg)=> {
            if (msg.data === "tally") {
                // do tally things
                this.getTally();
            } else if (msg.data === "switcher") {
                //do switcher things
            } else if (msg.data === "buffer") {
                // do buffer things
            }
        }

    }

    getTally = async () => {
        let response = await fetch(`http://${this.props.uri}:5952/v1/dictionary?key=tally`)
        let xml = await response.text()
        console.group('Parse Tally')
        console.debug('raw: %o', xml)
        let document = new DOMParser().parseFromString(xml, "text/xml");
        console.debug('parsed: %o', document)
        let columns = document.getElementsByTagName('column');
        let inputs = []
        for (const column of columns) {
            if (column.getAttribute('name')?.startsWith('input')) {
                inputs.push(new Input(column.getAttribute('name') ?? '', +(column.getAttribute('index') ?? ''),
                    column.getAttribute('on_pgm') === "true", column.getAttribute('on_prev') === "true"));
            }
        }
        console.debug("inputs: %o", inputs)
        this.setState({inputs: inputs});
        console.groupEnd()
    }

    sendShortcut = (action: string) => {
        fetch(`http://${this.props.uri}:5952/v1/shortcut?${action}`).then(value => console.debug(value))
    }

    render() {
        return (
            <>
                <Row label={'Pgm'} className="pgm" onAction={this.sendShortcut} actionName="main_a_row"
                     inputs={this.state.inputs} isButtonActive={input => input.pgm}/>
                <Row label={'Prev'} className="prev" onAction={this.sendShortcut} actionName="main_b_row"
                     inputs={this.state.inputs} isButtonActive={input => input.prev}/>
                <ControllButtons onAction={this.sendShortcut}/>
            </>
        );
    }
}

class ControllButtons extends React.Component<{ onAction(action: string): void }, {}> {
    render() {
        return (
            <div style={{marginTop: '1em'}}>
                <ControlButton label="AUTO" onClick={() => this.props.onAction('name=main_auto')}/>
                <ControlButton label="TAKE" onClick={() => this.props.onAction('name=main_take')}/>
            </div>
        );
    }
}

function ControlButton(props: { active?: boolean, label: string, onClick?: MouseEventHandler }) {
    let className = "button" + (props.active ? ' is-active' : '');
    return (
        <>
            <button className={className} onClick={props.onClick}>{props.label}</button>
        </>
    )
}

function Row(props: { label: string, className?: string, actionName: string, onAction(action: string): void, inputs: Input[], isButtonActive: (input: Input) => boolean }) {
    let buttons = props.inputs.map(value =>
        <ControlButton label={value.index + 1 + ''} active={props.isButtonActive(value)} key={value.name}
                       onClick={() => props.onAction(`name=${props.actionName}&value=${value.index}`)}/>
    )
    return (
        <>
            <div className={props.className}>
                <div>{props.label}</div>
                {
                    buttons
                }
            </div>
        </>
    )
}
