var ORM = require('../../');
var helper = require('../support/spec_helper');

describe("hasOne", function () {
    var db = null;
    var Tree = null;
    var Stalk = null;
    var Leaf = null;
    var Hole = null;

    var leafId = null;
    var treeId = null;
    var stalkId = null;
    var holeId = null;

    var setup = function (opts) {
        opts = opts || {};
        return function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);
            Tree = db.define("tree", {
                type: {
                    type: 'text'
                }
            });
            Stalk = db.define("stalk", {
                length: {
                    type: 'integer'
                }
            });
            Hole = db.define("hole", {
                width: {
                    type: 'integer'
                }
            });
            Leaf = db.define("leaf", {
                size: {
                    type: 'integer'
                },
                holeId: {
                    type: 'integer',
                    mapsTo: 'hole_id'
                }
            }, {
                validations: opts.validations
            });
            Leaf.hasOne(Tree, {
                as: 'tree',
                // field: 'treeId',
                // autoFetch: !!opts.autoFetch
            });
            Leaf.hasOne(Stalk, {
                as: 'stalk',
                // field: 'stalkId',
                // mapsTo: 'stalk_id'
            });
            Leaf.hasOne(Hole, {
                as: 'hole',
                // field: 'holeId'
            });

            helper.dropSync([Tree, Stalk, Hole, Leaf], function () {
                var tree = Tree.create({
                    type: 'pine'
                });
                treeId = tree[Tree.id];

                var leaf = Leaf.create({
                    size: 14
                });
                leafId = leaf[Leaf.id];
                leaf.$set('tree', tree).$save();

                var stalk = Stalk.create({
                    length: 20
                });
                assert.exist(stalk);
                stalkId = stalk[Stalk.id];

                var hole = Hole.create({
                    width: 3
                });
                holeId = hole.id;
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    describe("manual find", function () {
        before(setup());

        it("left join", function () {
            var leaf = Leaf.one({
              where: {
                [Leaf.propIdentifier('id')]: leafId
              },
              select: (() => {
                  const fmap = {}
                  Leaf.propertyList.forEach(property => {
                      fmap[property.mapsTo] = `${Leaf.collection}.${property.mapsTo}`
                  })

                  Hole.propertyList.forEach(property => {
                    fmap[`hole_${property.mapsTo}`] = Hole.propIdentifier(property)
                  })

                  Tree.propertyList.forEach(property => {
                    fmap[`tree_${property.mapsTo}`] = Tree.propIdentifier(property)
                  })
                  return fmap
              })(),
              joins: [
                  Leaf.leftJoin({
                      collection: Tree.collection,
                      on: {
                          [Leaf.assoc('tree').prop('tree_id').mapsTo]: Tree.Opf.colref(Tree.prop('id').mapsTo)
                      }
                  }),
                  Leaf.leftJoin({
                      collection: Hole.collection,
                      on: {
                          [Leaf.assoc('hole').prop('hole_id').mapsTo]: Hole.Opf.colref(Hole.prop('id').mapsTo)
                      }
                  })
              ],
              filterQueryResult (list) {
                return list.map(leaf => {

                  const { tree_id, tree_type } = leaf
                  if (tree_id) {
                    leaf.tree = leaf.tree || {}
                    leaf.tree.id = tree_id
                    leaf.tree.type = tree_type
                  }
                  // in fact, you dont need delete them, which would be filtered when building association
                  delete leaf.tree_id
                  delete leaf.tree_type

                  const { hole_id, hold_width } = leaf
                  if (hole_id) {
                    leaf.hole = leaf.hole || {}
                    leaf.hole.id = hole_id
                    leaf.hold.width = hold_width
                  }
                  delete leaf.hole_id
                  delete leaf.hole_width

                  return leaf
                })
              }
            })

            assert.property(leaf, 'tree')
        });
    })

    describe("accessors", function () {
        before(setup());

        oit("#$getRef: should get the association", function () {
            var leaf = Leaf.one({
                size: 14
            });
            assert.exist(leaf);
            var tree = leaf.$getRef('tree');

            assert.exist(tree);
            assert.strictEqual(treeId, tree.id);

            var [tree] = leaf.$getRef(['tree']);
            assert.exist(tree);
            assert.strictEqual(treeId, tree.id);
        });

        oit("#$getRef: should return proper instance model", function () {
            var leaf = Leaf.one({
                size: 14
            });
            var tree = leaf.$getRef('tree');

            assert.equal(tree.$model, Tree);
        });

        oit("#$getRef: get should get the association with a shell model", function () {
            var tree = Leaf.New(leafId).$getRef('tree');
            assert.exist(tree);
            assert.equal(tree[Tree.id], treeId);
        });

        oit("#$hasRef: has should indicate if there is an association present", function () {
            var leaf = Leaf.one({
                size: 14
            });
            assert.exist(leaf);

            var has = leaf.$hasRef('tree');
            assert.equal(has.final, true);

            has = leaf.$hasRef('stalk');
            assert.equal(has.final, false);
        });

        oit("#$saveRef: set should associate another instance", function () {
            var stalk = Stalk.one({
                length: 20
            });
            assert.exist(stalk);

            var leaf = Leaf.one({
                size: 14
            });
            assert.exist(leaf);
            assert.notExist(leaf.stalk);

            leaf.$set('stalk', stalk).$save();

            assert.equal(leaf.stalk.id, stalk[Stalk.id]);
        });

        oit("#$unlinkRef: remove should unassociation another instance", function () {
            var stalk = Stalk.one({
                length: 20
            });
            assert.exist(stalk);
            var leaf = Leaf.one({
                size: 14
            }).$fetchRef();

            assert.exist(leaf);
            assert.exist(leaf.stalk);
            leaf.$unlinkRef('stalk');
            assert.equal(leaf.stalk, null);

            var leaf = Leaf.one({
                size: 14
            });
            assert.equal(leaf.stalk, null);
        });
    });

    describe("findByRef", function () {
      var tree, leaf
      describe("findByRef() - A hasOne B", function () {
        before(setup());

        before(() => {
          leaf = Leaf.one({ size: 14 });
        });

        it("could find A with `findByB()`", function () {
          var _leaf = Leaf.findByRef('tree', Tree.New(treeId))[0];
          assert.equal(_leaf.id, leaf.id);
        });

        it("could find null if no linked", function () {
          var _stalk = Leaf.findByRef('stalk', Stalk.New(stalkId))[0];
          assert.notExist(_stalk);
        });

        it("should throw if no conditions passed", function () {
            assert.throws(function () {
                Leaf.findByRef('tree');
            });
        });

        it("should lookup in Model based on associated model properties", function () {
            var leafs = Leaf.findByRef('tree', {
                type: "pine"
            });

            assert.ok(Array.isArray(leafs));
            assert.ok(leafs.length == 1);
        });
      })
    });

    xdescribe("association name letter case", function () {
        it("should be kept", function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);

            var Person = db.define("person", {
                name: String
            });
            Person.hasOne(Person, {
                as: "topParent",
                property: {
                    mapsTo: 'top_parent'
                }
            });

            helper.dropSync(Person, function () {
                var person = Person.create({
                    name: "Child"
                });

                person = Person.get(person[Person.id]);

                assert.isFunction(person.$set);
                assert.isFunction(person.$unlinkRef);
                assert.isFunction(person.$hasRef);
            });
        });
    });

    xdescribe("mapsTo", function () {
        describe("with `mapsTo` set via `hasOne`", function () {
            var leaf = null;

            before(setup());

            before(function () {
                var lf = Leaf.create({
                    size: 444,
                    stalkId: stalkId,
                    holeId: holeId
                });
                leaf = lf;
            });

            it("should have correct fields in the DB", function () {
                var sql = db.driver.query.select()
                    .from('leaf')
                    .select('size', 'stalk_id')
                    .where({
                        size: 444
                    })
                    .build();

                var rows = db.driver.execQuerySync(sql);

                assert.equal(rows[0].size, 444);
                assert.equal(rows[0].stalk_id, 1);
            });

            it("should get parent", function () {
                var stalk = leaf.getStalkSync();

                assert.exist(stalk);
                assert.equal(stalk.id, stalkId);
                assert.equal(stalk.length, 20);
            });
        });

        describe("with `mapsTo` set via property definition", function () {
            var leaf = null;

            before(setup());

            before(function () {
                var lf = Leaf.create({
                    size: 444,
                    stalkId: stalkId,
                    holeId: holeId
                });
                leaf = lf;
            });

            it("should have correct fields in the DB", function () {
                var sql = db.driver.query.select()
                    .from('leaf')
                    .select('size', 'hole_id')
                    .where({
                        size: 444
                    })
                    .build();

                var rows = db.driver.execQuerySync(sql);

                assert.equal(rows[0].size, 444);
                assert.equal(rows[0].hole_id, 1);
            });

            it("should get parent", function () {
                var hole = leaf.getHoleSync();

                assert.exist(hole);
                assert.equal(hole.id, stalkId);
                assert.equal(hole.width, 3);
            });
        });
    });
});
