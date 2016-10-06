// import MicroEvent from 'microevent';

import { ERRORS, error } from './lib/errors'
export { ERRORS, error } from './lib/errors';

export const EVENTS = {
    TRANSITION : 'transition',
    PROCESSING : 'processing',
    ERROR      : 'error'
};

export const EMPTY_STATE        = {};
export const UNRESPONSIVE_STATE = '__unresponsive__';


/**
 * @param {Object} schema
 * @returns {Function}
 */
export function Automaton(schema) {
    let runned;

    /**
     * @returns {Promise}
     */
    this.run = function run() {
        if (runned) return runned;

        let initialState = schema.initialState;

        if (!initialState) throw error(ERROR.ENOINITIALSTATE);

        let initializing = (typeof schema.initialize === 'function')
            ? Promise.resolve(schema.initialize())
            : Promise.resolve();

        let nextStatePath   = statePath(fsmSchema, initialState);
        let comingNextState = treeToStack(fsmSchema, nextStatePath, 'coming');

        return runned = initializing.then(() => comingNextState);
    }

    return this;
}


/**
 * @param {Object} fsmSchema
 * @param {string} currentStateId
 * @param {string} eventId
 * @returns {string}
 */
function doTransition(fsmSchema, currentStateId, eventId) {
    let currentStatePath   = statePath(fsmSchema, currentStateId);
    let levingCurrentState = joinPromiseFns(treeToStack(fsmSchema, currentStatePath, 'leaving')
                                .reverse());

    let nextStateId        = nextRootStateId(fsmSchema, currentStatePath, eventId);
    let nextStatePath      = statePath(fsmSchema, nextStateId);
    let comingNextState    = joinPromiseFns(treeToStack(fsmSchema, nextStatePath, 'coming'));

    return leavingCurrentState.then(() => comingNextState);
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
  
            /**
             * Use default path fragment, if tokens are over.
             */
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


export function treeToStack(fsmSchema, statePath, propName) {
}


/**
 * @param {Function[]} fs
 * @returns {Promise}
 */
export function joinPromiseFns(fs=[]) {
    return fs.reduce((acc, f) => acc.then((...args) => f.apply(null, args)), Promise.resolve());
}
