import Icon from "@mdi/react";
import {mdiDelete, mdiPlus} from "@mdi/js";
import React from "react";
import {TwoRowControllButton, TwoRowLabel} from "./ControlButton";
import {Tally} from "./Controller";
import {MEState} from "./reducers";

export class CustomPage extends React.Component<{ inputs: Tally[], me: MEState[], sendShortcut: (action: string) => void, editMode: boolean }, { customButtons: string[][] }> {
//TODO: Add, Layout, Remove
    getButtonsFromStorage = (): string[][] => {
        let item = localStorage.getItem('customButtons');
        if (item) {
            return JSON.parse(item)
        }
        return []
    }
    state = {
        customButtons: this.getButtonsFromStorage()
    }

    getActive = (fragments: string[]): boolean => {
        if (fragments[0] === "main") {
            return false
            if (fragments[1] === "a") {
                //FIXME:
                return this.props.inputs[+fragments[2]].onPgm
            } else if (fragments[1] === "b") {
                return this.props.inputs[+fragments[2]].onPrev
            }
        } else if (fragments[0].startsWith("v")) {
            let meState = this.props.me[+fragments[0][1] - 1];
            if (fragments[1] === 'a' || fragments[1] === 'b' || fragments[1] === 'c' || fragments[1] === 'd') {
                return meState[fragments[1]] === +fragments[2]
            }
        }

        return false
    }

    getTopLabel = (fragments: string[]): string => {
        if (fragments[0] === "main") {
            if (fragments.length < 2) {
                return "Main"
            } else if (fragments[1] === "a") {
                return "Pgm"
            } else if (fragments[1] === "b") {
                return "Prev"
            }
        } else if (fragments[0].startsWith("v")) {
            return `ME ${fragments[0][1]} ${fragments.length > 1 ? fragments[1].toUpperCase() : ''}`
        }
        return ""
    }

    getAction = (fragments: string[]) => {
        const action = `name=${fragments[1]}_${fragments[2]}${fragments[2] !== "auto" && fragments[2] !== "take" ? "_auto" : ''}`;
        return () => this.props.sendShortcut(action)
    }

    getInputAction = (fragments: string[]) => {
        let action: string
        if (isNaN(+fragments[3])) {
            action = `name=${fragments[1]}_${fragments[2]}_row_named_input&value=${fragments[3]}`;
        } else {
            action = `name=${fragments[1]}_${fragments[2]}_row&value=${fragments[3]}`;
        }
        return () => this.props.sendShortcut(action)
    }

    parseToButton = (customButton: string) => {
        const split = customButton.split('/')
        const getLabel = (s: string): string => {
            if (isNaN(+s)) {
                return s.replace('v', 'ME ').toUpperCase()
            } else {
                return (+s + 1).toString()
            }
        }
        if (split.length === 4) { //input
            return <TwoRowControllButton key={customButton} active={this.getActive(split.slice(1))}
                                         label={<TwoRowLabel
                                             top={this.getTopLabel(split.slice(1, 3))}
                                             buttom={getLabel(split[3])}/>}
                                         onClick={this.getInputAction(split)}/>
        } else if (split.length === 3) {
            return <TwoRowControllButton key={customButton}
                                         label={<TwoRowLabel
                                             top={this.getTopLabel(split.slice(1, 2))}
                                             buttom={split[2].toUpperCase()}/>}
                                         onClick={this.getAction(split)}/>
        }
    }

    wrapButtons = (button: string, index: number, rowIndex: number) => {
        return <DeleteContainer key={`del_${rowIndex}_${index}`} editMode={this.props.editMode}
                                elementDeleted={() => {
                                    this.deleteElement(rowIndex, index)
                                }}>
            {this.parseToButton(button)}
        </DeleteContainer>
    }

    addButton = (button: string, row: number) => {
        if (row === this.state.customButtons.length) {
            let customButtons = [...this.state.customButtons, [button]]
            localStorage.setItem('customButtons', JSON.stringify(customButtons))
            this.setState({customButtons: customButtons})
        } else {
            let newRow = [...this.state.customButtons[row]]
            newRow.push(button)

            let customButtons = [...this.state.customButtons.slice(0, row), newRow, ...this.state.customButtons.slice(row + 1)]
            localStorage.setItem('customButtons', JSON.stringify(customButtons))
            this.setState({customButtons: customButtons})
        }
    }

    deleteElement = (row: number, element: number) => {
        //TODO: delete row if last element is deleted
        let newRow = [...this.state.customButtons[row].slice(0, element), ...this.state.customButtons[row].slice(element + 1)]

        let customButtons = [...this.state.customButtons.slice(0, row), newRow, ...this.state.customButtons.slice(row + 1)]
        localStorage.setItem('customButtons', JSON.stringify(customButtons))
        this.setState({customButtons: customButtons})
    }


    render() {
        const buttons = this.state.customButtons.map((value, i) =>
            <div key={`row_${i}`}>{value.map((value1, index) => this.wrapButtons(value1, index, i))}
                <AddButton editMode={this.props.editMode} me={this.props.me}
                           inputs={this.props.inputs}
                           newButtonAdded={button => this.addButton(button, i)}/>
            </div>)
        return <div>
            {buttons}
            <AddButton me={this.props.me} inputs={this.props.inputs}
                       editMode={this.props.editMode}
                       newButtonAdded={button => this.addButton(button, this.state.customButtons.length)}
            />
        </div>
    }
}


class AddButton extends React.Component<{ editMode: boolean, newButtonAdded: (button: string) => void, inputs: Tally[], me: MEState[] },
    { showAddModal: boolean, switcherSelected: boolean, rowSelected: boolean, switcher?: string, row?: string }> {
    state = {
        showAddModal: false,
        switcherSelected: false,
        rowSelected: false,
        switcher: undefined,
        row: undefined
    }

    setSwitcher = (switcher: string) => {
        this.setState({...this.state, switcher: switcher, switcherSelected: true})
    }

    setRow = (row: string) => {
        this.setState({...this.state, row: row, rowSelected: true})
    }
    setInput = (input: string) => {
        this.props.newButtonAdded(`/${this.state.switcher}${this.state.row ? '/' + this.state.row : ''}/${input}`)
        this.setState({showAddModal: false})
    }

    createList = () => {
        if (!this.state.switcherSelected) {
            return (<ul>
                <li onClick={() => this.setSwitcher('main')}>Main</li>
                <li onClick={() => this.setSwitcher('v1')}>ME 1</li>
                <li onClick={() => this.setSwitcher('v2')}>ME 2</li>
                <li onClick={() => this.setSwitcher('v3')}>ME 3</li>
                <li onClick={() => this.setSwitcher('v4')}>ME 4</li>
            </ul>)
        } else if (!this.state.rowSelected) {
            const dsks = <>
                <li onClick={() => this.setInput('dsk1')}>DSK 1</li>
                <li onClick={() => this.setInput('dsk2')}>DSK 2</li>
                <li onClick={() => this.setInput('dsk3')}>DSK 3</li>
                <li onClick={() => this.setInput('dsk4')}>DSK 4</li>
                <li onClick={() => this.setInput('auto')}>AUTO</li>
                <li onClick={() => this.setInput('take')}>TAKE</li>
            </>
            if (this.state.switcher === 'main') {
                return <ul>
                    <li onClick={() => this.setRow('a')}>Pgm</li>
                    <li onClick={() => this.setRow('b')}>Prev</li>
                    {dsks}
                </ul>
            } else {
                return (<ul>
                    <li onClick={() => this.setRow('a')}>Row A</li>
                    <li onClick={() => this.setRow('b')}>Row B</li>
                    <li onClick={() => this.setRow('c')}>Row C</li>
                    <li onClick={() => this.setRow('d')}>Row D</li>
                    {dsks}
                </ul>)
            }
        } else {
            const inputs = this.props.inputs.filter(value => value.name.startsWith('input')).map(value =>
                <li onClick={() => this.setInput(value.index.toString())}>Input {value.index + 1}</li>)
            const bfrs = this.props.inputs.filter(value => value.name.startsWith('bfr')).map(value =>
                <li onClick={() => this.setInput(value.name)}>{value.name.toUpperCase()}</li>)
            const black = <li onClick={() => this.setInput('black')}>Black</li>
            const ddrs = this.props.inputs.filter(value => value.name.startsWith('ddr') && !value.name.includes('_')).map(value =>
                <li onClick={() => this.setInput(value.name)}>{value.name.toUpperCase()}</li>)
            const gfxs = this.props.inputs.filter(value => value.name.startsWith('gfx') && !value.name.includes('_')).map(value =>
                <li onClick={() => this.setInput(value.name)}>{value.name.toUpperCase()}</li>)
            const mes = this.props.inputs.filter(value => value.name.startsWith('v')).map((value, i) =>
                <li onClick={() => this.setInput(value.name)}>ME {i + 1}</li>)
            return (<ul>
                {inputs}
                {bfrs}
                {black}
                {ddrs}
                {gfxs}
                {mes}
            </ul>)
        }
    }

    render() {
        return <>
            {this.props.editMode && <button className="button" onClick={() => {
                this.setState({showAddModal: true, switcherSelected: false, rowSelected: false})
            }}>
                <Icon path={mdiPlus} color="black" size={1}/>
            </button>}
            {this.state.showAddModal && <>
                <div className='modal is-active'>
                    <div className="modal-background" onClick={event => {
                        event.preventDefault();
                        this.setState({...this.state, showAddModal: false});
                    }}/>
                    <div className="modal-content">
                        <div className="container">
                            <div className="card">
                                <div className="card-header">
                                    <div className="card-header-title">
                                        {this.state.switcher || 'Switcher'}
                                    </div>
                                </div>
                                <div className="card-content">
                                    {this.createList()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>}
        </>
    }
}

const DeleteContainer = (props: { editMode: boolean, elementDeleted: () => void, children?: React.ReactNode }) => {
    return <span style={{position: "relative"}}>
        {props.children}
        {props.editMode &&
        <button style={{position: "absolute", right: "0", background: "none", border: "none"}}
                onClick={event => {
                    event.preventDefault();
                    props.elementDeleted();
                }}>
            <Icon path={mdiDelete} color="red" size={1}/>
        </button>
        }
    </span>
}

/* Schema für Custom Buttons

inputs:
    /output/row/value
transitions:
    /output/transition

examples:
    main:
        /main/a/2 -> Pgm 3, /main/b/1 -> Prev 2
        /main/auto -> Main Auto, /main/dsk1 -> Main DSK1
    me:
        /v1/a/4 -> ME 1 A 5, /v2/b/ddr1 -> ME 2 B DDR 1
        /v3/dsk1 -> ME3 DSK 1
 */
