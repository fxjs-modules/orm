## Callback Synchronous Combo

There are 4 kinds of callback-synchronous combo APIs in `@fxjs/orm`: 

1. `A/S`: pass err & result to (provided) callback ASYNCHRONOUSLY, if no callback, throw err or return result synchronously.
2. `S/S`: pass err & result to (provided) callback SYNCHRONUSLY, if no callback, throw err or return result synchronously.
3. `E-A/S`: pass result to (provided) callback ASYNCHRONOUSLY, return result synchronously. never throw err, just pass err & result to EventEmitter's event handler.
4. `E-S/S`: pass result to (provided) callback SYNCHRONUSLY, return result synchronously. never throw err, just pass err & result to EventEmitter's event handler.

see details below:

## Exported ORM APIs

### `ORM.connect(uri, async_cb?)`

**type**: `E-A/S`

```javascript
var ORM = require('@fxjs/orm')

// ✔️ synchronous
var conn = ORM.connect(uri)

// ✔️
var evt = new coroutine.Event();
var _conn = null;
var conn = ORM.connect(uri, function (err, conn1) {
    // callback is executed asynchronously.

    evt.set();

    _conn = conn1;
    // conn1 is just equivalent to conn, but in generall conn is not defined when this line code being executed.
    
});
evt.wait();
assert.equal(conn, _conn); // true
```

### `ORM.connectSync(uri)`

**type**: `E-S`


```javascript
var ORM = require('@fxjs/orm')

// ✔️
var conn = ORM.connectSync(uri)
```

## ORM object APIs

Those APIs are synchronous style:

- `orm.begin()`
- `orm.end()`
- `orm.commit()`
- `orm.rollback()`

- `orm.trans(func)`

### `orm.drop(async_cb?)`

**type**: `E-A/S`

```javascript
var ORM = require('@fxjs/orm')

// ✔️ synchronous
var conn = ORM.drop()

// ✔️ asynchronous
ORM.drop(function (err) {
    if (err)
        throw err
})
```

### `ORM.dropSync()`

**type**: `E-S`


```javascript
var ORM = require('@fxjs/orm')

// ✔️
var conn = ORM.dropSync()
```

## Model object APIs

Those fetch-like APIs are "chain when no callback, run when provided callback":

- `model.get(ids?, async_cb?): model`
- `model.find(cond?, async_cb?): chain`
- `model.findBy(cond?, async_cb?): chain`
- `model.one(cond?, async_cb?): chain`
- `model.count(cond?, async_cb?): chain`

- `model.findBy(cond?).first(async_cb?): chain`
- `model.findBy(cond?).last(async_cb?): chain`
- `model.findBy(cond?).run(async_cb?): chain`

- `model.find(cond?).first(async_cb?): chain`
- `model.find(cond?).last(async_cb?): chain`
- `model.find(cond?).run(async_cb?): chain`

- `model.one(cond?).first(async_cb?): chain`
- `model.one(cond?).last(async_cb?): chain`
- `model.one(cond?).run(async_cb?): chain`

- `model.count(cond?).first(async_cb?): chain`
- `model.count(cond?).last(async_cb?): chain`
- `model.count(cond?).run(async_cb?): chain`

`model.find()` is equivelant to `model.where()`, `model.all()`

Those fetch-like APIs are "run when suffixed with 'Sync'":

- `model.getSync(cond?): instance`
- `model.findSync(cond?): instance`
- `model.findBySync(cond?): instance`
- `model.countSync(cond?): number`

- `model.find(cond?).firstSync(): instance[]`
- `model.find(cond?).lastSync(): instance[]`
- `model.find(cond?).runSync(): instance[]`

- `model.findBy(cond?).firstSync(): instance[]`
- `model.findBy(cond?).lastSync(): instance[]`
- `model.findBy(cond?).runSync(): instance[]`

- `model.one(cond?).firstSync(): instance`
- `model.one(cond?).lastSync(): instance`
- `model.one(cond?).runSync(): instance`

- `model.count(cond?).runSync(): number`

Those save-like APIs are "run when provided callback or suffixed with 'Sync'":

- `model.create(data, async_cb?): model`
- `model.createSync(data): instance | instance[]`

- `model.clear(async_cb?): void`
- `model.clearSync(data): void`

## Instance object APIs

Those save-like APIs are "run when provided callback or suffixed with 'Sync'":

- `instance.save(data, async_cb?): this`
- `instance.saveSync(data): this`

- `instance.remove(where?, async_cb?): this`
- `instance.removeSync(where?): this`

## Instance Accessor

You could also consider accessor method in association as `A/S`, for example

- Person hasMany pets

```javascript
var person = new Person(...)
var pets = new pets([...])

// ✔️ asynchronous
person.addPets(function (err, pets) {
    
});
// ✔️ synchronous
var pets = person.addPetsSync();

// ✔️ asynchronous
person.removePets(function (err, removedPets) {
    
});
// ✔️ synchronous
var removedPets = person.removePetsSync();
```