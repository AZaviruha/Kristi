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
                'incremet-requested' : 'increment-processing'
            },

            child: {
                initialState: 'idle',

                states: {
                    'idle': {},

                    'error': {
                        actions: {
                            coming(transition, payload) { showErrorText(); },
                            leaving(transition) { clearErrorText(); }
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
                                this.processEvent('ready.error', { errorText: err.message });
                            }
                        }); 
                },

                leaving(transition) { return Promise(); }
            },

            triggers: {
                'incremet-processed' : 'ready',
                'incremet-rejected'  : 'ready.error',
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
