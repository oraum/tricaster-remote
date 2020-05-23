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
    constructor(public name: string, public index: number | string, public pgm: boolean = false, public prev: boolean = false) {
    }
}

class ME {
    constructor(public name: string, public a: number, public b: number, public c: number, public d: number) {
    }
}


class Controller extends React.Component<{ uri: string }, { inputs: Input[], me: ME[] }> {
    state = {inputs: [], me: []}
    ws: WebSocket = new WebSocket(`ws://${this.props.uri}/v1/change_notifications`)


    componentDidMount() {
        //connect websocket
        this.connectWebsocket();
        // get tally
        this.getTally().then(() =>
            this.getSwitcher());
    }

    componentWillUnmount() {
        this.ws.close();
    }

    connectWebsocket = () => {
        this.ws.onclose = this.connectWebsocket
        this.ws.onopen = () => {
            console.debug("TriCaster WebSocket Opened")
            setInterval(() => {
                this.ws.send('\n')
            }, 15000)
        }
        this.ws.onmessage = (msg) => {
            console.log(msg)
            if (msg.data === "tally\x00") {
                // do tally things
                this.getTally();
            } else if (msg.data === "switcher\x00") {
                //do switcher things
                this.getSwitcher()
            } else if (msg.data === "buffer\x00") {
                // do buffer things
            }
        }

    }

    getTally = async () => {
        let response = await fetch(`http://${this.props.uri}/v1/dictionary?key=tally`)
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

    getSwitcher = async () => {
        let response = await fetch(`http://${this.props.uri}/v1/dictionary?key=switcher`)
        let xml = await response.text()
        console.group('Parse Switcher')
        console.debug('raw: %o', xml)
        let document = new DOMParser().parseFromString(xml, "text/xml");
        console.debug('parsed: %o', document)
        let columns = document.getElementsByTagName('simulated_input');
        let inputs = []
        for (const column of columns) {
            if (column.getAttribute('simulated_input_number')?.startsWith('V')) {
                console.debug(column)
                const a = column.getElementsByTagName('source_a')[0].getAttribute('a') ?? 0;
                const b = column.getElementsByTagName('source_b')[0].getAttribute('b') ?? 0;
                const c = column.getElementsByTagName('source_c')[0].getAttribute('c') ?? 0;
                const d = column.getElementsByTagName('source_d')[0].getAttribute('d') ?? 0;
                console.log(a, b, c, d)
                let me = new ME(column.getAttribute('simulated_input_number') ?? '', +a, +b, +c, +d);
                inputs.push(me)
            }
        }
        console.debug("inputs: %o", inputs)
        this.setState({me: inputs});
        console.groupEnd()
    }

    sendShortcut = (action: string) => {
        fetch(`http://${this.props.uri}:5952/v1/shortcut?${action}`).then(value => console.debug(value))
    }

    render() {
        let me = this.state.me[0] as ME
        return (
            <>
                {me !== undefined ?
                    <><Row label={'ME 1 A'} className="me_a" onAction={this.sendShortcut} actionName="v1_a_row"
                           inputs={this.state.inputs} isButtonActive={input => input.index === me.a}/>
                        <Row label={'ME 1 B'} className="me_b" onAction={this.sendShortcut} actionName="v1_b_row"
                             inputs={this.state.inputs} isButtonActive={input => input.index === me.b}/>
                        <Row label={'ME 1 C'} className="me_c" onAction={this.sendShortcut} actionName="v1_c_row"
                             inputs={this.state.inputs} isButtonActive={input => input.index === me.c}/>
                        <Row label={'ME 1 D'} className="me_d" onAction={this.sendShortcut} actionName="v1_d_row"
                             inputs={this.state.inputs} isButtonActive={input => input.index === me.d}/>
                    </> : null
                }
                <Row label={'Pgm'} className="pgm" onAction={this.sendShortcut} actionName="main_a_row"
                     inputs={this.state.inputs} isButtonActive={input => input.pgm}/>
                <Row label={'Prev'} className="prev" onAction={this.sendShortcut} actionName="main_b_row"
                     inputs={this.state.inputs} isButtonActive={input => input.prev}/>
                <MainButtons onAction={this.sendShortcut}/>
            </>
        );
    }
}

class MainButtons extends React.Component<{ onAction(action: string): void }, {}> {
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

/**
 * Simple Button with onClick Handler, label and active flag
 * @param props
 * @constructor
 */
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
        <ControlButton label={(typeof value.index === 'number') ? value.index + 1 + '' : value.index}
                       active={props.isButtonActive(value)} key={value.name}
                       onClick={() => props.onAction(`name=${props.actionName}&value=${value.index}`)}/>
    )
    return (
        <>
            <div className={props.className}>
                <div className="label">{props.label}</div>
                {
                    buttons
                }
            </div>
        </>
    )
}
