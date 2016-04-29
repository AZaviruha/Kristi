[![Literate programming][literate-image]][literate-url]

# Kristi

Kristi is an **asynchronous** [finite state machine][fsm-url] engine. It allows you to describe a program (or part of it) using an [automata-based approach][automata-url].

<!--+ [index.js](#Structure "save:") -->

## Table of contents

- [Structure](#structure)
- [FSM Constructor](#fsm-constructor)
    - [State-transition procedure](#state-transition-procedure)
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
let self         = this;
let eventBus     = new MicroEvent();
let isRunned     = false;
let inTransition = false;
let simpleQueue  = null;
let stateId, state, targetStateId, transitionEventId, transition;
```


### State-transition procedure

State-transition procedure in stateful and "dirty", because it knows and mutates Automaton's internal variables.
Operation of state transition is atomic. It's not possible to make a few transition simultaneously (we use a boolean flag `inTransition` to check, if the new process of state transition could be run).

The whole transition procedure can be described by the next algorithm:

```javascript
function transitState(automaton, newStateId, args=[]) {

    _"Check, if transition could be performed, and stop if it could not"

    _"Start transition (async) process"

    _"Call old state's `leaving` and new state's `coming` functions, in order"

    _"Do post-transition work (save new `stateId`, unlock `inTransition` flag etc)"

}
```


#### Check, if transition could be performed, and stop if it could not

```javascript
let newState = newStateId && schema[newStateId];

if (!newState) return Promise.reject(error(ERRORS.ESTATENOTEXISTS));
if (inTransition) return transition;
```


#### Start transition (async) process

From this moment, previous transition deprecates, and we could start new transition.

```javascript
inTransition = true;
transition   = Promise.resolve(true);
```


#### Call old state's \`leaving\` and new state's \`coming\` functions, in order

```javascript
const leaving = state && state.leaving;
const coming  = newState.coming;

if (typeof leaving === 'function') {
    transition = transition.then(() => leaving.call(automaton));
}

if (typeof coming === 'function') {
    transition = transition.then(() => coming.apply(automaton, args));
}
```


#### Do post-transition work (save new \`stateId\`, unlock \`inTransition\` flag etc)

```javascript
transition = transition.then(() => {
    let envelope = { from: stateId, to: newStateId };

    stateId       = newStateId;
    state         = newState
    targetStateId = transitionEventId = null;
    inTransition  = false;

    emit(EVENTS.TRANSITION, envelope);

    if (simpleQueue) {
        try {
            self.processEvent.apply(self, simpleQueue);
        }
        catch (e) {
            emit(EVENTS.ERROR, error(ERRORS.EQUEUEDFAILED))
        }
        finally {
            simpleQueue = null;
        }
    }

    return true;
});

return transition;
```

### Event emitting procedure

It's not a part of public API, because fsm is not event bus and [should not][unix-way-url].

```javascript
function emit(...args) {
    eventBus.trigger.apply(eventBus, args);
}
```

### Public API definition

    _"Automaton.startWith()"

    _"Automaton.processEvent()"

    _"Automaton.on()"

    _"Automaton.off()"

    _"Context Descriptors"


#### Automaton.startWith()

```javascript
/**
 * @param {string} newStateId - id of start fsm state.
 * @returns {Promise}
 */
this.startWith = function(newStateId) {
    if (isRunned) throw error(ERRORS.EALREADYRUNNED);

    isRunned = true;
    return transitState(self, newStateId);
};
```

#### Automaton.processEvent()

`Automaton.processEvent()` provides processing of input event, that leads (or not) to state transition.
State transition will be refused, is `Automaton` instance is not runned at the moment of `.processEvent()`.

```javascript
/**
 * @param {string} eventId - id of event to process in current state.
 * @returns {Promise}
 */
this.processEvent = function(eventId, ...args) {
    if (!isRunned) throw error(ERRORS.ENOTRUNNED);

    if (inTransition) {
        simpleQueue = [[eventId].concat(args)];
    } else {
        let nextStateId = nextState(schema, stateId, eventId);

        if (!nextStateId) throw error(ERRORS.ECANTBEPROCESSED, eventId, stateId);

        emit(EVENTS.PROCESSING, { state: stateId, event: eventId });
        targetStateId     = nextStateId;
        transitionEventId = eventId;
        transitState(self, nextStateId, args);
    }
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
this.currentState = function () {
    return stateId;
};


/**
 * @returns {string}
 */
this.currentTransition = function () {
    return transition;
};
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

    ECANTBEPROCESSED: {
        code    : 'ECANTBEPROCESSED',
        message : (eventId, stateId) => `Event "${eventId}" can't be processed in state "${stateId}"`
    },

    ESTATENOTEXISTS: {
        code    : 'ESTATENOTEXISTS',
        message : (stateId) => `Target state "${stateId}" does not exist`
    },

    EQUEUEDFAILED: {
        code    : 'EQUEUEDFAILED',
        message : (eventId, stateId) => `Queued event "${eventId} could not be processed in the target state "${stateId}"`
    }

};
```

[literate-image]: https://img.shields.io/badge/literate%20programming--brightgreen.svg
[literate-url]: https://en.wikipedia.org/wiki/Literate_programming
[fsm-url]: https://en.wikipedia.org/wiki/Finite-state_machine
[automata-url]: https://en.wikipedia.org/wiki/Automata-based_programming
[unix-way-url]: https://en.wikipedia.org/wiki/Unix_philosophy
