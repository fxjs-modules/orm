If you want to listen for a type of event than occurs in instances of a Model, you can attach a function that
will be called when that event happens.

Currently the following events are supported:

- `beforeValidation` : (no parameters) Before all validations and prior to `beforeCreate` and `beforeSave`;
- `beforeCreate` : (no parameters) Right before trying to save a new instance (prior to `beforeSave`);
- `beforeSave` : (no parameters) Right before trying to save;
- `afterSave` : (bool success) Right after saving;
- `afterCreate` : (bool success) Right after saving a new instance;
- `afterLoad` : (no parameters) Right after loading and preparing an instance to be used;
- `afterAutoFetch` : (no parameters) Right after auto-fetching associations (if any), it will trigger regardless of having associations or not;
- `beforeRemove` : (no parameters) Right before trying to remove an instance;
- `afterRemove` : (bool success) Right after removing an instance;

All hook function are called with `this` as the instance so you can access anything you want related to it.

For all `before*` hooks, you can add an additional parameter to the hook function. This parameter will be a function that
must be called to tell if the hook allows the execution to continue or to break. You might be familiar with this workflow
already from Express. Here's an example:

```js
var Person = db.define("person", {
	name    : String,
	surname : String
}, {
	hooks: {
		beforeCreate: function (next) {
			if (this.surname == "Doe") {
				return next(new Error("No Does allowed"));
			}
			return next();
		}
		afterCreate: function (success) {
			if (!success)
				throw 'creation failed'
		}
	}
});
```

This workflow allows you to make asynchronous work before calling `next`. If you're not going to use `next`, **don't** define it as an argument, otherwise the workflow will block.

## Hooks Channel(WIP)

Every calling to hook would carry a one-time specific hook id, you can set/get some context data from `this.$hook_channels[CHANNEL_ID]`

## Common Mistakes
A common issue that people have involves accessing `this` from nested callbacks within a hook. The reason for this problem is that the `this` object is only valid within the scope of the top-most hook function, callbacks will have a different value. To correct the issue, create a variable to store a reference to `this` and use that variable to access the model's properties within callbacks.

**Example**
```js
var Person = db.define("person", {
	name    : String,
	surname : String
}, {
	hooks: {
		beforeCreate: function (next) {
			var _this = this;
			checkName(this, function(err, result) {
				if(err) return next(err);
				_this.name = result.name;
				_this.surname = result.surname;
				next();
			})
		}
	}
});
```