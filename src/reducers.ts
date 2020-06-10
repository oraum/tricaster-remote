import {Action, AnyAction, combineReducers} from 'redux'
import {ME, Tally} from "./Controller";

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
    type: typeof TALLY_LOADED
}

export const BUTTON_ACTION_EXECUTED = 'BUTTON_ACTION_EXECUTED'

export interface ButtonActionExecuted extends Action {
    type: typeof BUTTON_ACTION_EXECUTED
}

export const INITIAL_TALLY_LOADED = 'INITIAL_TALLY_LOADED'

export interface InitialTallyLoaded extends AnyAction {
    type: typeof INITIAL_TALLY_LOADED,
    tallies: Tally[]
}

export type ControllerActionTypes = TallyLoadedAction | ButtonActionExecuted | InitialTallyLoaded

interface ControllerState {
    initalTallyLoaded: boolean
    inputs?: Tally[],
    me?: ME[],
    tallies?: Tally[],
}

export function controllerReducer(state: ControllerState = {initalTallyLoaded: false}, action: ControllerActionTypes) {
    switch (action.type) {
        case TALLY_LOADED:
            if (!state.initalTallyLoaded) {
                // ignore changes
                return state
            }
            // build page layout
            //TODO:
            return {...state}
        case "INITIAL_TALLY_LOADED":
            return {...state, initalTallyLoaded: true, tallies: action.tallies}
        default:
            return state
    }
}

export const rootReducer = combineReducers({
    app: appReducer,
    controller: controllerReducer
})


export type RootState = ReturnType<typeof rootReducer>
