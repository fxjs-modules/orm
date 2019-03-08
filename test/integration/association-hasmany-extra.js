var test = require('test')
test.setup()

var helper = require('../support/spec_helper');
var ORM = require('../../');

function cutOffMilliSecond (time) {
    const t = time.getTime()
    const millis = time.getMilliseconds()

    return new Date(t - millis)
}

describe("hasMany extra properties", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    var setup = function (opts) {
        opts = opts || {};
        return function () {
            db.settings.set('instance.identityCache', false);

            Person = db.define('person', {
                name: String,
            }, opts);
            Pet = db.define('pet', {
                name: String
            });
            Person.hasMany('pets', Pet, {
                since: {
                    type: 'date',
                    time: true
                },
                data: Object
            }, {
                reverse: opts.reversePets ? 'owners' : null,
                autoFetch: !!opts.autoFetchPets
            });

            return helper.dropSync([Person, Pet]);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.closeSync();
    });

    describe("if passed to addAccessor", function () {
        before(setup());

        it("should be added to association", function () {
            var people = Person.createSync([{
                name: "John"
            }]);

            var pets = Pet.createSync([{
                name: "Deco"
            }, {
                name: "Mutt"
            }]);

            var data = {
                adopted: true
            };

            people[0].addPetsSync(pets, {
                since: new Date(),
                data: data
            });

            var John = Person.find({
                name: "John"
            }, {
                autoFetch: true
            }).firstSync();

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

    describe("findBy with extra data", function () {
        var data = {
            adopted: true
        };
        function assertion_people_for_findby (people) {
            const John = people.find(person => person.name === "John");
            assert.property(John, "pets");
            assert.ok(Array.isArray(John.pets));

            assert.equal(John.pets.length, 2);

            assert.property(John.pets[0], "name");
            assert.property(John.pets[0], "extra");
            assert.isObject(John.pets[0].extra);
            assert.property(John.pets[0].extra, "since");
            assert.ok(John.pets[0].extra.since instanceof Date);

            assert.equal(typeof John.pets[0].extra.data, 'object');
            assert.equal(JSON.stringify(data), JSON.stringify(John.pets[0].extra.data));
        }

        describe("findBy() - A hasMany B, without reverse", function () {
            /**
             * mysql would deprecate millisecond when store field as `datetime` type,
             * avoid this difference to make test case working.
             */
            const since = cutOffMilliSecond(new Date());
            before(function () {
                setup({
                    autoFetchPets: false,
                })();

                var people = Person.createSync([{
                    name: "John"
                }]);

                var pets = Pet.createSync([{
                    name: "Deco"
                }, {
                    name: "Mutt"
                }]);

                var data = {
                    adopted: true
                };

                people[0].addPetsSync(pets, {
                    since: since,
                    data: data
                });
            });

            it("could find A with `findbyB()`", function (done) {
                var John = Person.findByPets(
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        order: 'name',
                        autoFetch: true,
                        // find options for associated model `Pet`,
                        // {accessor}_find_options
                        [`pets_find_options`]: {
                        }
                    }
                ).firstSync();

                assertion_people_for_findby([John]);

                var personCount = Person.findByPets({ name: "Mutt" }, { autoFetch: true }).countSync();
                assert.ok(personCount, 1);

                ;[
                    'all',
                    'where',
                    'find',
                    // 'remove',
                    'run'
                ].forEach(ichainFindKey => {
                    var people = Person.findByPets({ name: "Mutt" }, { autoFetch: true })[`${ichainFindKey}Sync`]();
                    assertion_people_for_findby(people);
                });

                var people = Person.findByPetsSync({ name: "Mutt" }, { autoFetch: true });
                assertion_people_for_findby(people);

                // asynchronous version
                Person.findByPets({ name: "Mutt" }, { autoFetch: true })
                    .run(function (err, people) {
                        assertion_people_for_findby(people);
                        done();
                    });
            });

            it("use wrong extra data find A with `findByB()`", function (/* done */) {
                var John = Person.findByPets(
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        exists: [
                            {
                                table: 'person_pets',
                                link: [
                                    'pets_id', 'id'
                                ],
                                conditions: {
                                    name: "non_existed_extra_field"
                                }
                            }
                        ],
                        order: 'name',
                        autoFetch: true,
                        // find options for associated model `Pet`,
                        // {accessor}_find_options
                        [`pets_find_options`]: {
                        }
                    }
                ).firstSync();

                assert.ok(John === null);

                var John = Person.findByPets(
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        exists: [
                            {
                                table: 'person_pets',
                                link: [
                                    'pets_id', 'id'
                                ],
                                conditions: {
                                    since: ORM.ne(since)
                                }
                            }
                        ],
                        order: 'name',
                        autoFetch: true
                    }
                ).firstSync();

                assert.ok(John === null);
            });

            it("use right extra data find A with `findByB()`", function () {
                var John = Person.findByPets(
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        exists: [
                            {
                                table: 'person_pets',
                                link: [
                                    'pets_id', 'id'
                                ],
                                conditions: {
                                    since: since
                                }
                            }
                        ],
                        order: 'name',
                        autoFetch: true
                    }
                ).firstSync();

                assert.property(John, "pets");
                assertion_people_for_findby([John]);

                var John = Person.findByPets(
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        exists: [
                            {
                                table: 'person_pets',
                                link: [
                                    'pets_id', 'id'
                                ],
                                conditions: {
                                    since: ORM.eq(since)
                                }
                            }
                        ],
                        order: 'name',
                        autoFetch: true
                    }
                ).firstSync();

                assert.property(John, "pets");
                assertion_people_for_findby([John]);
            });
        });
    });

    describe("if call whereExists", function () {
        before(setup());

        it("should found if whereExists provided", function () {
            var people = Person.createSync([{
                name: "John"
            }]);

            var pets = Pet.createSync([{
                name: "Deco"
            }, {
                name: "Mutt"
            }]);

            var data = {
                adopted: true
            };

            people[0].addPetsSync(pets, {
                since: new Date(),
                data: data
            });

            var non_existed = Pet.find({
            }, {
                exists: [{
                    table: 'person_pets',
                    link: [
                        'pets_id', 'id'
                    ],
                    conditions: {
                        name: "non_existed1"
                    }
                }]
            }).allSync();

            assert.isArray(non_existed);
            assert.equal(non_existed.length, 0);

            var found_pets = Pet.find({
            }, {
                table: 'person_pets',
                link: [
                    'pets_id', 'id'
                ],
                conditions: {
                    name: ["Deco", "Mutt"]
                }
            }).allSync();

            var John = Person.find({
            }, {
                exists: [{
                    table: 'person_pets', 
                    link: [
                        'person_id', 'id'
                    ],
                    conditions: {
                        pets_id: found_pets.map(x => x.id)
                    }
                }],
                autoFetch: true
            }).firstSync();

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
        })
    })
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
