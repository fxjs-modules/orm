#!/usr/bin/env fibjs

var test = require("test");
test.setup();

describe('orm-migrator', () => {
    require('./intergrations/dsl');
    
    require('./intergrations/migrator');
})

test.run(console.DEBUG);
process.exit();