let fsm = Automaton({
    /**
     * Метод, который будет вызван первым, при `fsm.run()`.
     * Этод метод отработает только один раз за все время
     * жизни FSM. 
     * Метод идемпотентный, т.е. многократный вызов будет возвращать
     * одну и ту же отрезолвленную Promise.
     */
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
                'increment-processed' : 'ready', // equals to 'ready.idle'
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
