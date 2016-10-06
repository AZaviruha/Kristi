[![NPM version][npm-image]][npm-url]

# Kristi

Kristi is an **asynchronous** [finite state machine][fsm-url] engine. It allows you to describe a program (or part of it) using an [automata-based approach][automata-url].

Kristi is inspired by [Machina.js](https://github.com/ifandelse/machina.js).

## Usage

### Import

Users of npm can use `npm install kristi`.
In other case, use `gulp build` to get UMD-compatible build.


### FSM Construction

```javascript
import { Automaton, EVENTS, EMPTY_STATE } from 'kristi';

let ajaxCounterFSM = new Automaton({
    initialize() { return Promise(); },

    initialState: 'ready', 

    states: {
        'ready': {
            actions: {
                coming(transition, payload) { enableButton(); }
            },

            triggers: {
                'increment-requested' : 'increment-processing'
            },

            child: {
                initialState: 'idle',

                states: {
                    'idle': EMPTY_STATE,

                    'error-shown': {
                        actions: {
                            coming(transition, { errorMsg }) { showError(errorMsg); },
                            leaving(transition) { clearError(); }
                        },

                        triggers: {
                            'error-processed': 'idle'
                        }
                    }
                }
            }
        },

        'increment-processing': {
            actions: {
                coming(transition, payload) { 
                    return api
                        .increment()
                        .then(() => this.processEvent('increment-processed'))
                        .catch((err) => {
                            if (err.message === 'EMAXREACHED') {
                                this.processEvent('max-reached');
                            } else {
                                this.processEvent('increment-rejected', { errorMsg: err.message });
                            }
                        }); 
                },

                leaving(transition) { return Promise(); }
            },

            triggers: {
                'increment-processed' : 'ready',
                'increment-rejected'  : (data) => ({ stateId: 'ready.error-shown', data }),
                'max-reached'        : 'disabled'
            },

        },

        'disabled': {
            actions: {
                coming(transition, payload) { disableButton(); },
            },
        }
    }
});

fsm.run()
```


### Events

Kristi provides simple `on/off` interface, so you can subscribe to some events from fsm instance.

```javascript
fsm.on(EVENTS.TRANSITION, ({from, to}) => {...});

fsm.on(EVENTS.PROCESSING, ({state, event}) => {...});
```

TODO: add full Event API description.


### API

TODO 

## License

[MIT-LICENSE](https://github.com/AZaviruha/Kristi/blob/master/LICENSE)


[npm-image]: http://img.shields.io/badge/npm-v2.0.0-green.svg
[npm-url]: https://www.npmjs.com/package/kristi
[fsm-url]: https://en.wikipedia.org/wiki/Finite-state_machine
[automata-url]: https://en.wikipedia.org/wiki/Automata-based_programming
