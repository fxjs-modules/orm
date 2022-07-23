const test = require('test')
test.setup()

require('./integration/basic')

require('./integration/transformer-mysql')
require('./integration/transformer-sqlite')
require('./integration/transformer-postgresql')

test.run(console.DEBUG)