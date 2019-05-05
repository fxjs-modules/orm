const fs = require('fs')
const path = require('path')
const util = require('util')

const typify = require('fib-typify')
typify.compileDirectoryTo(
    path.resolve(__dirname, './src'),
    path.resolve(__dirname, './lib'),
)

if (util.buildInfo().fibjs >= '0.26.0') {
    process.run(process.execPath, ['rollup.build.js'])
} else {
    fs.copy(
        require.resolve('./lib/index.js'),
        path.resolve('./lib/index.cjs.js')
    )
}

    