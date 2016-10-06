// import MicroEvent from 'microevent';

import { ERRORS, error } from './lib/errors'
export { ERRORS, error } from './lib/errors';

export const EVENTS = {
    TRANSITION : 'transition',
    PROCESSING : 'processing',
    ERROR      : 'error'
};

export const EMPTY_STATE        = {};
export const UNRESPONSIVE_STATE = '__unresponsive__'


/**
 * @param {Object} schema
 * @returns {Function}
 */
export function Automaton(schema) {

    /**
     * 
     */
    this.run = function run() {
        let initialState = schema.initialState;

        if (!initialState) throw error(ERROR.ENOINITIALSTATE);

        let initializing = (typeof schema.initialize === 'function')
            ? Promise.resolve(schema.initialize())
            : Promise.resolve();

        let nextStatePath   = statePath(fsmSchema, initialState);
        let comingNextState = treeToStack(fsmSchema, nextStatePath);

        return initializing.then(() => comingNextState);
    }

    return this;
}


function doTransition(fsmSchema, currentStateId, eventId) {
    let currentStatePath   = statePath(fsmSchema, currentStateId);
    let nextStateId        = nextRootStateId(fsmSchema, currentStatePath, eventId);
    let nextStatePath      = statePath(fsmSchema, nextStateId);
    let levingCurrentState = treeToStack(fsmSchema, currentStatePath).reverse();
    let comingNextState    = treeToStack(fsmSchema, nextStatePath);

    return executeTransitionPlan(leavingCurrentState, comingNextState);
}


export function executeTransitionPlan(leaving, coming) {
    return coming.then(() => leaving);
}


/**
 * @param {Object} fsmSchema
 * @param {string} statePathFragment
 * @returns {string}
 */
export function statePath(fsmSchema, statePathFragment, separator='.') {
    let result      = [];
    let tokens      = (statePathFragment || fsmSchema.initialState).split(separator);
    let currentNode = fsmSchema;
    let currentState, currentToken;

    while (tokens.length) {
        currentToken = tokens.shift();
        currentState = currentNode.states[currentToken];

        if (currentState) {
            result.push(currentToken);

            currentNode = currentState.child;
  
            if (!tokens.length && currentNode && currentNode.initialState) {
                tokens.push(currentNode.initialState)
            }
        } else {
            return null;
        }
    } 

    return result.join(separator);
}


export function nextRootStateId(fsmSchema, currentStatePath, eventId) {
}
