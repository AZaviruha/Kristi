module.exports = {
    initialState: 'A',
 
    states: {
        'A': {
            child: {
                initialState: 'A-1',

                states: {
                    'A-1': {},

                    'A-2': {
                        child: {
                            initialState: 'A-2-1',

                            states: {
                                'A-2-1': {},
                                'A-2-2': {}
                            }
                        }
                    }
                }
            }
        },

        'B': {
            child: {
                initialState: 'B-2',

                states: {
                    'B-1': {},

                    'B-2': {
                        child: {
                            initialState: 'B-2-2',

                            states: {
                                'B-2-1': {},
                                'B-2-2': {}
                            }
                        }
                    }
                }
            }
        },
    }
};
