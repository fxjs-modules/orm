If you want to split maybe optional properties into different tables or collections. Every extension will be in a new table,
where the unique identifier of each row is the main model instance id. For example:

```js
var Person = db.define("person", {
    name : String
});
var PersonAddress = Person.extendsTo("address", {
    street : String,
    number : Number
});
```

This will create a table `person` with columns `id` and `name`. The extension will create a table `person_address` with
columns `person_id`, `street` and `number`. The methods available in the `Person` model are similar to an `hasOne`
association. In this example you would be able to call `.getAddress(cb)`, `.setAddress(Address, cb)`, ..

**Note:** you don't have to save the result from `Person.extendsTo`. It returns an extended model. You can use it to query
directly this extended table (and even find the related model) but that's up to you. If you only want to access it using the
original model you can just discard the return