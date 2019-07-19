const path = require('path');
const builtinModules = require('@fibjs/builtin-modules')

const { default: rollup, plugins } = require('fib-rollup')

const commonjs = require('rollup-plugin-commonjs');

// yes, just use top-level await!
// get rollup instance `bundle`
const bundle = await rollup.rollup({
    input: path.resolve(__dirname, './lib/index.js'),
    external: builtinModules.concat([
        'module'
    ]),
    plugins: [
        plugins['rollup-plugin-fibjs-resolve'](),
        commonjs(),
        plugins['rollup-plugin-uglify-es']()
    ]
}).catch(e => console.error(e.stack));

// write bundled result with `bundle.write`
await bundle.write({
    file: path.resolve(__dirname, './lib/index.cjs.js'),
    format: 'cjs'
}).catch(e => console.error(e));