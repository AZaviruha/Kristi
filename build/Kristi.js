(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Kristi = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * MicroEvent - to make any js object an event emitter (server or browser)
 * 
 * - pure javascript - server compatible, browser compatible
 * - dont rely on the browser doms
 * - super simple - you get it immediatly, no mistery, no magic involved
 *
 * - create a MicroEventDebug with goodies to debug
 *   - make it safer to use
*/

var MicroEvent	= function(){}
MicroEvent.prototype	= {
	bind	: function(event, fct){
		this._events = this._events || {};
		this._events[event] = this._events[event]	|| [];
		this._events[event].push(fct);
	},
	unbind	: function(event, fct){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		this._events[event].splice(this._events[event].indexOf(fct), 1);
	},
	trigger	: function(event /* , args... */){
		this._events = this._events || {};
		if( event in this._events === false  )	return;
		for(var i = 0; i < this._events[event].length; i++){
			this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
		}
	}
};

/**
 * mixin will delegate all MicroEvent.js function in the destination object
 *
 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
 *
 * @param {Object} the object which will support MicroEvent
*/
MicroEvent.mixin	= function(destObject){
	var props	= ['bind', 'unbind', 'trigger'];
	for(var i = 0; i < props.length; i ++){
		destObject.prototype[props[i]]	= MicroEvent.prototype[props[i]];
	}
}

// export in common js
if( typeof module !== "undefined" && ('exports' in module)){
	module.exports	= MicroEvent
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EVENTS = undefined;
exports.Automaton = Automaton;
exports.nextState = nextState;

var _microevent = require('microevent');

var _microevent2 = _interopRequireDefault(_microevent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EVENTS = exports.EVENTS = {
    TRANSITION: 'transition',
    PROCESSING: 'processing'
};

function Automaton(schema) {

    var self = this;
    var eventBus = new _microevent2.default();
    var isRunned = false;
    var inTransition = false;
    var stateId = void 0,
        state = void 0;

    function transitState(automaton, newStateId) {
        var args = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];


        var newState = newStateId && schema[newStateId];

        if (inTransition || !newState) return;

        inTransition = true;
        var transition = Promise.resolve(true);

        var exit = state && state.exit;
        var enter = newState.enter;

        if (typeof exit === 'function') {
            transition = transition.then(function () {
                return exit.call(automaton);
            });
        }

        if (typeof enter === 'function') {
            transition = transition.then(function () {
                return enter.apply(automaton, args);
            });
        }

        return transition.then(function () {
            var envelope = { from: stateId, to: newStateId };
            stateId = newStateId;
            state = newState;
            inTransition = false;

            emit(EVENTS.TRANSITION, envelope);
            return true;
        });
    }

    function emit() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        eventBus.trigger.apply(eventBus, args);
    }

    /**
     * @param {string} newStateId - id of start fsm state.
     * @returns {Promise}
     */
    this.startWith = function (newStateId) {
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
    this.process = function (eventId) {
        if (!isRunned) {
            throw new Error('Automaton is not runned');
        }

        var envelope = { state: stateId, event: eventId };
        emit(EVENTS.PROCESSING, envelope);

        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            args[_key2 - 1] = arguments[_key2];
        }

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
    this.on = function (eventId, fn) {
        eventBus.bind(eventId, fn);
        return this;
    };

    /**
     * @param {string} eventId - id of event to unsubscribe
     * @param {Function} fn - event handler
     * @returns {Automaton}
     */
    this.off = function (eventId, fn) {
        eventBus.unbind(eventId, fn);
        return this;
    };
}

/**
 * @param {Object} schema - transition schema of fsm instance
 * @param {string} stateId - id of current state
 * @param {string} eventId - id of event to process in current state
 * @returns {string}
 */
function nextState(schema, stateId, eventId) {
    var state = schema[stateId];

    return state && state.transitions ? state.transitions[eventId] || null : null;
}

},{"microevent":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbWljcm9ldmVudC9taWNyb2V2ZW50LmpzIiwic3JjL2luZGV4Lm1kIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7OztRQzNDZ0I7UUE4R0E7O0FBckhoQjs7Ozs7O0FBRU8sSUFBTSwwQkFBUztBQUNsQixnQkFBYSxZQUFiO0FBQ0EsZ0JBQWEsWUFBYjtDQUZTOztBQUtOLFNBQVMsU0FBVCxDQUFtQixNQUFuQixFQUEyQjs7QUFFOUIsUUFBSSxPQUFlLElBQWYsQ0FGMEI7QUFHOUIsUUFBSSxXQUFlLDBCQUFmLENBSDBCO0FBSTlCLFFBQUksV0FBZSxLQUFmLENBSjBCO0FBSzlCLFFBQUksZUFBZSxLQUFmLENBTDBCO0FBTTlCLFFBQUksZ0JBQUo7UUFBYSxjQUFiLENBTjhCOztBQVE5QixhQUFTLFlBQVQsQ0FBc0IsU0FBdEIsRUFBaUMsVUFBakMsRUFBc0Q7WUFBVCw2REFBSyxrQkFBSTs7O0FBRWxELFlBQU0sV0FBVyxjQUFjLE9BQU8sVUFBUCxDQUFkLENBRmlDOztBQUlsRCxZQUFJLGdCQUFnQixDQUFDLFFBQUQsRUFBVyxPQUEvQjs7QUFFQSx1QkFBaUIsSUFBakIsQ0FOa0Q7QUFPbEQsWUFBSSxhQUFhLFFBQVEsT0FBUixDQUFnQixJQUFoQixDQUFiLENBUDhDOztBQVNsRCxZQUFNLE9BQVEsU0FBUyxNQUFNLElBQU4sQ0FUMkI7QUFVbEQsWUFBTSxRQUFRLFNBQVMsS0FBVCxDQVZvQzs7QUFZbEQsWUFBSSxPQUFPLElBQVAsS0FBZ0IsVUFBaEIsRUFBNEI7QUFDNUIseUJBQWEsV0FBVyxJQUFYLENBQWdCO3VCQUFNLEtBQUssSUFBTCxDQUFVLFNBQVY7YUFBTixDQUE3QixDQUQ0QjtTQUFoQzs7QUFJQSxZQUFJLE9BQU8sS0FBUCxLQUFpQixVQUFqQixFQUE2QjtBQUM3Qix5QkFBYSxXQUFXLElBQVgsQ0FBZ0I7dUJBQU0sTUFBTSxLQUFOLENBQVksU0FBWixFQUF1QixJQUF2QjthQUFOLENBQTdCLENBRDZCO1NBQWpDOztBQUlBLGVBQU8sV0FBVyxJQUFYLENBQWdCLFlBQU07QUFDekIsZ0JBQUksV0FBVyxFQUFFLE1BQU0sT0FBTixFQUFlLElBQUksVUFBSixFQUE1QixDQURxQjtBQUV6QixzQkFBZSxVQUFmLENBRnlCO0FBR3pCLG9CQUFlLFFBQWYsQ0FIeUI7QUFJekIsMkJBQWUsS0FBZixDQUp5Qjs7QUFNekIsaUJBQUssT0FBTyxVQUFQLEVBQW1CLFFBQXhCLEVBTnlCO0FBT3pCLG1CQUFPLElBQVAsQ0FQeUI7U0FBTixDQUF2QixDQXBCa0Q7S0FBdEQ7O0FBZ0NBLGFBQVMsSUFBVCxHQUF1QjswQ0FBTjs7U0FBTTs7QUFDbkIsaUJBQVMsT0FBVCxDQUFpQixLQUFqQixDQUF1QixRQUF2QixFQUFpQyxJQUFqQyxFQURtQjtLQUF2Qjs7Ozs7O0FBeEM4QixRQWdEOUIsQ0FBSyxTQUFMLEdBQWlCLFVBQVMsVUFBVCxFQUFxQjtBQUNsQyxZQUFJLFFBQUosRUFBYztBQUNWLGtCQUFNLElBQUksS0FBSixDQUFVLDBCQUFWLENBQU4sQ0FEVTtTQUFkOztBQUlBLG1CQUFXLElBQVgsQ0FMa0M7QUFNbEMsZUFBTyxhQUFhLElBQWIsRUFBbUIsVUFBbkIsQ0FBUCxDQU5rQztLQUFyQjs7Ozs7O0FBaERhLFFBOEQ5QixDQUFLLE9BQUwsR0FBZSxVQUFTLE9BQVQsRUFBMkI7QUFDdEMsWUFBSSxDQUFDLFFBQUQsRUFBVztBQUNYLGtCQUFNLElBQUksS0FBSixDQUFVLHlCQUFWLENBQU4sQ0FEVztTQUFmOztBQUlBLFlBQUksV0FBVyxFQUFFLE9BQU8sT0FBUCxFQUFnQixPQUFPLE9BQVAsRUFBN0IsQ0FMa0M7QUFNdEMsYUFBSyxPQUFPLFVBQVAsRUFBbUIsUUFBeEIsRUFOc0M7OzJDQUFOOztTQUFNOztBQVF0QyxlQUFPLGFBQWEsSUFBYixFQUFtQixVQUFVLE1BQVYsRUFBa0IsT0FBbEIsRUFBMkIsT0FBM0IsQ0FBbkIsRUFBd0QsSUFBeEQsQ0FBUCxDQVJzQztLQUEzQjs7Ozs7QUE5RGUsUUE2RTlCLENBQUssWUFBTCxHQUFvQixZQUFZO0FBQzVCLGVBQU8sT0FBUCxDQUQ0QjtLQUFaOzs7Ozs7O0FBN0VVLFFBdUY5QixDQUFLLEVBQUwsR0FBVSxVQUFTLE9BQVQsRUFBa0IsRUFBbEIsRUFBc0I7QUFDNUIsaUJBQVMsSUFBVCxDQUFjLE9BQWQsRUFBdUIsRUFBdkIsRUFENEI7QUFFNUIsZUFBTyxJQUFQLENBRjRCO0tBQXRCOzs7Ozs7O0FBdkZvQixRQWtHOUIsQ0FBSyxHQUFMLEdBQVcsVUFBUyxPQUFULEVBQWtCLEVBQWxCLEVBQXNCO0FBQzdCLGlCQUFTLE1BQVQsQ0FBZ0IsT0FBaEIsRUFBeUIsRUFBekIsRUFENkI7QUFFN0IsZUFBTyxJQUFQLENBRjZCO0tBQXRCLENBbEdtQjtDQUEzQjs7Ozs7Ozs7QUE4R0EsU0FBUyxTQUFULENBQW1CLE1BQW5CLEVBQTJCLE9BQTNCLEVBQW9DLE9BQXBDLEVBQTZDO0FBQ2hELFFBQU0sUUFBUSxPQUFPLE9BQVAsQ0FBUixDQUQwQzs7QUFHaEQsV0FBTyxLQUFDLElBQVMsTUFBTSxXQUFOLEdBQ1gsTUFBTSxXQUFOLENBQWtCLE9BQWxCLEtBQThCLElBQTlCLEdBQ0EsSUFGQyxDQUh5QztDQUE3QyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIE1pY3JvRXZlbnQgLSB0byBtYWtlIGFueSBqcyBvYmplY3QgYW4gZXZlbnQgZW1pdHRlciAoc2VydmVyIG9yIGJyb3dzZXIpXG4gKiBcbiAqIC0gcHVyZSBqYXZhc2NyaXB0IC0gc2VydmVyIGNvbXBhdGlibGUsIGJyb3dzZXIgY29tcGF0aWJsZVxuICogLSBkb250IHJlbHkgb24gdGhlIGJyb3dzZXIgZG9tc1xuICogLSBzdXBlciBzaW1wbGUgLSB5b3UgZ2V0IGl0IGltbWVkaWF0bHksIG5vIG1pc3RlcnksIG5vIG1hZ2ljIGludm9sdmVkXG4gKlxuICogLSBjcmVhdGUgYSBNaWNyb0V2ZW50RGVidWcgd2l0aCBnb29kaWVzIHRvIGRlYnVnXG4gKiAgIC0gbWFrZSBpdCBzYWZlciB0byB1c2VcbiovXG5cbnZhciBNaWNyb0V2ZW50XHQ9IGZ1bmN0aW9uKCl7fVxuTWljcm9FdmVudC5wcm90b3R5cGVcdD0ge1xuXHRiaW5kXHQ6IGZ1bmN0aW9uKGV2ZW50LCBmY3Qpe1xuXHRcdHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcblx0XHR0aGlzLl9ldmVudHNbZXZlbnRdID0gdGhpcy5fZXZlbnRzW2V2ZW50XVx0fHwgW107XG5cdFx0dGhpcy5fZXZlbnRzW2V2ZW50XS5wdXNoKGZjdCk7XG5cdH0sXG5cdHVuYmluZFx0OiBmdW5jdGlvbihldmVudCwgZmN0KXtcblx0XHR0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG5cdFx0aWYoIGV2ZW50IGluIHRoaXMuX2V2ZW50cyA9PT0gZmFsc2UgIClcdHJldHVybjtcblx0XHR0aGlzLl9ldmVudHNbZXZlbnRdLnNwbGljZSh0aGlzLl9ldmVudHNbZXZlbnRdLmluZGV4T2YoZmN0KSwgMSk7XG5cdH0sXG5cdHRyaWdnZXJcdDogZnVuY3Rpb24oZXZlbnQgLyogLCBhcmdzLi4uICovKXtcblx0XHR0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG5cdFx0aWYoIGV2ZW50IGluIHRoaXMuX2V2ZW50cyA9PT0gZmFsc2UgIClcdHJldHVybjtcblx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRzW2V2ZW50XS5sZW5ndGg7IGkrKyl7XG5cdFx0XHR0aGlzLl9ldmVudHNbZXZlbnRdW2ldLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXG5cdFx0fVxuXHR9XG59O1xuXG4vKipcbiAqIG1peGluIHdpbGwgZGVsZWdhdGUgYWxsIE1pY3JvRXZlbnQuanMgZnVuY3Rpb24gaW4gdGhlIGRlc3RpbmF0aW9uIG9iamVjdFxuICpcbiAqIC0gcmVxdWlyZSgnTWljcm9FdmVudCcpLm1peGluKEZvb2Jhcikgd2lsbCBtYWtlIEZvb2JhciBhYmxlIHRvIHVzZSBNaWNyb0V2ZW50XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHRoZSBvYmplY3Qgd2hpY2ggd2lsbCBzdXBwb3J0IE1pY3JvRXZlbnRcbiovXG5NaWNyb0V2ZW50Lm1peGluXHQ9IGZ1bmN0aW9uKGRlc3RPYmplY3Qpe1xuXHR2YXIgcHJvcHNcdD0gWydiaW5kJywgJ3VuYmluZCcsICd0cmlnZ2VyJ107XG5cdGZvcih2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkgKyspe1xuXHRcdGRlc3RPYmplY3QucHJvdG90eXBlW3Byb3BzW2ldXVx0PSBNaWNyb0V2ZW50LnByb3RvdHlwZVtwcm9wc1tpXV07XG5cdH1cbn1cblxuLy8gZXhwb3J0IGluIGNvbW1vbiBqc1xuaWYoIHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgKCdleHBvcnRzJyBpbiBtb2R1bGUpKXtcblx0bW9kdWxlLmV4cG9ydHNcdD0gTWljcm9FdmVudFxufVxuIiwiaW1wb3J0IE1pY3JvRXZlbnQgZnJvbSAnbWljcm9ldmVudCc7XG5cbmV4cG9ydCBjb25zdCBFVkVOVFMgPSB7XG4gICAgVFJBTlNJVElPTiA6ICd0cmFuc2l0aW9uJyxcbiAgICBQUk9DRVNTSU5HIDogJ3Byb2Nlc3NpbmcnXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gQXV0b21hdG9uKHNjaGVtYSkge1xuXG4gICAgbGV0IHNlbGYgICAgICAgICA9IHRoaXM7XG4gICAgbGV0IGV2ZW50QnVzICAgICA9IG5ldyBNaWNyb0V2ZW50KCk7XG4gICAgbGV0IGlzUnVubmVkICAgICA9IGZhbHNlO1xuICAgIGxldCBpblRyYW5zaXRpb24gPSBmYWxzZTtcbiAgICBsZXQgc3RhdGVJZCwgc3RhdGU7XG5cbiAgICBmdW5jdGlvbiB0cmFuc2l0U3RhdGUoYXV0b21hdG9uLCBuZXdTdGF0ZUlkLCBhcmdzPVtdKSB7XG4gICAgXG4gICAgICAgIGNvbnN0IG5ld1N0YXRlID0gbmV3U3RhdGVJZCAmJiBzY2hlbWFbbmV3U3RhdGVJZF07XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5UcmFuc2l0aW9uIHx8ICFuZXdTdGF0ZSkgcmV0dXJuO1xuICAgIFxuICAgICAgICBpblRyYW5zaXRpb24gICA9IHRydWU7XG4gICAgICAgIGxldCB0cmFuc2l0aW9uID0gUHJvbWlzZS5yZXNvbHZlKHRydWUpO1xuICAgIFxuICAgICAgICBjb25zdCBleGl0ICA9IHN0YXRlICYmIHN0YXRlLmV4aXQ7XG4gICAgICAgIGNvbnN0IGVudGVyID0gbmV3U3RhdGUuZW50ZXI7XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGV4aXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0cmFuc2l0aW9uLnRoZW4oKCkgPT4gZXhpdC5jYWxsKGF1dG9tYXRvbikpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZW9mIGVudGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0cmFuc2l0aW9uID0gdHJhbnNpdGlvbi50aGVuKCgpID0+IGVudGVyLmFwcGx5KGF1dG9tYXRvbiwgYXJncykpO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGVudmVsb3BlID0geyBmcm9tOiBzdGF0ZUlkLCB0bzogbmV3U3RhdGVJZCB9O1xuICAgICAgICAgICAgc3RhdGVJZCAgICAgID0gbmV3U3RhdGVJZDtcbiAgICAgICAgICAgIHN0YXRlICAgICAgICA9IG5ld1N0YXRlXG4gICAgICAgICAgICBpblRyYW5zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgICAgICBlbWl0KEVWRU5UUy5UUkFOU0lUSU9OLCBlbnZlbG9wZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW1pdCguLi5hcmdzKSB7XG4gICAgICAgIGV2ZW50QnVzLnRyaWdnZXIuYXBwbHkoZXZlbnRCdXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdTdGF0ZUlkIC0gaWQgb2Ygc3RhcnQgZnNtIHN0YXRlLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHRoaXMuc3RhcnRXaXRoID0gZnVuY3Rpb24obmV3U3RhdGVJZCkge1xuICAgICAgICBpZiAoaXNSdW5uZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQXV0b21hdG9uIGFscmVhZHkgcnVubmVkJyk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgaXNSdW5uZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdHJhbnNpdFN0YXRlKHNlbGYsIG5ld1N0YXRlSWQpO1xuICAgIH07XG4gICAgXG4gICAgXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50SWQgLSBpZCBvZiBldmVudCB0byBwcm9jZXNzIGluIGN1cnJlbnQgc3RhdGUuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgdGhpcy5wcm9jZXNzID0gZnVuY3Rpb24oZXZlbnRJZCwgLi4uYXJncykge1xuICAgICAgICBpZiAoIWlzUnVubmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F1dG9tYXRvbiBpcyBub3QgcnVubmVkJyk7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgbGV0IGVudmVsb3BlID0geyBzdGF0ZTogc3RhdGVJZCwgZXZlbnQ6IGV2ZW50SWQgfTtcbiAgICAgICAgZW1pdChFVkVOVFMuUFJPQ0VTU0lORywgZW52ZWxvcGUpO1xuICAgIFxuICAgICAgICByZXR1cm4gdHJhbnNpdFN0YXRlKHNlbGYsIG5leHRTdGF0ZShzY2hlbWEsIHN0YXRlSWQsIGV2ZW50SWQpLCBhcmdzKTtcbiAgICB9O1xuICAgIFxuICAgIFxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgdGhpcy5jdXJyZW50U3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZUlkO1xuICAgIH07XG4gICAgXG4gICAgXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50SWQgLSBpZCBvZiBldmVudCB0byBzdWJzY3JpYmVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIGV2ZW50IGhhbmRsZXJcbiAgICAgKiBAcmV0dXJucyB7QXV0b21hdG9ufVxuICAgICAqL1xuICAgIHRoaXMub24gPSBmdW5jdGlvbihldmVudElkLCBmbikge1xuICAgICAgICBldmVudEJ1cy5iaW5kKGV2ZW50SWQsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBcbiAgICBcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRJZCAtIGlkIG9mIGV2ZW50IHRvIHVuc3Vic2NyaWJlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gLSBldmVudCBoYW5kbGVyXG4gICAgICogQHJldHVybnMge0F1dG9tYXRvbn1cbiAgICAgKi9cbiAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uKGV2ZW50SWQsIGZuKSB7XG4gICAgICAgIGV2ZW50QnVzLnVuYmluZChldmVudElkLCBmbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IHNjaGVtYSAtIHRyYW5zaXRpb24gc2NoZW1hIG9mIGZzbSBpbnN0YW5jZVxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXRlSWQgLSBpZCBvZiBjdXJyZW50IHN0YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRJZCAtIGlkIG9mIGV2ZW50IHRvIHByb2Nlc3MgaW4gY3VycmVudCBzdGF0ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5leHRTdGF0ZShzY2hlbWEsIHN0YXRlSWQsIGV2ZW50SWQpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHNjaGVtYVtzdGF0ZUlkXTtcblxuICAgIHJldHVybiAoc3RhdGUgJiYgc3RhdGUudHJhbnNpdGlvbnMpXG4gICAgICAgID8gc3RhdGUudHJhbnNpdGlvbnNbZXZlbnRJZF0gfHwgbnVsbFxuICAgICAgICA6IG51bGw7XG59XG4iXX0=
