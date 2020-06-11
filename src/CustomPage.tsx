import Icon from "@mdi/react";
import {mdiPlus} from "@mdi/js";
import React from "react";
import {TwoRowControllButton, TwoRowLabel} from "./ControlButton";
import {Tally} from "./Controller";

export const CustomPage = (props: { inputs: Tally[], sendShortcut: (action: string) => void }) => {
    const getTopLabel = (fragments: string[]): string => {
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

    const getAction = (fragments: string[]) => {
        const action = `name=${fragments[1]}_${fragments[2]}${fragments[2] !== "auto" && fragments[2] !== "take" ? "_auto" : ''}`;
        console.debug(action)
        return () => props.sendShortcut(action)
    }

    const getInputAction = (fragments: string[]) => {
        const action = `name=${fragments[1]}_${fragments[2]}_row&value=${fragments[3]}`;
        console.debug(action)
        console.debug(action)
        return () => props.sendShortcut(action)
    }

    const parseToButton = (customButton: string) => {
        const split = customButton.split('/')
        if (split.length === 4) { //input
            return <TwoRowControllButton key={customButton}
                                         label={<TwoRowLabel top={getTopLabel(split.slice(1, 3))}
                                                             buttom={(+split[3] + 1).toString()}/>}
                                         onClick={getInputAction(split)}/>
        } else if (split.length === 3) {
            return <TwoRowControllButton key={customButton}
                                         label={<TwoRowLabel top={getTopLabel(split.slice(1, 2))}
                                                             buttom={split[2].toUpperCase()}/>}
                                         onClick={getAction(split)}/>
        }
    }

    const customButtons = ['/main/a/1', '/v1/a/4', '/main/auto', '/v2/dsk1']
    const buttons = customButtons.map(parseToButton)
    return <div>
        <Icon path={mdiPlus} color="white" size={1}/>
        {buttons}
    </div>
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
