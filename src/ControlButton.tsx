import React, {MouseEventHandler} from "react";

/**
 * Simple Button with onClick Handler, label and active flag
 * @param props
 * @constructor
 */
export function ControlButton(props: ControllButtonProps) {
    let className = "button" + (props.active ? ' is-active' : '') + ' ' + props.className;
    return (
        <>
            <button className={className} onClick={props.onClick}>{props.label}</button>
        </>
    )
}

type ControllButtonProps = { active?: boolean, label: string | JSX.Element, onClick?: MouseEventHandler, className?: string }

export const TwoRowControllButton = (props: ControllButtonProps) => {
    return (
        <ControlButton label={props.label} active={props.active} className="two-row" onClick={props.onClick}/>
    )
}

export const TwoRowLabel = (props: { top: string, buttom: string }) => <span>{props.top}<br/>{props.buttom}</span>
