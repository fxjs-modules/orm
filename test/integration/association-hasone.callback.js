var ORM      = require('../../');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var protocol = common.protocol();

describe("hasOne - callback", function() {
  var db    = null;
  var Tree  = null;
  var Stalk = null;
  var Leaf  = null;
  var leafId = null;
  var treeId = null;
  var stalkId = null;
  var holeId  = null;

  var setup = function (opts) {
    opts = opts || {};
    return function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);
      Tree  = db.define("tree",   { type:   { type: 'text'    } });
      Stalk = db.define("stalk",  { length: { type: 'integer' } });
      Hole  = db.define("hole",   { width:  { type: 'integer' } });
      Leaf  = db.define("leaf", {
        size:   { type: 'integer' },
        holeId: { type: 'integer', mapsTo: 'hole_id' }
      }, {
        validations: opts.validations
      });
      Leaf.hasOne('tree',  Tree,  { field: 'treeId', autoFetch: !!opts.autoFetch });
      Leaf.hasOne('stalk', Stalk, { field: 'stalkId', mapsTo: 'stalk_id' });
      Leaf.hasOne('hole',  Hole,  { field: 'holeId' });

      return helper.dropSync([Tree, Stalk, Hole, Leaf], function() {
        Tree.create({ type: 'pine' }, function (err, tree) {
          assert.notExist(err);
          treeId = tree[Tree.id];
          Leaf.create({ size: 14 }, function (err, leaf) {
            assert.notExist(err);
            leafId = leaf[Leaf.id];
            leaf.setTree(tree, function (err) {
              assert.notExist(err);
              Stalk.create({ length: 20 }, function (err, stalk) {
                assert.notExist(err);
                assert.exist(stalk);
                stalkId = stalk[Stalk.id];
                Hole.create({ width: 3 }, function (err, hole) {
                  assert.notExist(err);
                  holeId = hole.id;
                  done();
                });
              });
            });
          });
        });
      });
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("accessors", function () {
    before(setup());

    it("get should get the association", function (done) {
      Leaf.one({ size: 14 }, function (err, leaf) {
        assert.notExist(err);
        assert.exist(leaf);
        leaf.getTree(function (err, tree) {
          assert.notExist(err);
          assert.exist(tree);
          return done();
        });
      });
    });

    it("should return proper instance model", function (done) {
      Leaf.one({ size: 14 }, function (err, leaf) {
        leaf.getTree(function (err, tree) {
          assert.equal(tree.model(), Tree);
          return done();
        });
      });
    });

    it("get should get the association with a shell model", function (done) {
      Leaf(leafId).getTree(function (err, tree) {
        assert.notExist(err);
        assert.exist(tree);
        assert.equal(tree[Tree.id], treeId);
        done();
      });
    });

    it("has should indicate if there is an association present", function (done) {
      Leaf.one({ size: 14 }, function (err, leaf) {
        assert.notExist(err);
        assert.exist(leaf);

        leaf.hasTree(function (err, has) {
          assert.notExist(err);
          assert.equal(has, true);

          leaf.hasStalk(function (err, has) {
            assert.notExist(err);
            assert.equal(has, false);
            return done();
          });
        });
      });
    });

    it("set should associate another instance", function (done) {
      Stalk.one({ length: 20 }, function (err, stalk) {
        assert.notExist(err);
        assert.exist(stalk);
        Leaf.one({ size: 14 }, function (err, leaf) {
          assert.notExist(err);
          assert.exist(leaf);
          assert.notExist(leaf.stalkId);
          leaf.setStalk(stalk, function (err) {
            assert.notExist(err);
            Leaf.one({ size: 14 }, function (err, leaf) {
              assert.notExist(err);
              assert.equal(leaf.stalkId, stalk[Stalk.id]);
              done();
            });
          });
        });
      });
    });

    it("remove should unassociation another instance", function (done) {
      Stalk.one({ length: 20 }, function (err, stalk) {
        assert.notExist(err);
        assert.exist(stalk);
        Leaf.one({ size: 14 }, function (err, leaf) {
          assert.notExist(err);
          assert.exist(leaf);
          assert.exist(leaf.stalkId);
          leaf.removeStalk(function (err) {
            assert.notExist(err);
            Leaf.one({ size: 14 }, function (err, leaf) {
              assert.notExist(err);
              assert.equal(leaf.stalkId, null);
              done();
            });
          });
        });
      });
    });
  });

  [false, true].forEach(function (af) {
    describe("with autofetch = " + af, function () {
      before(setup({autoFetch: af}));

      describe("autofetching", function() {
        it((af ? "should" : "shouldn't") + " be done", function (done) {
          Leaf.one({}, function (err, leaf) {
            assert.notExist(err);
            assert.equal(typeof leaf.tree, af ? 'object' : 'undefined');

            return done();
          });
        });
      });

      describe("associating by parent id", function () {
        var tree = null;

        before(function(done) {
          Tree.create({type: "cyprus"},  function (err, item) {
            assert.notExist(err);
            tree = item;

            return done();
          });
        });

        it("should work when calling Instance.save", function (done) {
          leaf = new Leaf({size: 4, treeId: tree[Tree.id]});
          leaf.save(function(err, leaf) {
            assert.notExist(err);

            Leaf.get(leaf[Leaf.id], function(err, fetchedLeaf) {
              assert.notExist(err);
              assert.exist(fetchedLeaf);
              assert.equal(fetchedLeaf.treeId, leaf.treeId);

              return done();
            });
          });
        });

        it("should work when calling Instance.save after initially setting parentId to null", function(done) {
          leaf = new Leaf({size: 4, treeId: null});
          leaf.treeId = tree[Tree.id];
          leaf.save(function(err, leaf) {
            assert.notExist(err);

            Leaf.get(leaf[Leaf.id], function(err, fetchedLeaf) {
              assert.notExist(err);
              assert.exist(fetchedLeaf);
              assert.equal(fetchedLeaf.treeId, leaf.treeId);

              return done();
            });
          });
        });

        it("should work when specifying parentId in the save call", function (done) {
          leaf = new Leaf({size: 4});
          leaf.save({ treeId: tree[Tree.id] }, function(err, leaf) {
            assert.notExist(err);

            assert.exist(leaf.treeId);

            Leaf.get(leaf[Leaf.id], function(err, fetchedLeaf) {
              assert.notExist(err);
              assert.exist(fetchedLeaf);
              assert.equal(fetchedLeaf.treeId, leaf.treeId);

              return done();
            });
          });
        });

        it("should work when calling Model.create", function (done) {
          Leaf.create({size: 4, treeId: tree[Tree.id]}, function (err, leaf) {
            assert.notExist(err);

            Leaf.get(leaf[Leaf.id], function(err, fetchedLeaf) {
              assert.notExist(err);

              assert.exist(fetchedLeaf);
              assert.equal(fetchedLeaf.treeId, leaf.treeId);

              return done();
            });
          });
        });

        it("shouldn't cause an infinite loop when getting and saving with no changes", function (done) {
          Leaf.get(leafId, function (err, leaf) {
            assert.notExist(err);

            leaf.save( function (err) {
              assert.notExist(err);
              done();
            });
          });
        });

        it("shouldn't cause an infinite loop when getting and saving with changes", function (done) {
          Leaf.get(leafId, function (err, leaf) {
            assert.notExist(err);

            leaf.save({ size: 14 }, function (err) {
              assert.notExist(err);
              done();
            });
          });
        });
      });
    });
  });

  describe("validations", function () {
    before(setup({validations: { stalkId: ORM.validators.rangeNumber(undefined, 50) }}));

    it("should allow validating parentId", function (done) {
      Leaf.one({ size: 14 }, function (err, leaf) {
        assert.notExist(err);
        assert.exist(leaf);

        leaf.save({ stalkId: 51  }, function( err, item ) {
          assert.ok(Array.isArray(err));
          assert.equal(err.length, 1);
          assert.equal(err[0].msg, 'out-of-range-number');

          done();
        });
      });
    });
  });

  describe("if not passing another Model", function () {
    it("should use same model", function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);

      var Person = db.define("person", {
        name : String
      });
      Person.hasOne("parent", {
        autoFetch : true
      });

      helper.dropSync(Person, function () {
        var child = new Person({
          name : "Child"
        });
        child.setParent(new Person({ name: "Parent" }), function (err) {
          assert.equal(err, null);

          return done();
        });
      });
    });
  });

  describe("association name letter case", function () {
    it("should be kept", function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);

      var Person = db.define("person", {
        name : String
      });
      Person.hasOne("topParent", Person);

      helper.dropSync(Person, function () {
        Person.create({
          name : "Child"
        }, function (err, person) {
          assert.equal(err, null);

          Person.get(person[Person.id], function (err, person) {
            assert.equal(err, null);

            assert.isFunction(person.setTopParent);
            assert.isFunction(person.removeTopParent);
            assert.isFunction(person.hasTopParent);

            return done();
          });
        });
      });
    });
  });

  describe("findBy()", function () {
    before(setup());

    it("should throw if no conditions passed", function (done) {
        assert.throws(() => {
            Leaf.findByTree(function () {});
        });

        return done();
    });

    it("should lookup in Model based on associated model properties", function (done) {
      Leaf.findByTree({
        type: "pine"
      }, function (err, leafs) {
        assert.equal(err, null);
        assert.ok(Array.isArray(leafs));
        assert.ok(leafs.length == 1);

        return done();
      });
    });

    it("should return a ChainFind if no callback passed", function (done) {
      var ChainFind = Leaf.findByTree({
        type: "pine"
      });
      assert.isFunction(ChainFind.run);

      return done();
    });
  });

  if (protocol != "mongodb") {
    describe("mapsTo", function () {
      describe("with `mapsTo` set via `hasOne`", function () {
        var leaf = null;

        before(setup());

        before(function (done) {
          Leaf.create({ size: 444, stalkId: stalkId, holeId: holeId }, function (err, lf) {
            assert.notExist(err);
            leaf = lf;
            done();
          });
        });

        it("should have correct fields in the DB", function (done) {
          var sql = db.driver.query.select()
            .from('leaf')
            .select('size', 'stalk_id')
            .where({ size: 444 })
            .build();

          db.driver.execQuery(sql, function (err, rows) {
            assert.notExist(err);

            assert.equal(rows[0].size, 444);
            assert.equal(rows[0].stalk_id, 1);

            done();
          });
        });

        it("should get parent", function (done) {
          leaf.getStalk(function (err, stalk) {
            assert.notExist(err);

            assert.exist(stalk);
            assert.equal(stalk.id, stalkId);
            assert.equal(stalk.length, 20);
            done();
          });
        });
      });

      describe("with `mapsTo` set via property definition", function () {
        var leaf = null;

        before(setup());

        before(function (done) {
          Leaf.create({ size: 444, stalkId: stalkId, holeId: holeId }, function (err, lf) {
            assert.notExist(err);
            leaf = lf;
            done();
          });
        });

        it("should have correct fields in the DB", function (done) {
          var sql = db.driver.query.select()
            .from('leaf')
            .select('size', 'hole_id')
            .where({ size: 444 })
            .build();

          db.driver.execQuery(sql, function (err, rows) {
            assert.notExist(err);

            assert.equal(rows[0].size, 444);
            assert.equal(rows[0].hole_id, 1);

            done();
          });
        });

        it("should get parent", function (done) {
          leaf.getHole(function (err, hole) {
            assert.notExist(err);

            assert.exist(hole);
            assert.equal(hole.id, stalkId);
            assert.equal(hole.width, 3);
            done();
          });
        });
      });
    });
  };

});