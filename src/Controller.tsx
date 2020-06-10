import React, {MouseEventHandler} from "react";
import {MEControls} from "./MEControls";
import {
    BUTTON_ACTION_EXECUTED,
    ButtonActionExecuted,
    INITIAL_TALLY_LOADED,
    InitialTallyLoaded,
    RootState
} from "./reducers";
import {connect, ConnectedProps} from "react-redux";
import {Row} from "./Row";
import {MainButtons} from "./MainButtons";

export type Action = {
    tally?: Tally,
    label: string
    active: boolean
    action: MouseEventHandler
}

export class Tally {
    constructor(public name: string, public index: number, public onPgm: boolean = false, public onPrev: boolean = false) {
    }
}

export class ME {
    constructor(public name: string, public a: SwitchRow, public b: SwitchRow, public c: SwitchRow, public d: SwitchRow, public dsks: SwitchRow) {
    }
}

class SwitchRow {
    constructor(public inputs: Action[], public label: string) {
    }
}

type ControllerState = {
    me: ME[],
}

const mapStateToProps = (state: RootState) => ({
    uri: state.app.uri,
    inputs: state.controller.tallies?.filter(tally => tally.name.startsWith("input"))
});

const mapDispatch = {
    actionExecuted: (): ButtonActionExecuted => ({type: BUTTON_ACTION_EXECUTED}),
    initialTallyLoaded: (tallies: Tally[]): InitialTallyLoaded => ({type: INITIAL_TALLY_LOADED, tallies: tallies})
}

const connector = connect(
    mapStateToProps,
    mapDispatch
)

type Props = ConnectedProps<typeof connector>

class ControllerComponent extends React.Component<Props, ControllerState> {
    state: ControllerState = {
        me: [],
    }
    ws: WebSocket = new WebSocket(`ws://${this.props.uri}/v1/change_notifications`)


    componentDidMount() {
        //connect websocket
        this.connectWebsocket();
        // get tally
        this.getTally().then((tallies) => {
            this.props.initialTallyLoaded(tallies);
            this.getSwitcher();
        });
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
        let tallies: Tally[] = []
        for (const column of columns) {
            const tally = new Tally(column.getAttribute('name') ?? '',
                +(column.getAttribute('index') ?? ''),
                column.getAttribute('on_pgm') === "true",
                column.getAttribute('on_prev') === "true");
            tallies.push(tally)
        }
        console.groupEnd()
        return tallies
    }

    getSwitcher = async () => {
        let response = await fetch(`http://${this.props.uri}/v1/dictionary?key=switcher`)
        let xml = await response.text()
        console.group('Parse Switcher')
        console.debug('raw: %o', xml)
        let document = new DOMParser().parseFromString(xml, "text/xml");
        console.debug('parsed: %o', document)
        let columns = document.getElementsByTagName('simulated_input');
        let mes = []
        if (this.props.inputs !== undefined) {
            const inputs = this.props.inputs

            for (const column of columns) {
                if (column.getAttribute('simulated_input_number')?.startsWith('V')) {
                    console.debug(column)
                    const name = column.getAttribute('simulated_input_number') ?? ''
                    const activeInputs = this.getActiveInputs(column)
                    const a = new SwitchRow(inputs.map((value, index) => ({
                        tally: value,
                        label: (value.index + 1).toString(),
                        active: index === activeInputs.a,
                        action: () => this.sendShortcut(`name=${name}_a_row&value=${value.index}`)
                    })), 'A')
                    a.inputs.push(...this.createAdditionalActions(name, 'a'))
                    const b = new SwitchRow(inputs.map((value, index) => ({
                        tally: value,
                        label: (value.index + 1).toString(),
                        active: index === activeInputs.b,
                        action: () => this.sendShortcut(`name=${name}_b_row&value=${value.index}`)
                    })), 'B')
                    b.inputs.push(...this.createAdditionalActions(name, 'b'))
                    const c = new SwitchRow(inputs.map((value, index) => ({
                        tally: value,
                        label: (value.index + 1).toString(),
                        active: index === activeInputs.c,
                        action: () => this.sendShortcut(`name=${name}_c_row&value=${value.index}`)
                    })), 'C')
                    c.inputs.push(...this.createAdditionalActions(name, 'c'))
                    const d = new SwitchRow(inputs.map((value, index) => ({
                        tally: value,
                        label: (value.index + 1).toString(),
                        active: index === activeInputs.d,
                        action: () => this.sendShortcut(`name=${name}_d_row&value=${value.index}`)
                    })), 'D')
                    d.inputs.push(...this.createAdditionalActions(name, 'd'))
                    console.debug(a, b, c, d)
                    const dsks = new SwitchRow(this.createDSKActions(name), '')
                    let me = new ME(name, a, b, c, d, dsks);
                    mes.push(me)
                }
            }
        }
        console.debug("inputs: %o", mes)
        this.setState({me: mes});
        console.groupEnd()
    }

    sendShortcut = (action: string) => {
        this.props.actionExecuted()
        fetch(`http://${this.props.uri}/v1/shortcut?${action}`).then(value => console.debug(value))
    }

    render() {
        return (
            <>
                <MEControls me={this.state.me}/>
                <br/>
                {this.props.inputs !== undefined && this.props.uri !== undefined &&
                <MainOuts inputs={this.props.inputs} uri={this.props.uri} sendShortcut={this.sendShortcut}/>
                }
            </>
        );
    }

    private createAdditionalActions(me: string, row: string): Action[] {
        me = me.toLowerCase()
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
            action: () => this.sendShortcut(`name=${me}_${row}_row_named_input&value=${inputValue}`)
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
        name = name.toLowerCase()
        const actions: Action[] = []
        actions.push({label: 'DSK 1', active: false, action: () => this.sendShortcut(`name=${name}_dsk1_auto`)});
        actions.push({label: 'DSK 2', active: false, action: () => this.sendShortcut(`name=${name}_dsk2_auto`)});
        actions.push({label: 'DSK 3', active: false, action: () => this.sendShortcut(`name=${name}_dsk3_auto`)});
        actions.push({label: 'DSK 4', active: false, action: () => this.sendShortcut(`name=${name}_dsk4_auto`)});
        return actions;
    }
}

export const Controller = connector(ControllerComponent)


const MainOuts = (props: { uri: string, inputs: Tally[], sendShortcut: (action: string) => void }) =>
    <>
        {
            props.inputs !== undefined &&
            <>
                <Row label={'Pgm'} className="pgm"
                     inputs={props.inputs.map(input => ({
                         tally: input,
                         label: input.index.toString(),
                         active: input.onPgm,
                         action: () => props.sendShortcut(`name=main_a_row&value=${input.index}`)
                     }))}/>
                <Row label={'Prev'} className="prev"
                     inputs={props.inputs.map(input => ({
                         tally: input,
                         label: input.index.toString(),
                         active: input.onPrev,
                         action: () => props.sendShortcut(`name=main_b_row&value=${input.index}`)
                     }))}/>
                <MainButtons onAction={props.sendShortcut}/>
            </>
        }
    </>
