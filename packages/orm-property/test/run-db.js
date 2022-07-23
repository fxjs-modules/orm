const test = require('test')
test.setup()

var DBDriver  = require("@fxjs/db-driver").Driver;
var common  = require("./common");
var url     = require("url");

if (!process.env.URI) {
	console.error('no URI provided')
	process.exit(1)
}

var uri = url.parse(process.env.URI, true);

if (!uri.protocol) {
	console.error(
		'invlid URI provided: ',
		process.env.URI
	)
	process.exit(1);
}

common.dbdriver = DBDriver.create(process.env.URI);
common.dialect = common.dbdriver.type;
runTest();

process.exit(0);

function runTest () {
	require('./integration/db.callback')
	require('./integration/db')

	require('./integration/db.sync')

	test.run(console.DEBUG)

	common.dbdriver.close()
}