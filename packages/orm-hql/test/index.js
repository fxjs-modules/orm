const test = require('test');
test.setup();

require('./integration/parser');

test.run(console.DEBUG);