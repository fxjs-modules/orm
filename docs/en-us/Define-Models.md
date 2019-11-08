## Define models

After connection, you can use the connection object (`db`) to define your models. You need to specify the name of the model, a specification of the properties and options (optional). Here's a small example:

```js
var Person = db.define('person', {
  id:      {type: 'serial', key: true}, // the auto-incrementing primary key
  name:    {type: 'text'},
  surname: {type: 'text'},
  age:     {type: 'number'}
}, {
  methods : {
    fullName: function() {
      return this.name + ' ' + this.surname;
    }
  }
});
```

The model is called `person` (which is usually the name of the collection in the remote-endpoint), it has 3 properties (name, surname as text, age as number). A default `id: { type: 'serial', key: true }` property is added if you don't specify any keys yourself.
In this example there is a model method called `fullName`. Here's an example of the usage of this model:

```js
Person.get(73, function(err, person) {
  if (err) throw err;

  console.log('Hi, my name is ' + person.fullName());
});
```

This would get person with `id=73` and print it's name and surname. There are other types of [properties available](Model Properties).

### API
```js
/**
 * @param {Object} props Property definitions
 * @param {Object} opts Options
 */
db.define(props, opts)
```

The first object accepted by `db.define()` is referred to as the properties object. It defines all the [properties](https://github.com/dresende/node-orm2/wiki/Model-Properties).<br/>
The second specifies extra options:

| option name   | type        | description
|:--------------|:------------|:-----------
|collection     | String      | Lets you overwrite the collection name in the remote-endpoint.
|methods        | Object      | Extra methods to create on model instances. Called with `this` set to the instance.
|hooks          | Object      | User defined [hooks/callback](https://github.com/dresende/node-orm2/wiki/Model-Hooks).
|validations    | Object      | User defined [validations](https://github.com/dresende/node-orm2/wiki/Model-Validations)
|id             | Array       | Deprecated in favour of setting `key: true` on properties.
|identityCache  | Boolean     | Allows you to enable/disable identity cache.
|cascadeRemove  | Boolean     | If auto remove ref instance for association
