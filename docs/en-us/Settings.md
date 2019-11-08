Settings are used to store key value pairs. A settings object is instantiated on `orm` (default values), then a snapshot is created for every `db` connection and then a snapshot for each defined `Model`. So changes to `orm.settings` will take effect only to connections made after the change, and changes to `db.settings` will only affect models defined after the change.

```js
var orm = require("orm");

orm.settings.set("some.deep.value", 123);

orm.connect("....", function (err, db) {
    // db.settings is a snapshot of the settings at the moment
    // of orm.connect(). changes to it don't affect orm.settings

    console.log(db.settings.get("some.deep.value")); // 123
    console.log(db.settings.get("some.deep"));       // { value: 123 }

    db.settings.set("other.value", { some: "object" });

    console.log(db.settings.get("other.value"));     // { some: "object" }
    console.log(orm.settings.get("other.value"));    // undefined
});
```

Here's the structure of the default settings:

```js
var Settings = {
	properties : {
		primary_key            : "id",
		association_key        : "{name}_{field}",
		required               : false
	},
	instance   : {
		identityCache          : true,
		identityCacheSaveCheck : true,
		autoSave               : false,
		autoFetch              : false,
		autoFetchLimit         : 1,
		cascadeRemove          : true,
		returnAllErrors        : false
	},
	connection : {
		reconnect              : true,
		pool                   : false,
		debug                  : false
	}
};
```

Setting | Description
:-------|:------------
`properties.primary_key`         | the property name for the primary key of models without an `id` defined
`properties.association_key`     | the property name of an association key (example: "user_id")
`properties.required`            | if the default behaviour of a property is to be required or not
`instance.identityCache`         | if instances should use an identity cache
`instance.identityCacheSaveCheck` | if instances should be returned from identity cache if the instance is saved or not (don't change this unless you know what you're doing)
`instance.autoSave`              | if activated, makes instances save instantly when any property is changed
`instance.autoFetch`             | if associations should be fetched automatically or not
`instance.autoFetchLimit`        | if `autoFetch` is activated, is the depth of associations it should fetch
`instance.cascadeRemove`         | removes associations when removing instances
`instance.returnAllErrors`       | if activated, instance saving will hold all errors and return them as an `Array` instead of returning on first error
`connection.reconnect`           | try to reconnect when connection is lost
`connection.pool`                | use the driver connection pool (if supported)
`connection.debug`               | print coloured queries to `stdout`