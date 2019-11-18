## Concepts

ORM(Object Relation Model) aimed to resolve modeling for entity in business/transaction. It's one **lightweight**, **event-driven** and **pluggable** framework, which provided a series of **extension points**, **injection points**

### Connection

For ORM, connection is one-time, every orm instance bound one connection only, never conflict or confuse with other connections.

Fibjs provided some drivers for popular database: mysql, mssql(win32 only), sqlite, mongodb, redis. View [Details](http://fibjs.org/en/docs/manual/object/ifs/dbconnection.md.html). There're others official drivers for [http-rest], [websocket], [github]. ORM use plugin-in to work along with those drivers.

### Model

Model is one abstraction/map of a kind of entity.

When generated, one Model inherits some settings from ORM, but then every model maintained it's only setting.

This is simple model definition of `animal`:

```javascript
orm.define('animal', {
  age: {
    type: 'text',
    defaultValue: null
  },
  class_id: {
    // not standara field type
    type: 'biology:uuid',
  },
  address: {
    type: 'text',
    defaultValue: null
  },
  age: {
    type: 'integer',
    defaultValue: 0
  }
}, {
  // specify setting's initial value for this model
  settings: {...}
});
```

### Instance

Model-Instance represents one entity modeled by one Model. Model-Instance interactive straight with remote endpoints(HTTP, SQL, NoSQL, etc)

### Stages

There are 3 main stages in one orm's normal workflow:

- **connect**: use connection to keep alive with remote endpoints.
- **processing**: query, alert, delete data from remote endpoints, you can ALWAYS get one result in this stage
  - success: result of your processing dependent on action-type and remote endpoints.
  - failure: all failure in this process would be catch and thrown.
- **clean**: close connection, and do others things if cutomized.

### Hook

There are one extension point in one orm's instance(not Model-Instance!):

- `before_connect`
  - snapshot.connect_options: [`UrlObject`]
- `after_connect`
  - snapshot.connect_options: [`UrlObject`]
  - snapshot.connection: [`DbConnection`]

- `before_query`
  - context.uuid: `string`
  - context.type: `'get-one'` | `'find'` | `'aggregation'` | `'generate-view'` | `'search'`
  - context.conditions:
    - join_ons: `Array`
      - type: `'left'` | `'leftOuter'` | `'right'` | `'rightOuter'` | `'fullOuter'` | `'inner'`
      - from: `string`
      - to: `string`
    - limit: `number`
    - order_by: `'asc'` | `'desc'`
    - where: `WhereCondition`
- `after_query`
  - context.uuid: `string`
  - context.type: `'get-one'` | `'find'` | `'aggregation'` | `'generate-view'` | `'search'`
  - context.result: `any`

[`UrlObject`]:http://fibjs.org/en/docs/manual/object/ifs/urlobject.md.html
[`DbConnection`]:http://fibjs.org/docs/manual/object/ifs/dbconnection.md.html
