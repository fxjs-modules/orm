
# orm-plugin-pool

[![NPM version](https://img.shields.io/npm/v/@fxjs/orm-plugin-pool.svg)](https://www.npmjs.org/package/@fxjs/orm-plugin-pool)

Pool Plugin for `@fxjs/orm`

## Installation

```bash
fibjs --install @fxjs/orm @fxjs/orm-plugin-pool
```

## Usage

```javascript
const ORM = require('@fxjs/orm');
const ORMPluginPool = require('@fxjs/orm-plugin-pool')

const definitions = [
    (orm) => {
        orm.define('user', {}, {})
    },
    (orm) => {
        orm.define('role', {}, {})
    }
]

const pool = ORM.getPool({
    connection: 'sqlite:test.db',
    definitions: definitions,

    maxszie: 10,
    timeout: 1000,
    retry: 3
});

pool(orm => {
    orm.user.createSync({/* ... */})
});
```

or use it as plugin

```javascript
const ORM = require('@fxjs/orm');
const ORMPluginPool = require('@fxjs/orm-plugin-pool')

const orm = ORM.connectSync('sqlite:test.db');

// use it to enable `orm.$pool`
orm.use(ORMPluginPool, {
    definitions: definitions,
    maxszie: 10,
    timeout: 1000,
    retry: 3
});

orm.$pool(orm => {
    orm.user.createSync({/* ... */})
})
```