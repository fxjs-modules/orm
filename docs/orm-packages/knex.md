# `@fxjs/knex`

[![NPM version](https://img.shields.io/npm/v/@fxjs/knex.svg)](https://www.npmjs.org/package/@fxjs/knex)&nbsp;
[![NPM download](https://img.shields.io/npm/dt/@fxjs/knex.svg)](https://www.npmjs.org/package/@fxjs/knex)&nbsp;
[![NPM download monthly](https://img.shields.io/npm/dm/@fxjs/knex.svg)](https://www.npmjs.org/package/@fxjs/knex)

[knex.js]:https://knexjs.org/

[knex.js] 是 node.js 生态中热门的 sql generator 库. 可以通过语义化的 API 生成 sql 语句.

`@fxjs/knex` 是对 [knex.js] 的移植. 基于 fibjs 的沙盒机制, 我们将 [knex.js] 2.3.0 的能力引入到了 fibjs 中.

## Sample

```js
var FibKnex  = require("@fxjs/knex");

function getFibKnexInstance (driverType) {
    switch (driverType) {
        default:
            break
        case 'mysql':
            driverType = 'mysql2'
            break
        case 'psql':
            driverType = 'pg'
            break
    }

    return FibKnex({
        ...opts,
        client: driverType,
        // useNullAsDefault: true
    })
}

var sql = getFibKnexInstance('mysql').schema.createTable('users', function (table) {
    table.increments();
    table.string('name');
    table.timestamps();
}).toString()
// => CREATE TABLE `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(255), `created_at` DATETIME, `updated_at` DATETIME)
```

更多 knex 的使用可参考[测试用例](https://github.com/fxjs-modules/orm/blob/eed98f97895094dd5a3fa0f0ab05fd360f500211/packages/knex/test/mysql.js)
