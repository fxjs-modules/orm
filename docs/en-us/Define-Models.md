## Define models

**After** connection, you can use the orm object (`orm`) to define your models. You need to specify the name of the model, a specification of the properties and options (optional). Here's a small example:

```js
var Person = orm.define('person', {
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
In this example there is a model method called `fullName`.

Here's an example of the usage of this model:

```js
// if error occured, typed-error would be thrown.
var person = Person.get(73);

console.log('Hi, my name is ' + person.fullName());
```

This would get person with `id=73` and print it's name and surname. There are other types of [properties available](en-us/Property).

### API

### define
```javascript
/**
 * @param {string} name model name
 * @param {Object} props Property definitions
 * @param {Object} opts Options
 */
orm.define(props, opts)
```

The second object accepted by `orm.define()` is referred to as the properties object. It defines all the [properties](en-us/Property).<br/>
The 3rd specifies extra options:

| option name   | type        | description
|:--------------|:------------|:-----------
|collection     | String      | Lets you overwrite the collection name in the remote-endpoint.
|methods        | Object      | Extra methods to create on model instances. Called with `this` set to the instance.
|hooks          | Object      | User defined [hooks/callback](https://github.com/dresende/node-orm2/wiki/Model-Hooks).
|validations    | Object      | User defined [validations](https://github.com/dresende/node-orm2/wiki/Model-Validations)
|id             | Array       | Deprecated in favour of setting `key: true` on properties.
|identityCache  | Boolean     | Allows you to enable/disable identity cache.
|cascadeRemove  | Boolean     | If auto remove ref instance for association


### defineType
```javascript
/**
 * @param {Object} name Property name
 * @param {Object} opts
 * @param          opts.datastoreType
 * @param          opts.valueToProperty
 * @param          opts.propertyToStoreValue
 */
orm.defineType(name, opts)
```

| option name   | type        | description
|:--------------|:------------|:-----------
|datastoreType     | `(prop?: FxOrmProperty.Class_Property, opts?: { collection: string driver: FxDbDriverNS.Driver<any> }) => string` | Return Store Type in Remote
|valueToProperty   | `(value?: any, prop?: FxOrmProperty.Class_Property) => any` | determine the way transform **raw input** to property value
|propertyToStoreValue     | `(propertyValue?: any, prop?: FxOrmProperty.Class_Property) => any` | determine the way transform **property value** to store value

**sample**

```javascript
orm.defineType('numberArray', {
  datastoreType: function (prop) {
      return 'TEXT'
  },
  valueToProperty: function (value, prop) {
      if (Array.isArray(value)) {
          return value;
      } else {
          if (Buffer.isBuffer(value))
              value = value.toString();
          return value.split(',').map(function (v) {
              return Number(v);
          });
      }
  },
  propertyToStoreValue: function (value, prop) {
      return value.join(',')
  }
});

// use it
var LottoTicket = orm.define('lotto_ticket', {
    numbers: {
        type: 'numberArray'
    }
});
```
