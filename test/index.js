var expect = require('chai').expect;
require('chai-as-promised');

var Kristi     = require('../');
var Automaton  = Kristi.Automaton;
var nextState  = Kristi.nextState;
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

			it('should return object with `.processEvent` method', function () {
				expect(fsm.processEvent).to.be.a('function');
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

			it('should return object with `.currentTransition` method', function () {
				expect(fsm.currentTransition).to.be.a('function');
			});
		});


		describe('#startWith()', function () {
			it('should return Promise', function () {
				expect(fsm.startWith('s1').then).to.be.a('function');
			});

			it('should throw exception if called more than once', function () {
				function fn() { fsm.startWith('s1'); }

				fsm.startWith('s1');
				expect(fn).to.throw('Automaton already runned');
			});

			it('should transit fsm into right state', function () {
				return fsm.startWith('s1').then(function () {
					expect(fsm.currentState()).to.equal('s1');
				});
			});
		});


		describe('#process()', function () {
			it('should return Promise', function () {
				return fsm.startWith('s1').then(function () {
					expect(fsm.processEvent('e2').then).to.be.a('function');
				});
			});

			it('should return rejected Promise if fsm is not runned', function () {
				return fsm
					.processEvent('e2')
					.catch(function (err) {
						expect(err.code).to.equal(ERRORS.ENOTRUNNED);
					});
			});

			it('should transit fsm into right state (by promises chain)', function () {
				return fsm.startWith('s1')
					.then(function () { return fsm.processEvent('e2'); })
					.then(function () {
						expect(fsm.currentState()).to.equal('s2');
					});
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

				fsm
					.startWith('s1')
					.then(function () {
						fsm.processEvent('e2');
						fsm.processEvent('e3');
					})
					.catch(done);
			});

			it('should apply queued event, to the new ("result-of-current-transition") state', function (done) {
				schema = require('./mocks/process-call-from-in-transition');
				fsm    = new Automaton(schema);

				return fsm
					.startWith('s1')
					.then(function () {
						fsm.processEvent('e2');
						return fsm.processEvent('e2');
					})
					.catch(function (err) {
						expect(err.code).to.equal(ERRORS.EWILLNOTPROCESSED);
						expect(fsm.currentState()).to.equal('s2');
						done();
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
