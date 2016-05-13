var expect = require('chai').expect;
require('chai-as-promised');

var Kristi     = require('../');
var Automaton  = Kristi.Automaton;
var nextState  = Kristi.nextState;
var error      = Kristi.error;
var EVENTS     = Kristi.EVENTS;
var ERRORS     = Kristi.ERRORS;

describe('Kristi', function() {
	this.timeout(3000);

	describe('Helpers', function () {
		describe('nextState()', function () {
			var schema = require('./mocks/base-fsm');

			it('should caclulate next state if transition from current state exists', function () {
				expect(nextState(schema, 's1', 'e2')).to.equal('s2');
				expect(nextState(schema, 's1', 'e3')).to.equal('s3');
				expect(nextState(schema, 's2', 'e1')).to.equal('s1');
				expect(nextState(schema, 's2', 'e3')).to.equal('s3');
			});

			it('should return `null` if input is not recognized from current state', function () {
				expect(nextState(schema, 's1', 'unknown')).to.equal(null);
			});

			it('should return `null` if current state is not defined in scheme', function () {
				expect(nextState(schema, 'unknown', 'e1')).to.equal(null);
			});
		});


		describe('error()', function () {
			it('should return Error instance', function () {
				var errorInfo = { message: 'test', code: -1 };
				var errorInst = error(errorInfo);

				expect(errorInst).to.be.an.instanceOf(Error);
				expect(errorInst.code).to.equal(-1);
				expect(errorInst.message).to.equal(errorInfo.message);
			});

			it('should build correct error\'s message from message function', function () {
				var errorInfo = {
					message: function (x,y) { return 'test'+x+y; },
					code: -1
				};

				var errorInst = error(errorInfo, 1, 2);

				expect(errorInst).to.be.an.instanceOf(Error);
				expect(errorInst.code).to.equal(-1);
				expect(errorInst.message).to.equal('test12');
			});
		});
	});


	describe('Automaton', function () {
		var schema;
		var fsm;

		beforeEach(function () {
			schema = require('./mocks/base-fsm');
			fsm = new Automaton(schema);
		});

		describe('constructor', function () {

			/**
			 * Publick API checks
			 */

			it('should return object with `.startWith` method', function () {
				expect(fsm.startWith).to.be.a('function');
			});

			it('should return object with `.handle` method', function () {
				expect(fsm.handle).to.be.a('function');
			});

			it('should return object with `.on` method', function () {
				expect(fsm.on).to.be.a('function');
			});

			it('should return object with `.off` method', function () {
				expect(fsm.off).to.be.a('function');
			});

			it('should return object with `.currentState` method', function () {
				expect(fsm.currentState).to.be.a('function');
			});
		});


		describe('#startWith()', function () {
			it('should return Automaton instance', function () {
				expect(fsm.startWith('s1')).to.be.an.instanceOf(Automaton);
			});

			it('should throw exception if called more than once', function () {
				function fn() { fsm.startWith('s1'); }

				fsm.startWith('s1');
				expect(fn).to.throw(ERRORS.EALREADYRUNNED.message);
			});

			it('should transit fsm into right state', function () {
				fsm.startWith('s1');
				expect(fsm.currentState()).to.equal('s1');
			});
		});


		describe('#handle()', function () {
			it('should return Automaton instance', function () {
				fsm.startWith('s1')
				expect(fsm.handle('e2')).to.be.an.instanceOf(Automaton);
			});

			it('should throw exception if Automaton is not runned', function () {
				function fn() { fsm.processEvent('s1'); }

				expect(fn).to.throw(ERRORS.ENOTRUNNED.message);
			});

			it('should transit fsm into right state (by events)', function (done) {
				fsm.startWith('s1').then(function () {
					fsm.on(EVENTS.TRANSITION, function () {
						expect(fsm.currentState()).to.equal('s3');
						done();
					});

					return fsm.processEvent('e3');
				})
				.catch(done);
			});

			it('should allow to queue event processing, from "in-transition" state', function (done) {
				var time1, time2;

				schema = require('./mocks/process-call-from-in-transition');
				fsm    = new Automaton(schema);

				fsm.on(EVENTS.TRANSITION, function (transition) {
					if ((transition.from === 's1') && (transition.to === 's2')) {
						time1 = Date.now();
					}

					if ((transition.from === 's2') && (transition.to === 's3')) {
						time2 = Date.now();
						expect(time1).to.be.most(time2);
						done();
					}
				});

				fsm.startWith('s1').then(function () {
					fsm.processEvent('e2');
					fsm.processEvent('e3');
				});
			});

			it('should apply queued event, to the new ("result-of-current-transition") state: error case', function (done) {
				schema = require('./mocks/process-call-from-in-transition');
				fsm    = new Automaton(schema);

				// 4. So, if our strategy "last-is-winner" is implemented properly
				// then we should to get error event.
				fsm.on(EVENTS.ERROR, function (err) {
					try {
						expect(err.code).to.equal(ERRORS.EQUEUEDFAILED.code);
						expect(fsm.currentState()).to.equal('s2');
						done();
					} catch (e) {
						done(e);
					}
				});

				fsm.startWith('s1').then(function () {
					// 1. Let's start new transition: (s1, e2) => s2
					fsm.processEvent('e2');

					// 2. In state `s2` event `e3` is valid
					fsm.processEvent('e3');
					fsm.processEvent('e3');
					fsm.processEvent('e3');

					// 3. But our last request - `e5` is invalid in `s2`
					fsm.processEvent('e5');
				});
			});

			it('should apply queued event, to the new ("result-of-current-transition") state: success case', function (done) {
				schema = require('./mocks/process-call-from-in-transition');
				fsm    = new Automaton(schema);

				// 4. So, if our strategy "last-is-winner" is implemented properly
				// then we will get normal transition to state 's3' here.
				fsm.on(EVENTS.TRANSITION, function (transition) {
					if (transition.to === 's3') done();
				});

				fsm.on(EVENTS.ERROR, done);

				fsm.startWith('s1').then(function () {
					// 1. Let's start new transition: (s1, e2) => s2
					fsm.processEvent('e2');

					// 2. In state `s2` event `e5` is invalid
					fsm.processEvent('e5');
					fsm.processEvent('e5');
					fsm.processEvent('e5');

					// 3. But our last request - `e3` is valid in `s2`
					fsm.processEvent('e3');
				});
			});
		});


		describe('life cycle events', function () {
			beforeEach(function () {
				schema = require('./mocks/base-fsm');
				fsm = new Automaton(schema);
			});

			it('should emit `TRANSITION` event on `.startWith` call', function (done) {
				fsm.on(EVENTS.TRANSITION, function (envelope) {
					expect(envelope.from).to.be.undefined;
					expect(envelope.to).to.equal('s1')
					done();
				});

				fsm.startWith('s1').catch(done);
			});

			it('should emit `TRANSITION` event after successful transition', function (done) {
				fsm.startWith('s1').then(function () {
					fsm.on(EVENTS.TRANSITION, function (envelope) {
						expect(envelope.from).to.equal('s1');
						expect(envelope.to).to.equal('s3')
						done();
					});

					return fsm.processEvent('e3');
				})
				.catch(done);
			});

			it('should emit `PROCESSING` event on `.processEvent` call', function (done) {
				fsm.startWith('s1').then(function () {
					fsm.on(EVENTS.PROCESSING, function (envelope) {
						expect(envelope.state).to.equal('s1');
						expect(envelope.event).to.equal('e3')
						done();
					});

					return fsm.processEvent('e3');
				})
				.catch(done);
			});
		});
	});
});
