[![Literate programming][literate-image]][literate-url]

# Kristi

Kristi is an [finite state machine][fsm-url] engine for FRP paradigm. It allows you to describe a program as a **set of states** and a **signal** that represents transitions between this states.

<!--+ [index.js](#Structure "save:") -->

## Table of contents

- [Structure](#structure)
- [FSM Constructor](#fsm-constructor)
    - [Public API definition](#public-api-definition)
- [Helpers](#helpers)
    - [nextState()](#nextstate)
    - [error()](#error)
- [Constants](#constants)


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
let self     = this;
let eventBus = new MicroEvent();
let isRunned = false;
let stateId, state;
```


### State-transition procedure

State-transition procedure in stateful and "dirty", because it knows and mutates Automaton's internal variables.

The whole transition procedure can be described by the next algorithm:

```javascript
function transitState(newStateId, eventId, payload) {
    let newState = newStateId && schema[newStateId];
    let envelope;

    if (!newState) throw error(ERRORS.ESTATENOTEXISTS);

    envelope = { from: stateId, to: newStateId, event: eventId, payload };
    state    = newState;
    stateId  = newStateId;

    emit(EVENTS.TRANSITION, envelope);
}
```


### Event emitting procedure

```javascript
function emit(...args) {
    eventBus.trigger.apply(eventBus, args);
}
```


### Public API definition

    _"Automaton.startWith()"

    _"Automaton.handle()"

    _"Automaton.streams()"

    _"Automaton.on()"

    _"Automaton.off()"

    _"Context Descriptors"


#### Automaton.startWith()

```javascript
/**
 * @param {string} newStateId - id of start fsm state.
 * @returns {Automaton}
 */
this.startWith = function startWith(newStateId, payload) {
    if (isRunned) throw error(ERRORS.EALREADYRUNNED);

    isRunned = true;
    transitState(newStateId, EVENTS.STARTED, payload);
    return this;
};
```


#### Automaton.handle()

`Automaton.handle()` provides processing of input event, that leads (or not) to state transition.
State transition will be refused, is `Automaton` instance is not runned at the moment of `.handle()`.

```javascript
/**
 * @param {string} eventId - id of event to process in current state.
 * @returns {Automaton}
 */
this.handle = function handle(eventId, payload) {
    let nextStateId;

    if (!isRunned) throw error(ERRORS.ENOTRUNNED);

    nextStateId = nextState(schema, stateId, eventId);
    if (!nextStateId) throw error(ERRORS.ENOTRANSITION, eventId, stateId);

    emit(EVENTS.PROCESSING, { from: stateId, to: nextStateId, event: eventId });
    transitState(nextStateId, eventId, payload);
    return this;
};
```


#### Automaton.streams()

```javascript
/**
 * @param {Object} streamDriver - library-specific stream constructor
 * @returns {Object}
 */
this.streams = function streams(streamDriver) {
    let transitions = streamDriver.fromCallback((emitToStream) => {
        eventBus.on(EVENTS.TRANSITION, emitToStream);
    });

    let processing = streamDriver.fromCallback((emitToStream) => {
        eventBus.on(EVENTS.PROCESSING, emitToStream);
    });

    return { transitions, processing };
};
```


#### Automaton.on()

Provide a way to subscribe to Automaton [events](#events).

```javascript
/**
 * @param {string} eventId - id of event to subscribe
 * @param {Function} fn - event handler
 * @returns {Automaton}
 */
this.on = function(eventId, fn) {
    eventBus.bind(eventId, fn);
    return this;
};
```


#### Automaton.off()

Provide a way to unsubscribe from Automaton [events](#events).

```javascript
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


#### Context Descriptors

```javascript
/**
 * @returns {string}
 */
this.currentState = function () { return stateId; };
```


## Helpers

    _"nextState()"

    _"error()"


### nextState()

Pure, calculates the next `stateId`.

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

### error()

Pure, creates new error object.

```javascript
export function error({ code, message }, ...args) {
    let msg = (typeof message === 'function')
        ? message.apply(null, args)
        : message;

    let err = new Error(msg);

    err.code = code;
    return err;
}
```

## Imports

```javascript
import MicroEvent from 'microevent';
```


## Constants

    _"Events"

    _"Errors"


### Events

```javascript
export const EVENTS = {
    STARTED    : 'started',
    TRANSITION : 'transition',
    PROCESSING : 'processing',
    ERROR      : 'error'
};
```

### Errors

```javascript
export const ERRORS = {
    ENOTRUNNED: {
        code    : 'ENOTRUNNED',
        message : 'Automaton is not runned'
    },

    EALREADYRUNNED: {
        code    : 'EALREADYRUNNED',
        message : 'Automaton already runned'
    },

    ENOTRANSITION: {
        code    : 'ENOTRANSITION',
        message : (eventId, stateId) => `Transition for event "${eventId}" is not defined in state "${stateId}"`
    },

    ESTATENOTEXISTS: {
        code    : 'ESTATENOTEXISTS',
        message : (stateId) => `Target state "${stateId}" does not exist`
    }
};
```

[literate-image]: https://img.shields.io/badge/literate%20programming--brightgreen.svg
[literate-url]: https://en.wikipedia.org/wiki/Literate_programming
[fsm-url]: https://en.wikipedia.org/wiki/Finite-state_machine
[automata-url]: https://en.wikipedia.org/wiki/Automata-based_programming
[unix-way-url]: https://en.wikipedia.org/wiki/Unix_philosophy
