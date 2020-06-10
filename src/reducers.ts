import {Action, AnyAction, combineReducers} from 'redux'
import {Action as ActionType, ME} from "./Controller";

export const CONNECTED = 'CONNECTED'

export interface ConnectedAction extends AnyAction {
    type: typeof CONNECTED,
    uri: string
}


export type AppActionTypes = ConnectedAction

interface State {
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
            return {...state, connected: true, uri: action.uri}
        default:
            return state
    }

}

export const TALLY_LOADED = 'TALLY_LOADED'

export interface TallyLoadedAction extends Action {
    type: typeof TALLY_LOADED
}

export const BUTTON_ACTION_EXECUTED = 'BUTTON_ACTION_EXECUTED'

export interface ButtonActionExecuted extends Action {
    type: typeof BUTTON_ACTION_EXECUTED
}

export type ControllerActionTypes = TallyLoadedAction | ButtonActionExecuted

interface ControllerState {
    inputs?: ActionType[],
    me?: ME[],
}

export function controllerReducer(state: ControllerState = {}, action: ControllerActionTypes) {
    switch (action.type) {
        case TALLY_LOADED:
            //TODO:
            return {...state}
        default:
            return state
    }
}

export const rootReducer = combineReducers({
    app: appReducer,
    controller: controllerReducer
})


export type RootState = ReturnType<typeof rootReducer>
