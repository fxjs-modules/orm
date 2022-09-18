const test = require('test')
test.setup()

var common  = require("../common");
var Sync = require('../../').Sync;

const testDefinitions = [
	[
		'user', {
			id: { type: "serial", key: true, serial: true, mapsTo: 'userID' },
			username: { type: "text", reuqired: true },
			password: { type: "text", reuqired: true },
			created_at: { type: "datetime", defaultValue: Date.now },
			desc: { type: 'text', comment: 'desc field of user'}
		}
	],
	[
		'person', {
			id: { type: "serial", key: true, serial: true },
			age: { type: "integer" },
			email: { type: "text", size: 256 },
			phone: { type: "text", size: 32 },
			birthday: { type: "date", time: true, defaultValue: new Date('1970-01-01 00:00:00') },
			photo: { type: "binary" },
			created_at: { type: "datetime", defaultValue: Date.now },
			desc: { type: 'text', comment: 'desc field of person'}
		}
	],
	[
		'role', {
			id: { type: "serial", key: true, serial: true },
			name: { type: "text", reuqired: true },
			description: { type: "text", reuqired: true },
			created_at: { type: "datetime", defaultValue: Date.now },
			desc: { type: 'text', comment: 'desc field of role'}
		}
	],
	[
		'subject', {
			id: { type: "serial", key: true, serial: true },
			type: { type: "text", reuqired: true, index: [ "subject_idx_type_position" ] },
			position: { type: "text", reuqired: true, index: [ "subject_idx_type_position" ] },
			description: { type: "text", reuqired: true, index: [ "subject_idx_description" ] },
			created_at: { type: "datetime", defaultValue: Date.now },
			desc: { type: 'text', comment: 'desc field of subject'}
		}
	]
];

const allTables = {}
const allTableNames = testDefinitions.map(([table, props]) => {
	allTables[table] = props;

	return table
})

function realFieldIdMapper (pname, prop) {
	return prop.mapsTo || pname
}


describe(`db: Sync`, function () {
	var sync = null

	before(common.dropTable(allTableNames))

	describe("1st Syncing", function () {
		before(() => {
			sync = new Sync({
				dbdriver: common.dbdriver,
				debug   : function (text) {
					process.env.DEBUG_SYNC && console.notice("> %s", text);
				}
			});
			sync.strategy = 'hard'

			testDefinitions.forEach(([table, properties]) => {
				sync.defineCollection(table, {
					...properties
				});
			});

			sync.sync();
		});

		allTableNames.forEach(table => {
			describe(`db should have table '${table}'`, function () {
				var allColumns = Object.keys(allTables[table])
					.map(pname => [pname, realFieldIdMapper(pname, allTables[table][pname])]);

				it('table exists', () => {
					assert.equal(
						sync.Dialect.hasCollectionSync(
							sync.dbdriver,
							table
						),
						true
					)
				});

				allColumns.forEach(([colName, rname]) => {
					it(`${table} should have column '${colName}(${rname})'`, () => {
						assert.equal(
							sync.Dialect.hasCollectionColumnsSync(
								sync.dbdriver,
								table,
								rname
							),
							true
						)
					});
				});

				it(`${table} should have columns '${allColumns.map(([colName, rname]) => `${colName}(${rname})`).join("', '")}'`, () => {
					assert.equal(
						sync.Dialect.hasCollectionColumnsSync(
							sync.dbdriver,
							table,
							allColumns.map(([, rname]) => rname)
						),
						true
					)
				});

				it(`${table}'s column 'created_at' should have default value`, () => {
					const created_at = 
						sync.Dialect.getCollectionPropertiesSync(
							sync.dbdriver,
							table,
							'created_at'
						).created_at
					
					if (common.dbdriver.type === 'psql') {
						assert.equal(created_at.defaultValue, 'now()')
					} else {
						assert.equal(created_at.defaultValue, 'CURRENT_TIMESTAMP')
					}
				});
			});
		});
	});

	describe("Syncing when remote db existed", function () {
		before(() => {
			sync = new Sync({
				dbdriver: common.dbdriver,
				debug   : function (text) {
					process.env.DEBUG_SYNC && console.notice("> %s", text);
				}
			});
			sync.strategy = 'hard'

			testDefinitions.forEach(([table, properties]) => {
				sync.defineCollection(table, {
					...properties,
					updated_at: { type: "date", time: true, defaultValue: new Date() },
					expired_at: { type: "date", time: true, defaultValue: new Date() },
				});

				// sync.syncCollection(table);
				sync.sync();
			});
		});

		allTableNames.forEach(table => {
			describe(`db should have table '${table}'`, function () {
				var addedColumns = ['updated_at', 'expired_at'];

				it('table exists', () => {
					assert.equal(
						sync.Dialect.hasCollectionSync(
							sync.dbdriver,
							table
						),
						true
					)
				});

				addedColumns.forEach(colName => {
					it(`${table} should have column '${colName}'`, () => {
						assert.equal(
							sync.Dialect.hasCollectionColumnsSync(
								sync.dbdriver,
								table,
								colName
							),
							true
						)
					});
				});

				it(`${table} should have columns '${addedColumns.join("', '")}'`, () => {
					assert.equal(
						sync.Dialect.hasCollectionColumnsSync(
							sync.dbdriver,
							table,
							addedColumns
						),
						true
					)
				});

				if (common.dbdriver.type === 'sqlite') {
					it(`${table}'s column 'updated_at' have no default value`, () => {
						const props = sync.Dialect.getCollectionPropertiesSync(
							sync.dbdriver,
							table,
						)

						assert.notExist(props.updated_at.defaultValue)
						assert.notExist(props.expired_at.defaultValue)
					});
				} else {
					it(`${table}'s column 'updated_at' should have default value`, () => {
						const props = sync.Dialect.getCollectionPropertiesSync(
							sync.dbdriver,
							table,
						)

						assert.exist(props.updated_at.defaultValue)
						assert.exist(props.expired_at.defaultValue)
					});
				}

				if (common.dbdriver.type !== 'sqlite') {
					it(`${table}'s column 'desc' should has column comment`, () => {
						const props = sync.Dialect.getCollectionPropertiesSync(
							sync.dbdriver,
							table,
						)

						assert.exist(props.desc.comment)
						assert.equal(props.desc.comment, `desc field of ${table}`)
					});
				}
			});
		});
	});

	xdescribe("Syncing with modification when remote db existed", function () {
		before(() => {
			sync = new Sync({
				dbdriver: common.dbdriver,
				debug   : function (text) {
					process.env.DEBUG_SYNC && console.notice("> %s", text);
				}
			});
			sync.strategy = 'hard'

			testDefinitions.forEach(([table, properties]) => {
				sync.defineCollection(table, {
					...properties,
					id: { type: "text", key: false, serial: false },
				});

				sync.syncCollection(table);
			});
		});
	});
});

if (require.main === module) {
  test.run(console.DEBUG)
}