import {Action} from "./Controller";
import {ControlButton} from "./ControlButton";
import React from "react";

export function Row(props: { label: string, className?: string, inputs: Action[] }) {
    let buttons = props.inputs.map(value =>
        <ControlButton label={value.label}
                       active={value.active} key={value.label}
                       onClick={value.action}/>
    )
    return (
        <>
            <div className={props.className}>
                <div className="label">{props.label}</div>
                {buttons}
            </div>
        </>
    )
}
