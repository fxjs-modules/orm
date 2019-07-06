
# orm-plugin-searchlite

[![NPM version](https://img.shields.io/npm/v/@fxjs/orm-plugin-searchlite.svg)](https://www.npmjs.org/package/@fxjs/orm-plugin-searchlite)

One simple search engine by SQLite, drop-in for `@fxjs/orm`

## Installation

```bash
fibjs --install @fxjs/orm @fxjs/orm-plugin-searchlite
```

## Usage

```javascript
const ORM = require('@fxjs/orm');
const ORMPluginSearchlite = require('@fxjs/orm-plugin-searchlite')

const orm = ORM.connectSync('mysql://localhost:3306/test');

const definitions = [
    (orm) => {
        orm.define('user', {}, {})
    },
    (orm) => {
        orm.define('role', {}, {})
    },
    (orm) => {
        orm.define('project', {}, {})
    },
    (orm) => {
        orm.define('tasks', {}, {})
    }
]

// use it to enable `orm.$pool`
orm.use(ORMPluginSearchlite, {
    // use memory-mode
    sqlite_connection: 'sqlite:'
});

orm.$sset(user)
```