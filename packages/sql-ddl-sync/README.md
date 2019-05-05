## Fibjs SQL DDL Synchronization

[![NPM version](https://img.shields.io/npm/v/@fxjs/sql-ddl-sync.svg)](https://www.npmjs.org/package/@fxjs/sql-ddl-sync)
[![Build Status](https://travis-ci.org/fxjs-modules/sql-ddl-sync.svg)](https://travis-ci.org/fxjs-modules/sql-ddl-sync)
[![Build status](https://ci.appveyor.com/api/projects/status/plarvl262d7279c3?svg=true)](https://ci.appveyor.com/project/richardo2016/sql-ddl-sync)

**NOTICE**: This is [node-sql-ddl-sync]'s fibjs version, thx a lot to [node-sql-ddl-sync]'s author : )

## Install

```sh
npm install @fxjs/sql-ddl-sync
```

## Dialects

- MySQL
- PostgreSQL

## About

This module is part of [@fxjs/orm](https://github.com/fxjs-modules/orm). It's used synchronize model tables in supported dialects.
Sorry there is no API documentation for now but there are a couple of tests you can read and find out how to use it if you want.

## Example

Install `@fxjs/orm`. Create a file with the contents below and change insert your database credentials.
Run once and you'll see table `ddl_sync_test` appear in your database. Then make some changes to it (add/drop/change columns)
and run the code again. Your table should always return to the same structure.

```js
var ORM   = require("@fxjs/orm");
var mysql = require("mysql");
var Sync  = require("@fxjs/sql-ddl-sync").Sync;

ORM.connect("mysql://username:password@localhost/database", function (err, db) {
	if (err) throw err;
	var driver = db.driver;

	var sync = new Sync({
		dialect : "mysql",
		driver  : driver,
		debug   : function (text) {
			console.log("> %s", text);
		}
	});

	sync.defineCollection("ddl_sync_test", {
		id     : { type: "serial", key: true, serial: true },
		name   : { type: "text", required: true },
		age    : { type: "integer" },
		male   : { type: "boolean" },
		born   : { type: "date", time: true },
		born2  : { type: "date" },
		int2   : { type: "integer", size: 2 },
		int4   : { type: "integer", size: 4 },
		int8   : { type: "integer", size: 8 },
		float4 : { type: "number",  size: 4 },
		float8 : { type: "number",  size: 8 },
		photo  : { type: "binary" }
	});

	sync.sync(function (err) {
		if (err) {
			console.log("> Sync Error");
			console.log(err);
		} else {
			console.log("> Sync Done");
		}
		process.exit(0);
	});
});

```
## Test

To test, first make sure you have development dependencies installed. Go to the root folder and do:

```sh
npm install
```

Then, just run the tests.

```sh
npm test
```

If you have a supported database server and want to test against it, first install the module:

And then run:

```sh
URI=mysql://username:password@localhost/database fibjs test/run-db
```

## Credits

This repo is checked out from [Diogo Resende]'s [node-sql-ddl-sync], which is one part of `orm`, and orm is the original source of `@fxjs/orm`. Thx a lot to him and his partner.


[Diogo Resende]:dresende@thinkdigital.pt
[node-sql-ddl-sync]:./README_orig.md