var helper = require('../support/spec_helper');

describe("Model.sync - callback", function () {
  var db     = null;

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  after(function () {
    db.close();
  });

  // SQLite scopes index names to a database and NOT a table, so
  // index name collisions were possible. This tests the workaround.
  it("should work with multiple same-named indexes", function (done) {
    var A, B, C;

    A = db.define('a', { name: String });
    B = db.define('b', { name: String });
    C = db.define('c', { name: String });

    A.hasMany('bees', B, {}, { reverse: 'eighs' });
    A.hasMany('cees', C, {}, { reverse: 'eighs' });

    helper.dropSync([A, B, C], function (err) {
      assert.notExist(err);
      done();
    });
  });
});