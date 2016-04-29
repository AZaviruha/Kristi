[![Literate programming][literate-image]][literate-url]
[![NPM version][npm-image]][npm-url]

# Kristi

Kristi is an **asynchronous** [finite state machine][fsm-url] engine. It allows you to describe a program (or part of it) using an [automata-based approach][automata-url].

In addition, this is my first experiment with [literate programming](https://en.wikipedia.org/wiki/Literate_programming) (with help of a [literate-programming-lib](https://github.com/jostylr/literate-programming-lib)).

Kristi is inspired by [Machina.js](https://github.com/ifandelse/machina.js) library.

## Usage

### Import

Users of npm can use `npm install kristi`.
In other case, use `gulp build-min` to get minified UMD-compatible build.


### FSM Construction

```javascript
import { Automaton, EVENTS } from 'kristi';

let fsm = new Automaton({
	'login-screen-is-shown': {
		transitions: {
			'user-authenticated'           : 'todo-screen-is-shown',
			'password-recovery-requested'  : 'password-recovery-screen-is-shown',
		},
		coming() {
			let fsm = this; // Automaton instance is set as `this` in `coming` and `leaving`;

			// AJAX requests for screen template, etc...
			return new Promise((resolve) => {
				$('#btn-recover-passw').click(() => {
					fsm.processEvent('password-recovery-requested');
				});

				resolve();
			});
		},

		leaving() {
			// Some clean-up
		}
	},

	'todo-screen-is-shown' : {
		...
	},

	...
});

fsm.startWith('login-screen-is-shown');
```

The "best practice" is to move transition functions out of fsm-schema definition:

```javascript
let fsm = new Automaton({
	'login-screen-is-shown': {
		transitions: {
			'user-authenticated'           : 'todo-screen-is-shown',
			'password-recovery-requested'  : 'password-recovery-screen-is-show',
		},
		coming:  showLoginScreen,
		leaving: hideLoginScreen
	}
	...
});
```

### Events

Kristi provides simple `on/off` interface, so you can subscribe to some events from fsm instance.

```javascript
fsm.on(EVENTS.TRANSITION, ({from, to}) => {...});

fsm.on(EVENTS.PROCESSING, ({state, event}) => {...});
```

TODO: add full Event API description.


### API

The full API description could be found [here][api-url].

## License

[MIT-LICENSE](https://github.com/AZaviruha/Kristi/blob/master/LICENSE)


[literate-image]: https://img.shields.io/badge/literate%20programming--brightgreen.svg
[literate-url]: https://en.wikipedia.org/wiki/Literate_programming
[npm-image]: http://img.shields.io/badge/npm-v1.2.3-green.svg
[npm-url]: https://www.npmjs.com/package/kristi
[fsm-url]: https://en.wikipedia.org/wiki/Finite-state_machine
[automata-url]: https://en.wikipedia.org/wiki/Automata-based_programming
[api-url]: https://github.com/AZaviruha/Kristi/blob/master/src/index.md#public-api-definition
