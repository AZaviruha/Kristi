const chai           = require('chai')
const expect         = chai.expect;
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

const Kristi = require('../');
const { Automaton, EVENTS, ERRORS, error } = Kristi;
const { statePath, joinPromiseFns } = Kristi;


describe('Kristi', function() {
	this.timeout(3000);

	describe('Helpers', function () {
		describe('error({ code, message }, ...args)', function () {
			it('should return Error instance', function () {
				let errorInfo = { message: 'test', code: 42 };
				let errorInst = error(errorInfo);

				expect(errorInst).to.be.an.instanceOf(Error);
				expect(errorInst.code).to.equal(42);
				expect(errorInst.message).to.equal(errorInfo.message);
			});


			it('should build correct error\'s message from message function', function () {
				let errorInfo = {
					message: function (x,y) { return 'test'+x+y; },
					code: 42
				};

				let errorInst = error(errorInfo, 1, 2);

				expect(errorInst).to.be.an.instanceOf(Error);
				expect(errorInst.code).to.equal(42);
				expect(errorInst.message).to.equal('test12');
			});
		});


		describe('statePath(fsmSchema, statePathFragment, separator)', function () {
			let schema;

			beforeEach(() => {
				schema = require('./mocks/state-path-tests');
			});

			it('should caclulate full path by correct path fragment', function () {
				expect(statePath(schema, 'A')).to.equal('A.A-1');
				expect(statePath(schema, 'A.A-1')).to.equal('A.A-1');
				expect(statePath(schema, 'A.A-2')).to.equal('A.A-2.A-2-1');
				expect(statePath(schema, 'B')).to.equal('B.B-2.B-2-2');
				expect(statePath(schema, 'B.B-1')).to.equal('B.B-1');
				expect(statePath(schema, 'B.B-2')).to.equal('B.B-2.B-2-2');
				expect(statePath(schema, 'B.B-2.B-2-1')).to.equal('B.B-2.B-2-1');

				// Search of initial state
				expect(statePath(schema)).to.equal('A.A-1');
			});

			it('should return `null` if path fragment is incorrect', function () {
				expect(statePath(schema, 'C')).to.be.null;
				expect(statePath(schema, 'A.A-3')).to.be.null;
				expect(statePath(schema, 'A.A-2.A-2-3')).to.be.null;
			});
		});

		describe('joinPromiseFns(fs)', function () {
			it('should join `fs` in ordered chain of promises', function () {
				const fn1 = () => [1];
				const fn2 = (xs) => xs.concat([2]);
				const fn3 = (xs) => xs.concat([3]);

				return expect(joinPromiseFns([fn1, fn2, fn3])).to.eventually.eql([1,2,3]);
			});
		});
	});
});
