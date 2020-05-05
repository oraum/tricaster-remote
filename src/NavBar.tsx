import React from "react";

type State = {
    isExpanded: boolean
}

export class NavBar extends React.Component<{},State> {
    state: State = {isExpanded: false}

    toggleMenu = (event: React.MouseEvent) => {
        this.setState({
            isExpanded: !this.state.isExpanded
        });
        event.preventDefault();
    }

    render() {
        let active: string;
        if (this.state.isExpanded) {
            active = ' is-active';
        } else {
            active = ''
        }
        return (
            <nav className="navbar" role="navigation" aria-label="main navigation">
                <div className="navbar-brand">
                    <div className="navbar-item">Tricaster Remote</div>
                    <div role="button" className={'navbar-burger' + active} aria-label="menu" aria-expanded="false"
                         onClick={this.toggleMenu}>
                        <span aria-hidden="true"/>
                        <span aria-hidden="true"/>
                        <span aria-hidden="true"/>
                    </div>
                </div>
            </nav>
        );
    }
}
