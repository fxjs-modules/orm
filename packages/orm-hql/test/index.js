const test = require('test');
test.setup();

require('./integration/parser');
require('./integration/use-js-api');

test.run(console.DEBUG);
