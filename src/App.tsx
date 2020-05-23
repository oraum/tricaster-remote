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


class Action {
    constructor(public tally: Tally, public active: boolean = false, public action: () => void) {
    }
}

class Tally {
    constructor(public name: string, public index: number,) {
    }
}

class ME {
    constructor(public name: string, public a: SwitchRow, public b: SwitchRow, public c: SwitchRow, public d: SwitchRow) {
    }
}

class SwitchRow {
    constructor(public inputs: Action[], public label: string) {
    }
}

type ControllerState = {
    inputs: Tally[],
    me: ME[],
    pgm: SwitchRow,
    prev: SwitchRow
}


class Controller extends React.Component<{ uri: string }, ControllerState> {
    state: ControllerState = {inputs: [], me: [], pgm: new SwitchRow([], 'Pgm'), prev: new SwitchRow([], 'Prev')}
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
        const pgmInputs = []
        const prevInputs = []
        for (const column of columns) {
            if (column.getAttribute('name')?.startsWith('input')) {
                const tally = new Tally(column.getAttribute('name') ?? '', +(column.getAttribute('index') ?? ''));
                inputs.push(tally);
                pgmInputs.push(new Action(tally, column.getAttribute('on_pgm') === "true", () => this.sendShortcut(`name=main_a_row&value=${tally.index}`)));
                prevInputs.push(new Action(tally, column.getAttribute('on_prev') === "true", () => this.sendShortcut(`name=main_b_row&value=${tally.index}`)));
            }
        }
        console.debug("inputs: %o", inputs)
        console.debug("pgm: %o", pgmInputs)
        console.debug("prev: %o", prevInputs)
        this.setState({
            inputs: inputs,
            prev: {...this.state.prev, inputs: prevInputs},
            pgm: {...this.state.pgm, inputs: pgmInputs}
        });
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
                const indexA = column.getElementsByTagName('source_a')[0].getAttribute('a') ?? 0;
                const indexB = column.getElementsByTagName('source_b')[0].getAttribute('b') ?? 0;
                const indexC = column.getElementsByTagName('source_c')[0].getAttribute('c') ?? 0;
                const indexD = column.getElementsByTagName('source_d')[0].getAttribute('d') ?? 0;
                const a = new SwitchRow(this.state.inputs.map((value, index) => new Action(value, index === +indexA, () => this.sendShortcut(`name=v1_a_row&value=${value.index}`))), 'A')
                const b = new SwitchRow(this.state.inputs.map((value, index) => new Action(value, index === +indexB, () => this.sendShortcut(`name=v1_b_row&value=${value.index}`))), 'B')
                const c = new SwitchRow(this.state.inputs.map((value, index) => new Action(value, index === +indexC, () => this.sendShortcut(`name=v1_c_row&value=${value.index}`))), 'C')
                const d = new SwitchRow(this.state.inputs.map((value, index) => new Action(value, index === +indexD, () => this.sendShortcut(`name=v1_d_row&value=${value.index}`))), 'D')
                console.debug(a, b, c, d)
                let me = new ME(column.getAttribute('simulated_input_number') ?? '', a, b, c, d);
                inputs.push(me)
            }
        }
        console.debug("inputs: %o", inputs)
        this.setState({me: inputs});
        console.groupEnd()
    }

    sendShortcut = (action: string) => {
        fetch(`http://${this.props.uri}/v1/shortcut?${action}`).then(value => console.debug(value))
    }

    render() {
        let me = this.state.me[0] as ME
        return (
            <>
                <MESwitch/>
                {me !== undefined ?
                    <><Row label={'A'} className="me_a"
                           inputs={me.a.inputs}/>
                        <Row label={'B'} className="me_b"
                             inputs={me.b.inputs}/>
                        <Row label={'C'} className="me_c"
                             inputs={me.c.inputs}/>
                        <Row label={'D'} className="me_d"
                             inputs={me.d.inputs}/>
                    </> : null
                }
                <Row label={'Pgm'} className="pgm"
                     inputs={this.state.pgm.inputs}/>
                <Row label={'Prev'} className="prev"
                     inputs={this.state.prev.inputs}/>
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

function Row(props: { label: string, className?: string, inputs: Action[], actionName?: string }) {
    let buttons = props.inputs.map(value =>
        <ControlButton label={value.tally.index + 1 + ''}
                       active={value.active} key={value.tally.name}
                       onClick={() => value.action()}/>
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

function MESwitch() {
    return (
        <>
            <div className="buttons has-addons">
                <button className="button">ME 1</button>
                <button className="button">ME 2</button>
                <button className="button">ME 3</button>
                <button className="button">ME 4</button>
            </div>
        </>
    )
}
