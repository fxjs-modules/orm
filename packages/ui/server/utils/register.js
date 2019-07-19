const fxHandbag = require('@fxjs/handbag')
const events = require('events')

exports.registerAsJavascript = (vbox, options) => {
    const { suffix = ['.b.jsx'], ...restOptions } = options || {}
    
    const emitter = new events.EventEmitter();
    if (restOptions.hooks) {
        Object.keys(restOptions.hooks).forEach(hookName => {
            // console.log(
            //     'hookName',
            //     hookName,
            //     restOptions.hooks[hookName]
            // );
            emitter.on(hookName, restOptions.hooks[hookName])
        })

        delete restOptions.hooks
    }
    
    fxHandbag.vboxUtils.setCompilerForVbox(vbox, {
        ...restOptions,
        emitter,
        suffix,
        compiler: (buf, info) => buf
    })
}