const vm = require('vm')

const vbox = new vm.SandBox({}, name => require(name))

const suffix = process.env.ENTRY_SUFFIX || ''

vbox.add({
    [`${require.resolve('../lib')}`]: require(`../lib/index${suffix}`)
})

vbox.run(require.resolve('./run'))