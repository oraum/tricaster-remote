import Icon from "@mdi/react";
import {mdiPlus} from "@mdi/js";
import React from "react";
import {TwoRowControllButton, TwoRowLabel} from "./ControlButton";
import {Tally} from "./Controller";
import {MEState} from "./reducers";

export class CustomPage extends React.Component<{ inputs: Tally[], me: MEState[], sendShortcut: (action: string) => void }, { customButtons: string[] }> {
//TODO: getActive
//TODO: Add, Layout, Remove
    getButtonsFromStorage = (): string[] => {
        let item = localStorage.getItem('customButtons');
        if (item) {
            return JSON.parse(item)
        }
        return ['/main/a/1', '/v1/a/4', '/main/auto', '/v2/dsk1']
    }
    state = {
        customButtons: this.getButtonsFromStorage()
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
            return <TwoRowControllButton key={customButton}
                                         label={<TwoRowLabel top={this.getTopLabel(split.slice(1, 3))}
                                                             buttom={getLabel(split[3])}/>}
                                         onClick={this.getInputAction(split)}/>
        } else if (split.length === 3) {
            return <TwoRowControllButton key={customButton}
                                         label={<TwoRowLabel top={this.getTopLabel(split.slice(1, 2))}
                                                             buttom={split[2].toUpperCase()}/>}
                                         onClick={this.getAction(split)}/>
        }
    }


    render() {
        const buttons = this.state.customButtons.map(this.parseToButton)
        return <div>
            <button className="button" onClick={() => {
                const p = prompt("Custom Button")
                if (p) {
                    let customButtons = [...this.state.customButtons, p];
                    localStorage.setItem('customButtons', JSON.stringify(customButtons))
                    this.setState({customButtons: customButtons})
                }
            }}>
                <Icon path={mdiPlus} color="black" size={1}/>
            </button>
            {buttons}
        </div>
    }
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
