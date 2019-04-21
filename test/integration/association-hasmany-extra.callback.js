var helper = require('../support/spec_helper');

describe("hasMany extra properties - callback", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    var setup = function (opts) {
        opts = opts || {};
        return function (done) {
            db.settings.set('instance.identityCache', false);

            Person = db.define('person', {
                name: String,
            }, opts);
            Pet = db.define('pet', {
                name: String
            });
            Person.hasMany('pets', Pet, {
                since: Date,
                data: Object
            });

            return helper.dropSync([Person, Pet], done);
        };
    };

    before(function (done) {
        helper.connect(function (connection) {
            db = connection;
            done();
        });
    });

    describe("if passed to addAccessor", function () {
        before(setup());

        it("should be added to association", function () {
            Person.create([{
                name: "John"
            }], function (err, people) {
                Pet.create([{
                    name: "Deco"
                }, {
                    name: "Mutt"
                }], function (err, pets) {
                    var data = { adopted: true };

                    people[0].addPets(pets, { since: new Date(), data: data }, function (err) {
                        assert.equal(err, null);

                        Person.find({ name: "John" }, { autoFetch: true }).first(function (err, John) {
                            assert.equal(err, null);

                            assert.property(John, "pets");
                            assert.ok(Array.isArray(pets));

                            assert.equal(John.pets.length, 2);

                            assert.property(John.pets[0], "name");
                            assert.property(John.pets[0], "extra");
                            assert.isObject(John.pets[0].extra);
                            assert.property(John.pets[0].extra, "since");
                            assert.ok(John.pets[0].extra.since instanceof Date);

                            assert.equal(typeof John.pets[0].extra.data, 'object');
                            assert.equal(JSON.stringify(data), JSON.stringify(John.pets[0].extra.data));
                        });
                    });
                });
            });
        });
    });
});