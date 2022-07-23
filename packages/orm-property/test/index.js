const test = require('test');
test.setup();

;[
    [0, { ENTRY: '../lib/index.js',        URI: 'sqlite:test.db' }],
    // [0, { ENTRY: '../dist/index.js',       URI: 'sqlite:test.db' }],
    // [0, { ENTRY: '../dist/index.min.js',   URI: 'sqlite:test.db' }],
].forEach(([ep, envs]) => {
    const result_p = require('child_process').run(
        process.execPath,
        [
            require.resolve('./vbox')
        ], {
        env: envs
    })

    assert.equal(result_p, ep)
})