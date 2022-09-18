const test = require('test');
test.setup();

;[
    [0, { ENTRY: '../lib/index.js', URI: 'sqlite:test.db?debug_sql=no' }],
    process.env.TEST_MYSQL && [ 0, { ENTRY: '../lib/index.js', URI: 'mysql://root@localhost:3306?debug_sql=no' }],
    // process.env.TEST_MYSQL && [ 0, { ENTRY: '../lib/index.js', URI: 'mysql://root@localhost:3380?debug_sql=no' }],
    // process.env.TEST_MYSQL && [ 0, { ENTRY: '../lib/index.js', URI: 'mysql://root@localhost:3356?debug_sql=no' }],
    // process.env.TEST_MYSQL && [ 0, { ENTRY: '../lib/index.js', URI: 'mysql://root@localhost:3357?debug_sql=no' }],
    process.env.TEST_PSQL && [ 0, { ENTRY: '../lib/index.js', URI: 'postgres://postgres@localhost:5432?debug_sql=no' } ],
].filter(Boolean).forEach(([ep, envs]) => {
    const result_p = require('child_process').run(
        process.execPath,
        [
            require.resolve('./vbox')
        ], {
        env: envs
    })

    assert.equal(result_p, ep)
})