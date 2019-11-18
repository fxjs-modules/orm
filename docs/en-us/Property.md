## Property

Models and some associations can have one or more properties. Every property has a type and a couple of optional settings you can choose (or leave the default).

```js
// one normalized proeprty
{
  name: 'username'
  type: 'text',
  key: false
  mapsTo: 'username'
  unique: true,
  index: true,
  serial: false,
  unsigned: true,
  primary: false,
  required: true
  defaultValue: undefined,
  size: undefined,

  time: false,
  big: false,
  values: []
  lazyload: false,
  lazyname: 'username',
  enumerable: true,
  joinNode: {
    refColumn: '',
    refCollection: undefined,
  }
}
```

### Property Meta

all-type properties support meta info below:

- `name` (`string`, _required_) name of property
- `mapsTo` (`string`, _required_) mapping property to differently named database columns
- `required` (`boolean`, default: `false`) if property requird
- `serial` (`boolean`, default: `false`) if property auto-increament
- `primary` (`boolean`, default: `false`) if property is primary in remote endpoints(in SQL-like: MySQL, SQLite)
- `key` (`boolean`, default: `false`) if property is key in remote endpoints(in SQL-like: MySQL, SQLite)
- `unique` (`boolean`, default: `false`) if property is unique in remote endpoints(in SQL-like: MySQL, SQLite)
- `defaultValue` (`string` | null) defaultValue of property when generated

Some type has its specific meta:

##### { "type": "text" }
  - `size` (`number`, _required_, default: `4`) maxium size of string
  - `big` (`boolean`, default: `false`) for very long strings

##### { "type": "number" }
  - `size` (`number`, default: `4`) byte size
  - `unsigned` (`boolean`, default: `false`) if property is unsigned

##### { "type": "date" }
  - `time` (`boolean`, default: `false`) if date type has time

<!-- **Note that 8 byte numbers [have limitations](http://stackoverflow.com/questions/307179/what-is-javascripts-max-int-whats-the-highest-integer-value-a-number-can-go-t).** -->


### Types

Built-in types:

- `text`: A text string;
- `number`: A floating point number. You can specify `size: 2|4|8`.
- `integer`: An integer. You can specify `size: 2|4|8`.
- `boolean`: A true/false value;
- `date`: A date object. You can specify `time: true`
- `enum`: A value from a list of possible values;
- `object`: A JSON object;
- `point`: A N-dimensional point (not generally supported);
- `binary`: Binary data.
- `serial`: Auto-incrementing integer. Used for primary keys.

Each type can have additional options. Here's a model definition using most of them:

```js
var Person = orm.define("person", {
	name    : { type: "text", size: 50 },
	surname : { type: "text", defaultValue: "Doe" },
	male    : { type: "boolean" },
	vat     : { type: "integer", unique: true },
	country : { type: "enum", values: [ "USA", "Canada", "Rest of the World" ] },
	birth   : { type: "date", time: false }
});
```

### Smart Type

If you're using default options, you can use native types as abbreviated types:

```js
var Person = orm.define("person", {
  // equivelant to {"type": "text"}
	name    : String,
  // equivelant to {"type": "boolean"}
	male    : Boolean,
  // equivelant to {"type": "number"}
	vat     : Number,
  // equivelant to {"type": "date"}
	birth   : Date,
  // equivelant to {"type": "enum", values: [...]}
	country : [ "USA", "Canada", "Rest of the World" ],
  // equivelant to {"type": "binary"}
	meta    : Object,
  // equivelant to {"type": "binary"}
	photo   : Buffer,
});

```

### mapsTo

Mapping ORM fields to differently named database columns

```js
var Person = orm.define("person", {
	name    : { type: 'text', mapsTo: 'fullname' }
});
```

ORM property `name` maps to person table column `fullname`.

### Custom types

Just customize when defining orm's property:

```js
orm.define('user', {
  username: String,
  email: String,
  avatar_url: {
    type: 'text',
    // This is optional
    valueToProperty (rawValue, property) {
      if (!rawValue && !property.required)
        return null

      return rawValue
    },
    // This is also optional
    propertyToStoreValue (propertyValue, property) {
      if (!value && !property.required) {
        return ''
      }

      return propertyValue
    }
  },
  profile_id: {
    type: 'integer',
    propertyToStoreValue (propertyValue, property) {
      if (orm.models.profile.isInstance(propertyValue))
        return rawValue.id

      return 0
    }
  }
})

The specifications:

- `valueToProperty (rawValue: any, property: Class_Property)`: transform any input value to
```

#### ORM-customized type

You can add your own types to ORM like so:

```js
orm.defineType('numberArray', {
  datastoreType: function(prop) {
    return 'TEXT'
  },
  // This is optional
  valueToProperty: function(value, prop) {
    if (Array.isArray(value))
      return value;

    return value.split(',').map(function (v) {
      return Number(v);
    });
  },
  // This is also optional
  propertyToStoreValue: function(value, prop) {
    return value.join(',')
  }
});

var LottoTicket = orm.define('lotto_ticket', {
  numbers: { type: 'numberArray' }
});
```
