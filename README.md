[![Literate programming][literate-image]][literate-url]
[![NPM version][npm-image]][npm-url]

# Kristi

Kristi is an [finite state machine][fsm-url] engine for FRP paradigm. It allows you to describe a program as a **set of states** and a **signal** that represents transitions between this states.

In addition, this is my first experiment with [literate programming](https://en.wikipedia.org/wiki/Literate_programming) (with help of a [literate-programming-lib](https://github.com/jostylr/literate-programming-lib)).

Kristi is inspired by [Machina.js](https://github.com/ifandelse/machina.js) library.

## Usage

### Import

Users of npm can use `npm install kristi`.
In other case, use `gulp build-min` to get minified UMD-compatible version.


### FSM Construction

```javascript
import BaconDriver from 'kristi-bacon';
import { Automaton } from 'kristi';

let app = new Automaton({
    'state-s1': {
        'event-e2'  : 'state-s2',
        'event-e3'  : 'state-s3'
    },

    'state-s2': {
        'event-e1'  : 'state-s1',
        'event-e3'  : 'state-s3'
    }
})
.streams(BaconDriver)
.transitions // End of Automaton instance API. Start of FRP lib-specific API.
.map((envelope) => {
	let { from, to, event, payload } = envelope;

	// ... some transformation

	return newEnvelope;
})
.onValue(({ from, to, event, payload }) => {
    switch (`${from}:${to}:${event}`) {

    case 'state-s1:state-s2:event-e1':
        leavingS1().then(comingS2).then(() => app.handle('event-e3'));
        break;

    case 'state-s1:state-s3:event-e3':
        leavingS1().then(comingS2).then(() => app.handle('event-e1'));
        break;
    }
});

app.startWith('state-s1');
```


### API

The full API description could be found [here][api-url].


### Events

Kristi provides simple `on/off` interface, so you can subscribe to some events from fsm instance, if you don't need FRP power.

```javascript
fsm.on(EVENTS.TRANSITION, ({from, to, event, payload}) => {...});

fsm.on(EVENTS.PROCESSING, ({from, to, event, payload}) => {...});
```

TODO: add full Event API description.


## License

[MIT-LICENSE](https://github.com/AZaviruha/Kristi/blob/master/LICENSE)


[literate-image]: https://img.shields.io/badge/literate%20programming--brightgreen.svg
[literate-url]: https://en.wikipedia.org/wiki/Literate_programming
[npm-image]: http://img.shields.io/badge/npm-v1.2.4-green.svg
[npm-url]: https://www.npmjs.com/package/kristi
[fsm-url]: https://en.wikipedia.org/wiki/Finite-state_machine
[automata-url]: https://en.wikipedia.org/wiki/Automata-based_programming
[api-url]: https://github.com/AZaviruha/Kristi/blob/master/src/index.md#public-api-definition
