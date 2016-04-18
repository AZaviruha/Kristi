[![Literate programming][literate-image]][literate-url]

# Kristi

Kristi is an **asynchronous** [finite state machine][fsm-url] engine. It allows you to describe a program (or part of it) using an [automata-based approach][automata-url].

<!--+ [index.js](#Structure "save:") -->

## Table of contents

- [Structure](#markdown-header-structure)
- [FSM Constructor](#markdown-header-fsm-constructor)
    - [State-transition procedure](#markdown-header-state-transition-procedure)
    - [Public API definition](#markdown-header-public-api-definition)
- [Helpers](#markdown-header-helpers)
    - [nextState()](#markdown-header-nextstate)


## Structure

Our program consists of several parts:

    _"Imports"

    _"Constants"

    _"FSM Constructor"

    _"Helpers"


## FSM Constructor

Kristi allows us to create a new fsm instance by using an `Automaton` constructor.

```javascript
export function Automaton(schema) {

    _"Automaton private variables (state)"

    _"State-transition procedure"

    _"Event emitting procedure"

    _"Public API definition"
}
```


### Automaton private variables (state)

```javascript
let self         = this;
let eventBus     = new MicroEvent();
let isRunned     = false;
let inTransition = false;
let stateId, state;
```


### State-transition procedure

State-transition procedure in stateful and "dirty", because it knows and mutates Automaton's internal variables.
Operation of state transition is atomic. It's not possible to make a few transition simultaneously (we use a boolean flag `inTransition` to check, if the new process of state transition could be run).

The whole transition procedure can be described by the next algorithm:

```javascript
function transitState(automaton, newStateId, args=[]) {

    _"Check, if transition could be performed, and stop if it could not"

    _"Start transition (async) process"

    _"Call old state's `exit` and new state's `enter` functions, in order"

    _"Do post-transition work (save new `stateId`, unlock `inTransition` flag etc)"

}
```


#### Check, if transition could be performed, and stop if it could not

```javascript
const newState = newStateId && schema[newStateId];

if (inTransition || !newState) return;
```


#### Start transition (async) process

```javascript
inTransition   = true;
let transition = Promise.resolve(true);
```


#### Call old state's \`exit\` and new state's \`enter\` functions, in order

```javascript
const exit  = state && state.exit;
const enter = newState.enter;

if (typeof exit === 'function') {
    transition = transition.then(() => exit.call(automaton));
}

if (typeof enter === 'function') {
    transition = transition.then(() => enter.apply(automaton, args));
}
```


#### Do post-transition work (save new \`stateId\`, unlock \`inTransition\` flag etc)

```javascript
return transition.then(() => {
    let envelope = { from: stateId, to: newStateId };
    stateId      = newStateId;
    state        = newState
    inTransition = false;

    emit(EVENTS.TRANSITION, envelope);
    return true;
});
```

### Event emitting procedure

It's not a part of public API, because fsm is not event bus and [should not][unix-way-url].

```javascript
function emit(...args) {
    eventBus.trigger.apply(eventBus, args);
}
```

### Public API definition

```javascript
/**
 * @param {string} newStateId - id of start fsm state.
 * @returns {Promise}
 */
this.startWith = function(newStateId) {
    if (isRunned) {
        throw new Error('Automaton already runned');
    }

    isRunned = true;
    return transitState(self, newStateId);
};


/**
 * @param {string} eventId - id of event to process in current state.
 * @returns {Promise}
 */
this.process = function(eventId, ...args) {
    if (!isRunned) {
        throw new Error('Automaton is not runned');
    }

    let envelope = { state: stateId, event: eventId };
    emit(EVENTS.PROCESSING, envelope);

    return transitState(self, nextState(schema, stateId, eventId), args);
};


/**
 * @returns {string}
 */
this.currentState = function () {
    return stateId;
};


/**
 * @param {string} eventId - id of event to subscribe
 * @param {Function} fn - event handler
 * @returns {Automaton}
 */
this.on = function(eventId, fn) {
    eventBus.bind(eventId, fn);
    return this;
};


/**
 * @param {string} eventId - id of event to unsubscribe
 * @param {Function} fn - event handler
 * @returns {Automaton}
 */
this.off = function(eventId, fn) {
    eventBus.unbind(eventId, fn);
    return this;
};
```


## Helpers

    _"nextState()"


### nextState()

Pure, calculates of the next `stateId`.

```javascript
/**
 * @param {Object} schema - transition schema of fsm instance
 * @param {string} stateId - id of current state
 * @param {string} eventId - id of event to process in current state
 * @returns {string}
 */
export function nextState(schema, stateId, eventId) {
    const state = schema[stateId];

    return (state && state.transitions)
        ? state.transitions[eventId] || null
        : null;
}
```


## Imports

```javascript
import MicroEvent from 'microevent';
```


## Constants

```javascript
export const EVENTS = {
    TRANSITION : 'transition',
    PROCESSING : 'processing'
};
```

[literate-image]: https://img.shields.io/badge/literate%20programming--brightgreen.svg
[literate-url]: https://en.wikipedia.org/wiki/Literate_programming
[fsm-url]: https://en.wikipedia.org/wiki/Finite-state_machine
[automata-url]: https://en.wikipedia.org/wiki/Automata-based_programming
[unix-way-url]: https://en.wikipedia.org/wiki/Unix_philosophy
