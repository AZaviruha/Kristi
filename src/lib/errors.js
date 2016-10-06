
export const ERRORS = {
    ENOINITIALSTATE: {
        code    : 'ENOINITIALSTATE',
        message : 'Initial state is not defined'
    },

    // ENOTRUNNED: {
    //     code    : 'ENOTRUNNED',
    //     message : 'Automaton is not runned'
    // },

    // EALREADYRUNNED: {
    //     code    : 'EALREADYRUNNED',
    //     message : 'Automaton already runned'
    // },

    // ECANTBEPROCESSED: {
    //     code    : 'ECANTBEPROCESSED',
    //     message : (eventId, stateId) => `Event "${eventId}" can't be processed in state "${stateId}"`
    // },

    ESTATENOTEXISTS: {
        code    : 'ESTATENOTEXISTS',
        message : (stateId) => `State "${stateId}" does not exist`
    },

    // EQUEUEDFAILED: {
    //     code    : 'EQUEUEDFAILED',
    //     message : (eventId, stateId) => `Queued event "${eventId} could not be processed in the target state "${stateId}"`
    // }

};

export function error({ code, message }, ...args) {
    let msg = (typeof message === 'function')
        ? message.apply(null, args)
        : message;

    let err = new Error(msg);

    err.code = code;
    return err;
}
