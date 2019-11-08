Before connecting, you will need a supported driver. Here's the drivers and versions that are tested, add the ones you need to your `package.json`.

 driver                | npm package                | version
:----------------------|:---------------------------|:-----
 mysql                 | mysql                      | 2.12.0
 postgres<br/>redshift | pg                         | 6.1.0 <sup>[1]</sup>
 sqlite                | sqlite3                    | 3.1.8
 mongodb               | mongodb                    | 1.4.10

<sup>[1]</sup> If you're connecting to **Heroku**, use version **2.5.0**.

These are the versions tested. Use others (older or newer) at your own risk.

For example, to use mySQL just do:

```bash
$ npm install --save mysql@2.0.0-alpha8
```

To connect to a database, you can pass a [URL](https://en.wikipedia.org/wiki/URL) string where the scheme is a supported driver or you can pass an `Object` with the parameters of the connection.

```javascript
var orm = require('orm');

orm.connect('mysql://root:password@localhost/test', function(err, db) {
  if (err) return console.error('Connection error: ' + err);

  // connected
  // ...
});
```

The callback is only called when the connection is done successfully (or unsuccessfully). You can avoid passing a callback and listen for the `connect` event if you prefer.

```js
var orm = require('orm');

var db = orm.connect('mysql://root:password@localhost/test');

db.on('connect', function(err) {
  if (err) return console.error('Connection error: ' + err);

  // connected
  // ...
});
```

The connection URL has the following syntax: `driver://username:password@hostname/database?option1=value1&option2=value2..`

Valid options are:

- `debug` (default: **false**): prints queries to console;
- `pool` (default: **false**): manages a connection pool (only for `mysql` and `postgres`) using built-in driver pool;
- `strdates` (default: **false**): saves dates as strings (only for `sqlite`).
- `timezone` (default: **'local'**): store dates in the database using this timezone (`mysql` and `postgres` only)

Both `debug` and `pool` can also be set using [Settings](Settings).

## Connecting to multiple databases
ORM Models are bound to database connections, so if you need 'multi-tenancy', that is need to connect to different servers or databases, you can use something like this:

```javascript
// db.js
var connections = {};

function setup(db) {
  var User = db.define('user', ...);
  var Shirt = db.define('shirt', ...);
  Shirt.hasOne('user', User, ...);
}

module.exports = function(host, database, cb) {
  if (connections[host] && connections[host][database]) {
    return connections[host][database];
  }
  
  var opts = {
    host:     host,
    database: database,
    protocol: 'mysql',
    port:     '3306',
    query:    {pool: true}
  };
  
  orm.connect(opts, function(err, db) {
    if (err) return cb(err);
    
    connections[host] = connections[host] || {};
    connections[host][database] = db;
    setup(db);
    cb(null, db);
  });  
};

// somewhere else, eg, middleware

var database = require('./db');

database('dbserver1', 'main', function(err, db) {
  if (err) throw err;

  db.models.user.find({foo: 'bar'}, function(err, rows) {
    // ...
  });
});
```
Connections are cached, so models will only be defined once per server+database.<br/>
Because we're using a connection pool, we don't need to worry about running out of connections and we can run multiple queries at once.

## Troubleshooting

If you are getting this error when connecting to the mysql database:

```bash
Error: connect ECONNREFUSED
    at errnoException (net.js:670:11)
    at Object.afterConnect [as oncomplete] (net.js:661:19)
```

then you could try to add ```socketPath``` parameter:

```js
var db = orm.connect({
    host:     'localhost',
    database: 'database',
    user:     'user',
    password: 'pass',
    protocol: 'mysql',
    socketPath: '/var/run/mysqld/mysqld.sock',
    port:     '3306',
    query:    {pool: true, debug: true}
});
```