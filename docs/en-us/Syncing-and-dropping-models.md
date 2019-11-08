Syncing is an utility method that creates all the necessary tables in the database for your models and associations to work. Tables are not replaced, they are only created if they don't exist.

There are 2 ways of syncing:

1. Calling `Model.sync(cb)` will only synchronize the model
2. Calling `db.sync(cb)` will synchronize all models

Dropping is a similar method but instead it drops all tables involved in your models, even if they were not created by ORM. There also 2 ways of dropping.

```js
var orm = require("orm");

orm.connect("....", function (err, db) {
    var Person = db.define("person", {
        name : String
    });
    var Pet = db.define("pet", {
        name : String
    });

    db.drop(function () {
        // dropped all tables from defined models (Person and Pet)

        Person.sync(function () {
            // created tables for Person model
        });
    });
});
```