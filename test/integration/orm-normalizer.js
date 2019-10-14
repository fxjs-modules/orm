var helper = require('../support/spec_helper');
var common = require('../common');
var ORM = require('../../');

odescribe("ORM Normalizer", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    var queryNormalizer = null;

    var setup = function () {
        Person = db.define("person", {
            name: String
        });

        Pet = db.define("pet", {
            name: String
        });

        return helper.dropSync([Person, Pet], function () {
            Person.create([{
                id: 1,
                name: "John Doe"
            }, {
                id: 2,
                name: "Jane Doe"
            }, {
                id: 3,
                name: "John Doe"
            }]);

            Pet.create([
                {
                    name: "Dan"
                },
                {
                    name: "Deco"
                }
            ])
        });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });

    describe("ORM has static method", function () {
        before(setup);

        it('has', function () {
            assert.isFunction(ORM.normalizeQuery)
        });
        
        it('collection is required', function () {
            assert.throws(() => {
              ORM.normalizeQuery();  
            });
        });
    });

    describe("query one collection only", function () {
        before(setup);
        
        it("basic", function () {
            queryNormalizer = ORM.normalizeQuery('person', {
                
            });

            assert.isTrue(queryNormalizer.isEmptyWhere)
            assert.isTrue(queryNormalizer.isSelectAll)
            assert.isFalse(queryNormalizer.isJoined)

            assert.ok(queryNormalizer.offset === 0)
            assert.ok(queryNormalizer.limit === -1)
        });
        
        it("with where condition", function () {
            queryNormalizer = ORM.normalizeQuery('person', {
                where: {
                    a: 1
                }
            });

            assert.isFalse(queryNormalizer.isEmptyWhere)
            assert.isTrue(queryNormalizer.isSelectAll)
            assert.isFalse(queryNormalizer.isJoined)
        });

        describe("where transformer", function () {
            queryNormalizer = ORM.normalizeQuery('person', {
                where: {
                    foo1: { [ORM.Op.eq]: 1 },
                    foo2: { [ORM.Op.ne]: 1 }
                }
            });
        });

        xit("used by model", function () {
            if (!['sqlite', 'mysql'].includes(common.protocol())) return ;
            
            // Person.useQueryNormalizer()
        });
    });
});