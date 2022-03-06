import {Action, AnyAction, combineReducers} from 'redux'
import {Tally} from "./Controller";

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

export interface TallyLoadedAction extends AnyAction {
    type: typeof TALLY_LOADED,
    tallies: Tally[]
}

export const BUTTON_ACTION_EXECUTED = 'BUTTON_ACTION_EXECUTED'

export interface ButtonActionExecutedAction extends Action {
    type: typeof BUTTON_ACTION_EXECUTED
}

export const SWITCHER_LOADED = 'SWITCHER_LOADED'

export interface SwitcherLoadedAction extends AnyAction {
    type: typeof SWITCHER_LOADED,
    me: MEState[]
}

export type ControllerActionTypes = TallyLoadedAction | ButtonActionExecutedAction | SwitcherLoadedAction

export type MEState = {
    name: string, a: number, b: number, c: number, d: number
}

interface ControllerState {
    me?: MEState[],
    tallies?: Tally[],
}

export function controllerReducer(state: ControllerState = {}, action: ControllerActionTypes) {
    switch (action.type) {
        case TALLY_LOADED:
            return {...state, tallies: action.tallies}
        case SWITCHER_LOADED:
            return {...state, me: action.me}
        default:
            return state
    }
}

export const rootReducer = combineReducers({
    app: appReducer,
    controller: controllerReducer
})


export type RootState = ReturnType<typeof rootReducer>
