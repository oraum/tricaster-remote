import React from "react";
import {connect, ConnectedProps} from "react-redux";
import {CONNECTED, ConnectedAction, RootState} from "./reducers";

interface State {
    value: string,
    connecting: boolean,
    success: boolean,
    error: boolean,
    info?: Infos
}

const mapStateToProps = (state: RootState) => ({
    ip: state.app.uri
});

const mapDispatch = {
    onIPChange: (ip: string): ConnectedAction => {
        localStorage.setItem('ip', ip)
        return {type: CONNECTED, uri: ip}
    }
}

const connector = connect(
    mapStateToProps,
    mapDispatch
)

type Props = ConnectedProps<typeof connector>

class ConnectForm extends React.Component<Props, State> {
    constructor(props: Readonly<Props>) {
        super(props);
        this.state = {value: props.ip ?? '127.0.0.1', connecting: false, success: false, error: false}
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({value: event.target.value.trim()});
    }

    async handleSubmit(event: React.FormEvent) {
        // alert('A name was submitted: ' + this.state.value);
        event.preventDefault();
        this.setState({connecting: true, success: false, error: false});
        const response = await checkConnection(this.state.value)
        this.setState({connecting: false});
        if (response !== null) {
            this.props.onIPChange(this.state.value)
            this.setState({success: true, info: response});
        } else {
            console.error("No connection")
            this.setState({error: true});
        }
    }

    render() {
        return (
            <div className="container">
                <div className="card">
                    <div className="card-header">
                        <div className="card-header-title">
                            Einstellungen
                        </div>
                    </div>
                    <div className="card-content">
                        <form onSubmit={this.handleSubmit}>
                            <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                    <label className="label" htmlFor="ip">IP/Hostname:</label>
                                </div>
                                <div className="field-body">
                                    <div className="field">
                                        <div className="field has-addons">
                                            <p className="control is-expanded">
                                                <input id="ip" className="input" type="text" value={this.state.value}
                                                       disabled={this.state.connecting}
                                                       onChange={this.handleChange}/>
                                            </p>
                                            <p className="control">
                                                <button className="button is-link" type="submit"
                                                        disabled={this.state.connecting}>Verbinden
                                                </button>
                                            </p>
                                        </div>
                                        {this.state.success &&
                                        <p className="help is-success">Verbindung hergestellt</p>}
                                        {this.state.error &&
                                        <p className="help is-danger">Verbindung konnte nicht hergestellt werden</p>}
                                    </div>

                                </div>
                            </div>
                            {
                                this.state.connecting ?
                                    <div className="field">
                                        <progress className="progress is-small" max="100">15%</progress>
                                    </div> : null
                            }
                            <div className="field is-horizontal">
                                <div className="field-label"/>
                                <div className="field-body">
                                    <div className="field">
                                        {this.state.success &&
                                        <Infos data={this.state.info}/>}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

export const ConnectedConnectForm = connector(ConnectForm)

function Infos(props: { data?: Infos }) {
    return (
        <div className="columns is-mobile">
            <div className="column is-one-quarter ">
                <p>Model:</p>
                <p>Name:</p>
                <p>Version:</p>
            </div>
            <div className="column">
                <p>{props.data?.model}</p>
                <p>{props.data?.name}</p>
                <p>{props.data?.version}</p>
            </div>
        </div>
    );
}

export async function checkConnection(uri: string): Promise<Infos | null> {
    const response = await fetch(`http://${uri}/v1/version`)
        .catch(reason => {
            console.error(reason);
            return new Response(null, {status: 404})
        });
    if (response.ok) {
        const xml = await response.text();
        const document = new DOMParser().parseFromString(xml, "text/xml");
        const name = document.getElementsByTagName("product_name")[0].innerHTML
        const model = document.getElementsByTagName("product_model")[0].innerHTML
        const version = document.getElementsByTagName("product_version")[0].innerHTML
        return {model: model, name: name, version: version}
    } else {
        return null
    }
}

type Infos = {
    name: string,
    model: string
    version: string
}
