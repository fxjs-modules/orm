const vm = require('vm')

const vbox = new vm.SandBox({}, name => {
    try {
        return require(name)
    } catch (e) {
        console.error(`require error for ${name}`)
        console.error(e)
    }
})

const entry = process.env.ENTRY

const abspath = require.resolve(entry, __dirname)

vbox.add({
    [`${require.resolve('../lib')}`]: require(abspath)
})

vbox.run(require.resolve('./run'))