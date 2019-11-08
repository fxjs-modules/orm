The module [Enforce](http://github.com/dresende/node-enforce) is used for validations. For people using previous validators,
they're still present, some as links to enforce, others not. We advise you to start using `orm.enforce` instead of `orm.validators`.
For a list of possible validations, consult the [module](http://github.com/dresende/node-enforce).

There's also a `unique` validator built into ORM accessible via:
```js
name: orm.enforce.unique("name already taken!")
name: orm.enforce.unique({ scope: ['age'] }, "Sorry, name already taken for this age group")
name: orm.enforce.unique({ ignoreCase: true }) // 'John' is same as 'john' (mysql is case insensitive by default)
```

You can define validations for every property of a Model. You can have one or more validations for each property.
You can also use the predefined validations or create your own.

```js
var Person = db.define("person", {
	name : String,
	age  : Number
}, {
	validations : {
		name : orm.enforce.ranges.length(1, undefined, "missing"), // "missing" is a name given to this validation, instead of default
		age  : [ orm.enforce.ranges.number(0, 10), orm.enforce.lists.inside([ 1, 3, 5, 7, 9 ]) ]
	}
});
```

The code above defines that the `name` length must be between 1 and undefined (undefined means any) and `age`
must be a number between 0 and 10 (inclusive) but also one of the listed values. The example might not make sense
but you get the point.

When saving an item, if it fails to validate any of the defined validations you'll get an `error` object with the property
name and validation error description. This description should help you identify what happened.

```js
var John = new Person({
	name : "",
	age : 20
});
John.save(function (err) {
	// err.field = "name" , err.value = "" , err.msg = "missing"
});
```

The validation stops after the first validation error. If you want it to validate every property and return all validation
errors, you can change this behavior on global or local settings:

```js
var orm = require("orm");

orm.settings.set("instance.returnAllErrors", true); // global or..

orm.connect("....", function (err, db) {
	db.settings.set("instance.returnAllErrors", true); // .. local

	// ...

	var John = new Person({
		name : "",
		age : 15
	});
	John.save(function (err) {
		assert(Array.isArray(err));
		// err[0].property = "name" , err[0].value = "" , err[0].msg = "missing"
		// err[1].property = "age"  , err[1].value = 15 , err[1].msg = "out-of-range-number"
		// err[2].property = "age"  , err[2].value = 15 , err[2].msg = "outside-list"
	});
});
```