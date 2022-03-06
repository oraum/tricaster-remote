import React, {MouseEventHandler} from "react";
import {MEControls} from "./MEControls";
import {
    BUTTON_ACTION_EXECUTED,
    ButtonActionExecutedAction,
    MEState,
    RootState,
    SWITCHER_LOADED,
    SwitcherLoadedAction,
    TALLY_LOADED,
    TallyLoadedAction
} from "./reducers";
import {connect, ConnectedProps} from "react-redux";
import {Row} from "./Row";
import {MainButtons} from "./MainButtons";
import {CustomPage} from "./CustomPage";
import Icon from "@mdi/react";
import {mdiPen} from "@mdi/js";

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

const mapStateToProps = (state: RootState) => ({
    uri: state.app.uri,
    inputs: state.controller.tallies?.filter(tally => tally.name.startsWith("input")),
    tallies: state.controller.tallies || [],
    mestates: state.controller.me
});

const mapDispatch = {
    actionExecuted: (): ButtonActionExecutedAction => ({type: BUTTON_ACTION_EXECUTED}),
    tallyLoaded: (tallies: Tally[]): TallyLoadedAction => ({type: TALLY_LOADED, tallies: tallies}),
    switcherLoaded: (mes: MEState[]): SwitcherLoadedAction => ({type: SWITCHER_LOADED, me: mes})
}

const connector = connect(
    mapStateToProps,
    mapDispatch
)

type Props = ConnectedProps<typeof connector>

class ControllerComponent extends React.Component<Props, { page: number, editMode: boolean }> {
    ws: WebSocket = new WebSocket(`ws://${this.props.uri}/v1/change_notifications`)
    state = {page: 0, editMode: false}


    private static getActiveInputs(column: Element): { a: number, b: number, c: number, d: number } {
        const indexA = +(column.getElementsByTagName('source_a')[0].getAttribute('a') || 0);
        const indexB = +(column.getElementsByTagName('source_b')[0].getAttribute('b') || 0);
        const indexC = +(column.getElementsByTagName('source_c')[0].getAttribute('c') || 0);
        const indexD = +(column.getElementsByTagName('source_d')[0].getAttribute('d') || 0);
        return {a: indexA, b: indexB, c: indexC, d: indexD}
    }

    componentWillUnmount() {
        this.ws.close();
    }

    connectWebsocket = () => {
        this.ws.onerror = ev => {
            console.warn(ev)
            if (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED) {
                this.connectWebsocket()
            }
        }
        this.ws.onclose = this.connectWebsocket
        this.ws.onopen = () => {
            console.debug("TriCaster WebSocket Opened")
            setInterval(() => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send('\n')
                } else {
                    clearInterval()
                }
            }, 15000)
        }
        this.ws.onmessage = (msg) => {
            console.log(msg)
            if (msg.data === "tally\x00") {
                // do tally things
                this.getTally().then();
            } else if (msg.data === "switcher\x00") {
                //do switcher things
                this.getSwitcher().then()
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
        this.props.tallyLoaded(tallies)
    }

    componentDidMount() {
        //connect websocket
        this.connectWebsocket();
        // get tally
        this.getTally().then();
        this.getSwitcher().then()
    }

    sendShortcut = (action: string) => {
        this.props.actionExecuted()
        fetch(`http://${this.props.uri}/v1/shortcut?${action}`).then(value => console.debug(value))
    }

    render() {
        return (
            <>
                <PageSwitch selectedIndex={this.state.page} toggleEdit={event => {
                    event.preventDefault();
                    this.setState({...this.state, editMode: !this.state.editMode})
                }}
                            pageSelected={(index: number) => this.setState({page: index})}/>
                {
                    this.props.inputs !== undefined && this.props.uri !== undefined && this.props.mestates !== undefined &&
                    this.state.page === 0 &&
                    <>
                        <MEControls inputs={this.props.inputs} sendShortcut={this.sendShortcut}
                                    mestates={this.props.mestates}/>
                        <br/>
                        <MainOuts inputs={this.props.inputs} sendShortcut={this.sendShortcut}/>
                        <br/>

                    </>}
                {
                    this.props.inputs !== undefined && this.props.mestates !== undefined &&
                    this.state.page === 1 &&
                    <CustomPage inputs={this.props.tallies} me={this.props.mestates}
                                editMode={this.state.editMode}
                                sendShortcut={this.sendShortcut}/>
                }
            </>
        );
    }

    getSwitcher = async () => {
        let response = await fetch(`http://${this.props.uri}/v1/dictionary?key=switcher`)
        let xml = await response.text()
        console.group('Parse Switcher')
        console.debug('raw: %o', xml)
        let document = new DOMParser().parseFromString(xml, "text/xml");
        console.debug('parsed: %o', document)
        let columns = document.getElementsByTagName('simulated_input');
        let mestates: MEState[] = []
        for (const column of columns) {
            if (column.getAttribute('simulated_input_number')?.startsWith('V')) {
                console.debug(column)
                const name = column.getAttribute('simulated_input_number') ?? ''
                const activeInputs = ControllerComponent.getActiveInputs(column)
                mestates.push({
                    name: name,
                    a: activeInputs.a,
                    b: activeInputs.b,
                    c: activeInputs.c,
                    d: activeInputs.d
                })
            }
        }
        console.debug("inputs: %o", mestates)
        console.groupEnd()
        this.props.switcherLoaded(mestates)
    }

}

export const Controller = connector(ControllerComponent)


const MainOuts = (props: { inputs: Tally[], sendShortcut: (action: string) => void }) => {
    const createAdditionalAction = (row: string, label: string, inputValue: string): Action => {
        // FIXME: active
        return {
            label: label,
            active: false,
            action: () => props.sendShortcut(`name=main_${row}_row_named_input&value=${inputValue}`)
        }
    }
    const createAdditionalActions = (row: string): Action[] => {
        const actions: Action[] = []
        actions.push(createAdditionalAction(row, 'DDR 1', 'ddr1'))
        actions.push(createAdditionalAction(row, 'DDR 2', 'ddr2'))
        actions.push(createAdditionalAction(row, 'GFX 1', 'gfx1'))
        actions.push(createAdditionalAction(row, 'GFX 2', 'gfx2'))
        actions.push(createAdditionalAction(row, 'ME 1', 'v1'))
        actions.push(createAdditionalAction(row, 'ME 2', 'v2'))
        actions.push(createAdditionalAction(row, 'ME 3', 'v3'))
        actions.push(createAdditionalAction(row, 'ME 4', 'v4'))
        return actions;
    }
    return <>
        {
            props.inputs !== undefined &&
            <>
                <Row label={'Pgm'} className="pgm"
                     inputs={[...props.inputs.map(input => ({
                         tally: input,
                         label: (input.index + 1).toString(),
                         active: input.onPgm,
                         action: () => props.sendShortcut(`name=main_a_row&value=${input.index}`)
                     })), ...createAdditionalActions('a')]}/>
                <Row label={'Prev'} className="prev"
                     inputs={[...props.inputs.map(input => ({
                         tally: input,
                         label: (input.index + 1).toString(),
                         active: input.onPrev,
                         action: () => props.sendShortcut(`name=main_b_row&value=${input.index}`)
                     })), ...createAdditionalActions('b')]}/>
                <MainButtons onAction={props.sendShortcut}/>
            </>
        }
    </>
}

const PageSwitch = (props: { selectedIndex: number, pageSelected: (index: number) => void, toggleEdit: (event: React.MouseEvent) => void }) => {
    const getClass = (index: number) => {
        return `button ${index === props.selectedIndex ? 'is-active' : ''}`
    }
    return <>
        <div style={{display: "flex", marginBottom: "0.5em"}}>
            <div className="label" style={{marginRight: "0.5em"}}>Ansicht</div>
            <div className="buttons has-addons">
                <button className={getClass(0)} onClick={() => props.pageSelected(0)}>Standard
                </button>
                <button className={getClass(1)} onClick={() => props.pageSelected(1)}>Custom
                </button>
            </div>
            <span style={{flexGrow: 1}}/>
            {props.selectedIndex === 1 &&
            <button className="button" onClick={props.toggleEdit}>
                <Icon path={mdiPen} size={1} color="black"/>
            </button>}
        </div>
    </>
}

