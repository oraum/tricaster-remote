import React, {MouseEventHandler} from "react";

/**
 * Simple Button with onClick Handler, label and active flag
 * @param props
 * @constructor
 */
export function ControlButton(props: ControllButtonProps) {
    let className = "button" + (props.active ? ' is-active' : '');
    return (
        <>
            <button className={className} onClick={props.onClick}>{props.label}</button>
        </>
    )
}

type ControllButtonProps = { active?: boolean, label: string, onClick?: MouseEventHandler }
