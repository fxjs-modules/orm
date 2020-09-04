Object.defineProperty(exports, "__esModule", { value: true });
exports.throwErrOrCallabckErrResult = exports.exposeErrAndResultFromSyncMethod = void 0;
exports.exposeErrAndResultFromSyncMethod = function (exec, args = [], opts) {
    let error, result;
    const { thisArg = null } = opts || {};
    try {
        result = exec.apply(thisArg, args);
    }
    catch (ex) {
        error = ex;
    }
    return { error, result };
};
exports.throwErrOrCallabckErrResult = function (input, opts) {
    const { use_tick = false, callback = null, } = opts || {};
    const { no_throw = false } = opts || {};
    if (!no_throw && input.error)
        throw input.error;
    if (typeof callback === 'function')
        if (use_tick)
            process.nextTick(() => {
                callback(input.error, input.result);
            });
        else
            callback(input.error, input.result);
};
