import React from "react";
import "./MEControls.scss"
import {Action, Tally} from "./Controller";
import {Row} from "./Row";
import {MEState} from "./reducers";

export class MEControls extends React.Component<{ inputs: Tally[], sendShortcut: (action: string) => void, mestates: MEState[] }, { meSelected: number }> {
    state = {meSelected: 0}

    render() {
        let mes = this.props.mestates[this.state.meSelected]
        return (<>
            <MESwitch meSelected={index => this.setState({meSelected: index})} selectedIndex={this.state.meSelected}
                      me={this.props.mestates}/>
            {mes !== undefined &&
            <>
                <MERow inputs={this.props.inputs} row="a" name={mes.name} activeInputIndex={mes.a}
                       sendShortcut={this.props.sendShortcut}/>
                <MERow inputs={this.props.inputs} row="b" name={mes.name} activeInputIndex={mes.b}
                       sendShortcut={this.props.sendShortcut}/>
                <MERow inputs={this.props.inputs} row="c" name={mes.name} activeInputIndex={mes.c}
                       sendShortcut={this.props.sendShortcut}/>
                <MERow inputs={this.props.inputs} row="d" name={mes.name} activeInputIndex={mes.d}
                       sendShortcut={this.props.sendShortcut}/>
                <Row label="" className="me_dsk"
                     inputs={this.createDSKActions(mes.name)}/>
            </>
            }
        </>)
    }

    private createDSKActions(name: string): Action[] {
        name = name.toLowerCase()
        const actions: Action[] = []
        actions.push({label: 'DSK 1', active: false, action: () => this.props.sendShortcut(`name=${name}_dsk1_auto`)});
        actions.push({label: 'DSK 2', active: false, action: () => this.props.sendShortcut(`name=${name}_dsk2_auto`)});
        actions.push({label: 'DSK 3', active: false, action: () => this.props.sendShortcut(`name=${name}_dsk3_auto`)});
        actions.push({label: 'DSK 4', active: false, action: () => this.props.sendShortcut(`name=${name}_dsk4_auto`)});
        return actions;
    }
}

function MESwitch(props: { meSelected(index: number): void, selectedIndex: number, me: MEState[] }) {
    const getClass = (index: number) => {
        return `button ${index === props.selectedIndex ? 'is-active' : ''}`
    }
    const buttons = props.me.map((value, index) => <button className={getClass(index)}
                                                           onClick={() => props.meSelected(index)}
                                                           key={value.name}>ME {index + 1}</button>)
    return (
        <>
            <div className="buttons has-addons">
                {buttons}
            </div>
        </>
    )
}

const MERow = (props: { inputs: Tally[], row: string, name: string, sendShortcut: (action: string) => void, activeInputIndex: number }) => {
    const createAdditionalAction = (me: string, row: string, label: string, inputValue: string): Action => {
        // FIXME: active
        return {
            label: label,
            active: false,
            action: () => props.sendShortcut(`name=${me}_${row}_row_named_input&value=${inputValue}`)
        }
    }
    const createAdditionalActions = (me: string, row: string): Action[] => {
        me = me.toLowerCase()
        const actions: Action[] = []
        actions.push(createAdditionalAction(me, row, 'DDR 1', 'ddr1'))
        actions.push(createAdditionalAction(me, row, 'DDR 2', 'ddr2'))
        actions.push(createAdditionalAction(me, row, 'GFX 1', 'gfx1'))
        actions.push(createAdditionalAction(me, row, 'GFX 2', 'gfx2'))
        actions.push(createAdditionalAction(me, row, 'ME 1', 'v1'))
        actions.push(createAdditionalAction(me, row, 'ME 2', 'v2'))
        actions.push(createAdditionalAction(me, row, 'ME 3', 'v3'))
        actions.push(createAdditionalAction(me, row, 'ME 4', 'v4'))
        actions.push(createAdditionalAction(me, row, 'Black', 'black'))
        return actions;
    }
    const inputs: Action[] = props.inputs.map(value => ({
        tally: value,
        label: (value.index + 1).toString(),
        active: props.activeInputIndex === value.index,
        action: () => props.sendShortcut(`name=${props.name}_${props.row}_row&value=${value.index}`)
    }));
    return <>
        <Row label={props.row.toUpperCase()} className={`me_${props.row}`}
             inputs={[...inputs, ...createAdditionalActions(props.name, props.row)]}/>
    </>
}



