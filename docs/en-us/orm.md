# ORM


## API

### ORM.connect

```js
var { connect } = require('@fxjs/orm')

var orm = connect(`mysql://root@localhost:3306/mydb`)

// equivalent to
var orm = connect({
  protocol: 'mysql://',
  slashes: true,
  username: 'root',
  password: '',
  hostname: 'localhost',
  port: '3306',
  path: '/mydb',
})
```

### ORM::close

close connection bound to orm.

```javascript
orm.close()
```

### ORM::sync/ORM::drop

execute all models `.sync`/`.drop` in order.
```javascript
// synchronize model's definition to remote
orm.sync()

// drop model in remote
orm.drop()
```

## Advanced API

<!-- ### readonly ORM::driver -->

### readonly ORM::models

```ts
readonly models: {[k: string]: FxOrmModel.Class_Model}
```

### readonly ORM::modelDefinitions

```ts
readonly modelDefinitions: {
    [k: string]: (orm: FxOrmNS.Class_ORM, ...args: any) => FxOrmModel.Class_Model
}
```

### readonly ORM::customPropertyTypes

```ts
readonly customPropertyTypes: {[k: string]: FxOrmProperty.CustomPropertyType}
```
