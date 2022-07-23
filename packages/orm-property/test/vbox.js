const vm = require('vm')

const vbox = new vm.SandBox({}, name => require(name))

const entry = process.env.ENTRY

const abspath = require.resolve(entry, __dirname)

vbox.add({
    [`${require.resolve('../lib')}`]: require(abspath)
})

vbox.run(require.resolve('./run'))