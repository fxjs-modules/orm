A hasOne association is a many-to-one relationship, which means that a model you define can have several instances pointing to one other instance (from the same model or another model).

### Usage

```js
Animal.hasOne(association_name [, association_model [, options ] ]);
```

### Description

- `association_name` is the relationship name between the two models;
- `association_model` is the other model to relate with (if not defined, it assumes the same model, which in most cases is not what you want);
- `options` is an object with several things you can tweak about the association, like for example automatic fetching or even the table name (in case of SQL) or collection (in case of MongoDB).

### Example

```js
Animal.hasOne("owner", Person);
```

In the backstage, what this means is that the `Animal` collection will have a property `owner_id` (this name can be changed in the options, `{field: 'ownerid'}`) that will point the someone in the `Person` collection. If can be empty if the association is not required.

This association also creates some additional convenience methods (called association accessors) to help managing this association. The accessor names can be changed (again.. in the options), and by default they assume similar names based on the association name. For instance, looking at the above example you can do something like this:

```js
// assuming John is a Person..
Animal.find({ name: "Deco" }).first(function (err, Deco) {
    Deco.setOwner(John, function (err) {
        // John is now the owner of Deco
    });
});
```

There are more accessors:

- `getOwner(callback)` - get the associated owner
- `hasOwner(callback)` - return (in the callback) if the animal has an owner or not
- `removeOwner(callback)` - remove association with owner (if exists)

## Reverse Association

Sometimes you want to be able to access an association from the opposite model. In the case of the example above, from the `Person`. You can do this by passing an option to the association.

```js
Animal.hasOne('owner', Person, { reverse: "pets" });
```

After this, every person has now 2 convenience methods:

- `getPets(callback)` - get all animals associated with the person
- `setPets(cat, dog, callback)` - clear all animals associated with the person and then add cat and dog