import React from "react";
import "./MEControls.scss"
import {ME} from "./Controller";
import {Row} from "./Row";

export class MEControls extends React.Component<{ me: ME[] }, { meSelected: number }> {
    state = {meSelected: 0}

    render() {
        let me = this.props.me[this.state.meSelected]
        return (<>
            <MESwitch meSelected={index => this.setState({meSelected: index})} selectedIndex={this.state.meSelected} me={this.props.me}/>
            {me !== undefined ?
                <>
                    <Row label={me.a.label} className="me_a"
                         inputs={me.a.inputs}/>
                    <Row label={me.b.label} className="me_b"
                         inputs={me.b.inputs}/>
                    <Row label={me.c.label} className="me_c"
                         inputs={me.c.inputs}/>
                    <Row label={me.d.label} className="me_d"
                         inputs={me.d.inputs}/>
                    <Row label={me.dsks.label} className="me_dsk"
                         inputs={me.dsks.inputs}/>
                </> : null
            }
        </>)
    }
}

function MESwitch(props: { meSelected(index: number): void, selectedIndex: number, me: ME[] }) {
    const getClass = (index: number) => {
        return `button ${index === props.selectedIndex ? 'is-active' : ''}`
    }
    const buttons = props.me.map((value, index) => <button className={getClass(index)} onClick={() => props.meSelected(index)} key={value.name}>ME {index + 1}</button>)
    return (
        <>
            <div className="buttons has-addons">
                {buttons}
            </div>
        </>
    )
}

