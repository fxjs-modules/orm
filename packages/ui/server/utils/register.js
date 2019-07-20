const fxHandbag = require('@fxjs/handbag')
const events = require('events')

exports.registerAsJavascript = (vbox, options) => {
    const { suffix = ['.b.jsx'], ...restOptions } = options || {}
    
    const emitter = new events.EventEmitter();
    if (restOptions.hooks) {
        Object.keys(restOptions.hooks).forEach(hookName => {
            emitter.on(hookName, restOptions.hooks[hookName])
        })

        delete restOptions.hooks
    }
    
    fxHandbag.vboxUtils.setCompilerForVbox(vbox, {
        ...restOptions,
        emitter,
        suffix,
        compile_to_iife_script: false,
        compiler: (buf, info) => {
            buf = (buf ? buf + '' : '').trimLeft()
            const EXPORT_STR = 'module.exports =';
            if (!buf.startsWith(EXPORT_STR)) {
                buf = "module.exports = exports = {};" + buf;
            }

            return buf;
        }
    })
}