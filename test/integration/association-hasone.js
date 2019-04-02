var ORM = require('../../');
var helper = require('../support/spec_helper');
var _ = require('lodash');

describe("hasOne", function () {
    var db = null;
    var Tree = null;
    var Stalk = null;
    var Leaf = null;
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
            var Hole = db.define("hole", {
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
            Leaf.hasOne('tree', Tree, {
                field: 'treeId',
                autoFetch: !!opts.autoFetch
            });
            Leaf.hasOne('stalk', Stalk, {
                field: 'stalkId',
                mapsTo: 'stalk_id'
            });
            Leaf.hasOne('hole', Hole, {
                field: 'holeId'
            });

            helper.dropSync([Tree, Stalk, Hole, Leaf], function () {
                var tree = Tree.createSync({
                    type: 'pine'
                });
                treeId = tree[Tree.id];

                var leaf = Leaf.createSync({
                    size: 14
                });
                leafId = leaf[Leaf.id];
                leaf.setTreeSync(tree);

                var stalk = Stalk.createSync({
                    length: 20
                });
                assert.exist(stalk);
                stalkId = stalk[Stalk.id];

                var hole = Hole.createSync({
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
        db.closeSync();
    });

    describe("accessors", function () {
        before(setup());

        it("get should get the association", function () {
            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.exist(leaf);
            var tree = leaf.getTreeSync();
            assert.exist(tree);
        });

        it("should return proper instance model", function () {
            var leaf = Leaf.oneSync({
                size: 14
            });
            var tree = leaf.getTreeSync();
            assert.equal(tree.model(), Tree);
        });

        it("get should get the association with a shell model", function () {
            var tree = Leaf(leafId).getTreeSync();
            assert.exist(tree);
            assert.equal(tree[Tree.id], treeId);
        });

        it("has should indicate if there is an association present", function () {
            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.exist(leaf);

            var has = leaf.hasTreeSync();
            assert.equal(has, true);

            has = leaf.hasStalkSync();
            assert.equal(has, false);
        });

        it("set should associate another instance", function () {
            var stalk = Stalk.oneSync({
                length: 20
            });
            assert.exist(stalk);

            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.exist(leaf);
            assert.notExist(leaf.stalkId);

            leaf.setStalkSync(stalk);

            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.equal(leaf.stalkId, stalk[Stalk.id]);
        });

        it("remove should unassociation another instance", function () {
            var stalk = Stalk.oneSync({
                length: 20
            });
            assert.exist(stalk);
            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.exist(leaf);
            assert.exist(leaf.stalkId);
            leaf.removeStalkSync();
            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.equal(leaf.stalkId, null);
        });
    });

    [false, true].forEach(function (af) {
        describe("with autofetch = " + af, function () {
            before(setup({
                autoFetch: af
            }));

            describe("autofetching", function () {
                it((af ? "should" : "shouldn't") + " be done", function () {
                    var leaf = Leaf.oneSync({});
                    assert.equal(typeof leaf.tree, af ? 'object' : 'undefined');
                });
            });

            describe("associating by parent id", function () {
                var tree = null;

                before(function () {
                    tree = Tree.createSync({
                        type: "cyprus"
                    });
                });

                it("should work when calling Instance.save", function () {
                    var leaf = new Leaf({
                        size: 4,
                        treeId: tree[Tree.id]
                    });
                    leaf.saveSync();

                    var fetchedLeaf = Leaf.getSync(leaf[Leaf.id]);
                    assert.exist(fetchedLeaf);
                    assert.equal(fetchedLeaf.treeId, leaf.treeId);
                });

                it("should work when calling Instance.save after initially setting parentId to null", function () {
                    var leaf = new Leaf({
                        size: 4,
                        treeId: null
                    });
                    leaf.treeId = tree[Tree.id];
                    leaf.saveSync();

                    var fetchedLeaf = Leaf.getSync(leaf[Leaf.id]);
                    assert.exist(fetchedLeaf);
                    assert.equal(fetchedLeaf.treeId, leaf.treeId);
                });

                it("should work when specifying parentId in the save call", function () {
                    var leaf = new Leaf({
                        size: 4
                    });
                    leaf.saveSync({
                        treeId: tree[Tree.id]
                    });

                    assert.exist(leaf.treeId);

                    var fetchedLeaf = Leaf.getSync(leaf[Leaf.id]);
                    assert.exist(fetchedLeaf);
                    assert.equal(fetchedLeaf.treeId, leaf.treeId);
                });

                it("should work when calling Model.create", function () {
                    var leaf = Leaf.createSync({
                        size: 4,
                        treeId: tree[Tree.id]
                    });

                    var fetchedLeaf = Leaf.getSync(leaf[Leaf.id]);

                    assert.exist(fetchedLeaf);
                    assert.equal(fetchedLeaf.treeId, leaf.treeId);
                });

                it("shouldn't cause an infinite loop when getting and saving with no changes", function () {
                    var leaf = Leaf.getSync(leafId);
                    leaf.saveSync();
                });

                it("shouldn't cause an infinite loop when getting and saving with changes", function () {
                    var leaf = Leaf.getSync(leafId);
                    leaf.saveSync({
                        size: 14
                    });
                });
            });
        });
    });

    describe("validations", function () {
        before(setup({
            validations: {
                stalkId: ORM.validators.rangeNumber(undefined, 50)
            }
        }));

        it("should allow validating parentId", function () {
            var leaf = Leaf.oneSync({
                size: 14
            });
            assert.exist(leaf);

            try {
                leaf.saveSync({
                    stalkId: 51
                });
            } catch (err) {
                assert.ok(Array.isArray(err));
                assert.equal(err.length, 1);
                assert.equal(err[0].msg, 'out-of-range-number');
            }
        });
    });

    describe("if not passing another Model", function () {
        it("should use same model", function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);

            var Person = db.define("person", {
                name: String
            });
            Person.hasOne("parent", {
                autoFetch: true
            });

            helper.dropSync(Person, function () {
                var child = new Person({
                    name: "Child"
                });
                child.setParentSync(new Person({
                    name: "Parent"
                }));
            });
        });

        it("could use findBy*", function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);

            var Person = db.define("person", {
                name: String
            });
            Person.hasOne("father", {
                autoFetch: false,
            });
            Person.hasOne("mother", {
                autoFetch: false,
            });

            helper.dropSync(Person, function () {
                var child = new Person({
                    name: "Child"
                });
                child.setFatherSync(new Person({
                    name: "Father"
                }));
                child.setMotherSync(new Person({
                    name: "Mother"
                }));

                var children = Person.findByFatherSync({
                    name: ORM.eq("Father")
                });
                assert.equal(children.length, 1);
                assert.equal(children[0].name, 'Child');

                var children = Person.findByMotherSync({
                    name: ORM.eq("Mother")
                });
                assert.equal(children.length, 1);
                assert.equal(children[0].name, 'Child');

                var children = Person.findBy('mother', {
                    name: ORM.eq("Mother")
                }).runSync();
                assert.equal(children.length, 1);
                assert.equal(children[0].name, 'Child');

                // manually
                var children = Person.findSync({}, {
                    // chainfind_linktable: 'person as p2',
                    __merge: {
                        from  : { table: 'person as p1', field: ['id'] },
                        // to    : { table: 'person as p2', field: ['father_id'] },
                        // where : [ 'p2', { id: ORM.ne(Date.now()) } ],
                        to    : { table: 'person', field: ['father_id'] },
                        where : [ 'person', { id: ORM.ne(Date.now()) } ],
                        table : 'person'
                    },
                    extra: []
                });
                assert.equal(children.length, 1);
                assert.equal(children[0].name, 'Child');

                var children = Person.findSync({}, {
                    // chainfind_linktable: 'person as p2',
                    __merge: [
                        {
                            from  : { table: 'person as p1', field: ['id'] },
                            // to    : { table: 'person as p2', field: ['father_id'] },
                            // where : [ 'p2', { id: ORM.ne(Date.now()) } ],
                            to    : { table: 'person', field: ['father_id'] },
                            where : [ 'person', { id: ORM.ne(Date.now()) } ],
                            table : 'person'
                        }
                    ],
                    extra: []
                });
                assert.equal(children.length, 1);
                assert.equal(children[0].name, 'Child');
            });
        });
    });

    describe("association name letter case", function () {
        it("should be kept", function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);

            var Person = db.define("person", {
                name: String
            });
            Person.hasOne("topParent", Person);

            helper.dropSync(Person, function () {
                var person = Person.createSync({
                    name: "Child"
                });

                person = Person.getSync(person[Person.id]);

                assert.isFunction(person.setTopParent);
                assert.isFunction(person.removeTopParent);
                assert.isFunction(person.hasTopParent);
            });
        });
    });

    describe("findBy*()", function () {
        before(setup());

        it("should throw if no conditions passed", function () {
            assert.throws(function () {
                Leaf.findByTreeSync();
            });
        });

        it("should lookup in Model based on associated model properties", function () {
            var leafs = Leaf.findByTreeSync({
                type: "pine"
            });

            assert.ok(Array.isArray(leafs));
            assert.ok(leafs.length == 1);
        });

        it("should return a ChainFind if no callback passed", function () {
            var ChainFind = Leaf.findByTree({
                type: "pine"
            });
            assert.isFunction(ChainFind.run);
            assert.isFunction(ChainFind.runSync);
        });
    });


    describe("mapsTo", function () {
        describe("with `mapsTo` set via `hasOne`", function () {
            var leaf = null;

            before(setup());

            before(function () {
                var lf = Leaf.createSync({
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
                var lf = Leaf.createSync({
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