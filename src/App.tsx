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


type Action = {
    tally?: Tally,
    label: string
    active: boolean
    action: MouseEventHandler
}

class Tally {
    constructor(public name: string, public index: number,) {
    }
}

class ME {
    constructor(public name: string, public a: SwitchRow, public b: SwitchRow, public c: SwitchRow, public d: SwitchRow, public dsks: SwitchRow) {
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
    prev: SwitchRow,
    meSelected: number
}


class Controller extends React.Component<{ uri: string }, ControllerState> {
    state: ControllerState = {
        inputs: [],
        me: [],
        pgm: new SwitchRow([], 'Pgm'),
        prev: new SwitchRow([], 'Prev'),
        meSelected: 0
    }
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
        const pgmInputs: Action[] = []
        const prevInputs = []
        for (const column of columns) {
            if (column.getAttribute('name')?.startsWith('input')) {
                const tally = new Tally(column.getAttribute('name') ?? '', +(column.getAttribute('index') ?? ''));
                inputs.push(tally);
                pgmInputs.push({
                    // tally: tally,
                    label: (tally.index + 1).toString(),
                    active: column.getAttribute('on_pgm') === "true",
                    action: () => this.sendShortcut(`name=main_a_row&value=${tally.index}`)
                });
                prevInputs.push({
                    // tally: tally,
                    label: (tally.index + 1).toString(),
                    active: column.getAttribute('on_prev') === "true",
                    action: () => this.sendShortcut(`name=main_b_row&value=${tally.index}`)
                });
            }
        }
        console.debug("buttons: %o", inputs)
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
                const name = column.getAttribute('simulated_input_number') ?? ''
                const activeInputs = this.getActiveInputs(column)
                const a = new SwitchRow(this.state.inputs.map((value, index) => ({
                    tally: value,
                    label: (value.index + 1).toString(),
                    active: index === activeInputs.a,
                    action: () => this.sendShortcut(`name=${name}_a_row&value=${value.index}`)
                })), 'A')
                a.inputs.push(...this.createAdditionalActions(name, 'a'))
                const b = new SwitchRow(this.state.inputs.map((value, index) => ({
                    tally: value,
                    label: (value.index + 1).toString(),
                    active: index === activeInputs.b,
                    action: () => this.sendShortcut(`name=${name}_b_row&value=${value.index}`)
                })), 'B')
                b.inputs.push(...this.createAdditionalActions(name, 'b'))
                const c = new SwitchRow(this.state.inputs.map((value, index) => ({
                    tally: value,
                    label: (value.index + 1).toString(),
                    active: index === activeInputs.c,
                    action: () => this.sendShortcut(`name=${name}_c_row&value=${value.index}`)
                })), 'C')
                c.inputs.push(...this.createAdditionalActions(name, 'c'))
                const d = new SwitchRow(this.state.inputs.map((value, index) => ({
                    tally: value,
                    label: (value.index + 1).toString(),
                    active: index === activeInputs.d,
                    action: () => this.sendShortcut(`name=${name}_d_row&value=${value.index}`)
                })), 'D')
                d.inputs.push(...this.createAdditionalActions(name, 'd'))
                console.debug(a, b, c, d)
                const dsks = new SwitchRow(this.createDSKActions(name), '')
                let me = new ME(name, a, b, c, d, dsks);
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
        let me = this.state.me[this.state.meSelected] as ME
        return (
            <>
                <MESwitch meSelected={index => this.setState({meSelected: index})}/>
                {me !== undefined ?
                    <><Row label={me.a.label} className="me_a"
                           inputs={me.a.inputs}/>
                        <Row label={me.b.label} className="me_b"
                             inputs={me.b.inputs}/>
                        <Row label={me.c.label} className="me_c"
                             inputs={me.c.inputs}/>
                        <Row label={me.d.label} className="me_d"
                             inputs={me.d.inputs}/>
                        <Row label={me.dsks.label} className="me_dsk"
                             inputs={me.dsks.inputs}/>
                    </> : null
                }
                <br/>
                <Row label={'Pgm'} className="pgm"
                     inputs={this.state.pgm.inputs}/>
                <Row label={'Prev'} className="prev"
                     inputs={this.state.prev.inputs}/>
                <MainButtons onAction={this.sendShortcut}/>
            </>
        );
    }

    private createAdditionalActions(me: string, row: string): Action[] {
        const actions: Action[] = []
        actions.push(this.createAdditionalAction(me, row, 'DDR 1', 'ddr1'))
        actions.push(this.createAdditionalAction(me, row, 'DDR 2', 'ddr2'))
        actions.push(this.createAdditionalAction(me, row, 'GFX 1', 'gfx1'))
        actions.push(this.createAdditionalAction(me, row, 'GFX 2', 'gfx2'))
        actions.push(this.createAdditionalAction(me, row, 'ME 1', 'v1'))
        actions.push(this.createAdditionalAction(me, row, 'ME 2', 'v2'))
        actions.push(this.createAdditionalAction(me, row, 'ME 3', 'v3'))
        actions.push(this.createAdditionalAction(me, row, 'ME 4', 'v4'))
        actions.push(this.createAdditionalAction(me, row, 'Black', 'black'))
        return actions;
    }

    private createAdditionalAction(me: string, row: string, label: string, inputValue: string): Action {
        // FIXME: active
        return {
            label: label,
            active: false,
            action: event => this.sendShortcut(`?name=${me}_${row}_row_named_input&value=${inputValue}`)
        }
    }

    private getActiveInputs(column: Element): { a: number, b: number, c: number, d: number } {
        const indexA = +(column.getElementsByTagName('source_a')[0].getAttribute('a') || 0);
        const indexB = +(column.getElementsByTagName('source_b')[0].getAttribute('b') || 0);
        const indexC = +(column.getElementsByTagName('source_c')[0].getAttribute('c') || 0);
        const indexD = +(column.getElementsByTagName('source_d')[0].getAttribute('d') || 0);
        return {a: indexA, b: indexB, c: indexC, d: indexD}
    }

    private createDSKActions(name: string): Action[] {
        const actions: Action[] = []
        actions.push({label: 'DSK 1', active: false, action: event => this.sendShortcut(`?name=${name}_dsk1_auto`)});
        actions.push({label: 'DSK 2', active: false, action: event => this.sendShortcut(`?name=${name}_dsk2_auto`)});
        actions.push({label: 'DSK 3', active: false, action: event => this.sendShortcut(`?name=${name}_dsk3_auto`)});
        actions.push({label: 'DSK 4', active: false, action: event => this.sendShortcut(`?name=${name}_dsk4_auto`)});
        return actions;
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

function Row(props: { label: string, className?: string, inputs: Action[] }) {
    let buttons = props.inputs.map(value =>
        <ControlButton label={value.label}
                       active={value.active} key={value.label}
                       onClick={value.action}/>
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

function MESwitch(props: { meSelected(index: number): void }) {
    return (
        <>
            <div className="buttons has-addons">
                <button className="button" onClick={() => props.meSelected(0)}>ME 1</button>
                <button className="button" onClick={() => props.meSelected(1)}>ME 2</button>
                <button className="button" onClick={() => props.meSelected(2)}>ME 3</button>
                <button className="button" onClick={() => props.meSelected(3)}>ME 4</button>
            </div>
        </>
    )
}
