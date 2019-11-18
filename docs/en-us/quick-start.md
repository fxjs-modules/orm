## Quick Start

### Fast Modeling & Find
```javascript
const ORM = require('@fxjs/orm')

const orm = ORM.define('sqlite:mydb.db')

var Person = orm.define('person', {
  username: String,
  surname: { type: 'text', size: 8 },
  gender: ['male', 'female', 'other']
  age: { type: 'integer', defaultValue: 0 }
});

var PersonRole = orm.define('role', {
  name: String,
  description: String,
}, {
  collection: 'person_role'
});

/**
 * create if db has no tables `person`, `person_role`
 */
orm.sync()

Person.create([
  { username: 'xicilion', surname: 'Hu Lau', gender: 'male', age: 18 },
  { username: 'ngot', surname: 'Henry Zhuang', gender: 'male', age: 16 },
])

PersonRole.create([
  { name: 'Creator', description: 'One creator of project' },
  { name: 'Contributor' description: 'contributors for one project' },
])

Person.find({
  where: {
    // restrain items only age > 1
    age: Person.Opf.gt(1)
  }
})
```

We connected to SQLite db file `mydb.db`, model two collections(tables) quickly, add some data into database, then try to find data matching where conditions.

Learn about [Conceptions](en-us/Concepts) in ORM
