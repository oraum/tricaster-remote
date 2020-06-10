import {AnyAction} from 'redux'

export const CONNECTED = 'CONNECTED'

export interface ConnectedAction extends AnyAction {
    type: typeof CONNECTED,
    uri: string
}

export const APPSTART = 'AppStart'

export interface AppStart extends AnyAction {
    type: typeof APPSTART
}

export type AppActionTypes = AppStart | ConnectedAction

export interface State {
    connected: boolean,
    uri?: string
}

const initialState: State = {
    connected: false,
    uri: localStorage.getItem('ip') ?? undefined
}

export function appReducer(state = initialState, action: AppActionTypes) {
    switch (action.type) {
        case CONNECTED:
            localStorage.setItem('ip', action.uri)
            return {...state, connected: true, uri: action.uri}
    }
    return state
}

/*export const appReducer = combineReducers({
    connection: connection
})*/
