const test = require('test')
test.setup()

require('./integration/basic')
require('./integration/sql')

require('./integration/mysql')
require('./integration/sqlite')

if (process.env.URI)
    require('./integration/db')

test.run(console.DEBUG)