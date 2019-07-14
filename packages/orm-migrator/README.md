
## orm-migrator

### Usage

#### Cli

```bash
# generate 
orm-migrate generate ./task_1.js

# run
orm-migrate run ./task_1.js
```

#### Via Javascript
```javascript
const ORM         = require('@fxjs/orm');
const { Plugin } = require('@fxjs/orm-migrator');

const orm = ORM.connect(connectionString);

orm.use(Plugin)

// generate js task
orm.migrator.generateTask('createTable', './task_1.js');

orm.migrator.runTask('./task_1.js');
```

### Task

**Task** is minimal process unit in **Migrator**, on Task contains:
- **up**: what to do when task executed
- **down**: what to do if task failed in **up**
- **finally**: what to do when task finished whatever its result is

One sample for creating table by `.js` like this:

```javascript
exports.up = ({ dsl }) => {
    dsl.createTable('test_table', {
        // should be standard columns definitions for @sql/sql-query
        id     : { type : "serial", key: true },
        name   : { type : "text", required: true }
    })
}

exports.down = ({ dsl }) => {
    dsl.dropTable('test_table')
}
```

One sample for building index:

```javascript
exports.up = ({ dsl }) => {
    dsl.addIndex('agency_email_idx', {
        table: 'agency',
        columns: ['email'],
        unique: true
    }, next);
}

exports.down = ({ dsl }) => {
    dsl.dropIndex('agency_email_idx', 'agency');
}
```

All methods in dsl:

- createTable
- dropTable
- addColumn
- dropColumn
- addIndex
- dropIndex
- addPrimaryKey
- dropPrimaryKey
- addForeignKey
- dropForeignKey
- execQuery

you can see details in [@types/dsl.d.ts](./@types/dsl.d.ts)

## TODOs

### Features

- [ ] migration task generate
    - [ ] .js
    - [ ] .js (by babel)

- [ ] migration task
    - [ ] up
    - [ ] down
    - [ ] backup

### Other

## Draft Todos