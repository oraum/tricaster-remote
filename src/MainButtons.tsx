import React from "react";
import {ControlButton} from "./ControlButton";

export class MainButtons extends React.Component<{ onAction(action: string): void }, {}> {
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
