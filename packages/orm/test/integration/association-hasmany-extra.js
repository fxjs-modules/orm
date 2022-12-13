var test = require('test')
test.setup()

var helper = require('../support/spec_helper');
var { runProcAndCatch } = require('../support/_helpers');
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

    describe("if passed to addSyncAccessor", function () {
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

            var data = { adopted: true };

            people[0].addPetsSync(pets, { since: new Date(), data: data })
            var John = Person.find({ name: "John" }, { autoFetch: true }).firstSync();

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

            return people;
        });
    });

    describe("getAccessor with join_where", function () {
       const bt = cutOffMilliSecond(new Date());
        const since_list = Array.apply(null, {length: 2}).fill(undefined).map((_, idx) => {
            return new Date(bt.getTime() + 86400 * 1e3 * idx)
        });

        var data = {
            adopted: true
        };

        function assertion_people_for_get_with_join_where (people) {
            const John = people.find(person => person.name === "John");
            assert.property(John, "pets");
            assert.ok(Array.isArray(John.pets));

            assert.equal(John.pets.length, 2);

            John.pets.forEach((pet, idx) => {
                assert.property(pet, "name");
                assert.property(pet, "extra");
                assert.isObject(pet.extra);
                assert.property(pet.extra, "since");
                assert.ok(pet.extra.since instanceof Date);
                assert.equal(pet.extra.since + '', since_list[idx] + '');

                assert.equal(typeof pet.extra.data, 'object');
                assert.equal(JSON.stringify(data), JSON.stringify(pet.extra.data));
            });
        }

        describe("getAccessor - A hasMany B, without reverse", function () {
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

                pets.forEach((pet, idx) => {
                    people[0].addPetsSync(pet, {
                        since: since_list[idx],
                        data: data
                    });
                });
            });

            it("implicit join_where: could get B from A with filter to join table", function () {
                var John = Person.find(
                    { name: "John" }, 
                ).firstSync();

                var Deco = John.getPets({
                    since: ORM.eq(since_list[0])
                }).firstSync();

                var Mutt = John.getPets({
                    since: ORM.eq(since_list[1])
                }).firstSync();

                John.pets = [Deco, Mutt];

                assertion_people_for_get_with_join_where([John]);
            });
                
            it('explicit join_where: could get B from A with filter to join table', () => {
                var John = Person.find(
                    { name: "John" }, 
                ).firstSync();

                var Deco = John.getPets({}, {
                    join_where: { since: ORM.eq(since_list[0]) }
                }).firstSync();

                var Mutt = John.getPets({}, {
                    join_where: { since: ORM.eq(since_list[1]) }
                }).firstSync();

                John.pets = [Deco, Mutt];

                assertion_people_for_get_with_join_where([John]);
            });

            it("implicit join_where: find item with non-exists join where condition", function () {
                var John = Person.find(
                    { name: "John" }, 
                ).firstSync();
                
                var Invalid = John.getPets({
                    since: ORM.lt(since_list[0])
                }).firstSync();
                
                assert.isNull(Invalid);
            });

            it("explicit join_where: find item with non-exists join where condition", function () {
                var John = Person.find(
                    { name: "John" }, 
                ).firstSync();
                
                var Invalid = John.getPets({}, {
                    join_where: { since: ORM.lt(since_list[0]) }
                }).firstSync();
                
                assert.isNull(Invalid);
            });
        });

        describe("getAccessor - A hasMany B, with reverse", function () {
            before(function () {
                setup({
                    autoFetchPets: false,
                    reversePets: true
                })();

                var people = Person.createSync([{
                    name: "John"
                }]);

                var pets = Pet.createSync([{
                    name: "Deco"
                }, {
                    name: "Mutt"
                }]);

                pets.forEach((pet, idx) => {
                    people[0].addPetsSync(pet, {
                        since: since_list[idx],
                        data: data
                    });
                });
            });

            describe("could get A from B with filter to join table", function () {
                it("implicit join_where: only join_where", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnForDeco = Deco.getOwners(
                        { since: ORM.eq(since_list[0]) },
                    ).firstSync();
                    Deco.extra = JohnForDeco.extra;

                    var JohnForMutt = Mutt.getOwners(
                        { since: ORM.eq(since_list[1]) }
                    ).firstSync();
                    Mutt.extra = JohnForMutt.extra;

                    var John = new Person(JohnForMutt);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });
                
                it("explicit join_where: only join_where", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnForDeco = Deco.getOwners(
                        {},
                        {
                            join_where: { since: ORM.eq(since_list[0])}
                        } 
                    ).firstSync();
                    Deco.extra = JohnForDeco.extra;

                    var JohnForMutt = Mutt.getOwners(
                        {},
                        {
                            join_where: { since: ORM.eq(since_list[1])}
                        } 
                    ).firstSync();
                    Mutt.extra = JohnForMutt.extra;

                    var John = new Person(JohnForMutt);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });

                it("implicit join_where: with limit", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnForDeco = Deco.getOwners(
                        { since: ORM.eq(since_list[0]) },
                        { limit: 50 } // see generated sql by turn on `debug_sql`
                    ).allSync()[0];
                    Deco.extra = JohnForDeco.extra;

                    var JohnForMutt = Mutt.getOwners(
                        { since: ORM.eq(since_list[1]) },
                        { limit: 50 } // see generated sql by turn on `debug_sql`
                    ).allSync()[0];
                    Mutt.extra = JohnForMutt.extra;

                    var John = new Person(JohnForMutt);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });
                
                it("explicit join_where: with limit", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnForDeco = Deco.getOwners(
                        {},
                        {
                            join_where: { since: ORM.eq(since_list[0]) },
                            limit: 50, // see generated sql by turn on `debug_sql`
                        } 
                    ).allSync()[0];
                    Deco.extra = JohnForDeco.extra;

                    var JohnForMutt = Mutt.getOwners(
                        {},
                        {
                            join_where: { since: ORM.eq(since_list[1]) },
                            limit: 50, // see generated sql by turn on `debug_sql`
                        } 
                    ).allSync()[0];
                    Mutt.extra = JohnForMutt.extra;

                    var John = new Person(JohnForMutt);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });
                
                it("implicit join_where: with limit/order", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnsForDeco = Deco.getOwners(
                        { since: ORM.eq(since_list[0]) },
                        {
                            limit: 50,
                            order: [[Person.table, 'name'], 'Z'] // see generated sql by turn on `debug_sql`
                        } 
                    ).allSync();
                    Deco.extra = JohnsForDeco[0].extra;

                    var JohnsForMutt = Mutt.getOwners(
                        { since: ORM.eq(since_list[1]) },
                        {
                            limit: 50,
                            order: '-name' // see generated sql by turn on `debug_sql`
                        } 
                    ).allSync();
                    Mutt.extra = JohnsForMutt[0].extra;

                    var John = new Person(JohnsForMutt[0]);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });
                
                it("explicit join_where: with limit/order", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnsForDeco = Deco.getOwners(
                        {},
                        {
                            join_where: { since: ORM.eq(since_list[0]) },
                            limit: 50,
                            /**
                             * In real world, code below is pointless, you can just pass '-name',
                             * and `name` would be considered as Deco's owner(Person type), and you
                             * SHOULDN't specify the `Pet.table` here because it's wrong! NEVER do that
                             * as you can pass it in fact
                             */
                            order: [[Person.table, 'name'], 'Z'] // see generated sql by turn on `debug_sql`
                        } 
                    ).allSync();
                    Deco.extra = JohnsForDeco[0].extra;

                    var JohnsForMutt = Mutt.getOwners(
                        {},
                        {
                            join_where: { since: ORM.eq(since_list[1]) },
                            limit: 50,
                            order: '-name' // see generated sql by turn on `debug_sql`
                        } 
                    ).allSync();
                    Mutt.extra = JohnsForMutt[0].extra;

                    var John = new Person(JohnsForMutt[0]);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });
            });
        });
    });

    describe("findBy*() with extra data", function () {
        var data = {
            adopted: true
        };
        function assertion_people_for_findby (people) {
            const John = people.find(person => person.name === "John");
            assert.property(John, "pets");
            assert.ok(Array.isArray(John.pets));

            assert.equal(John.pets.length, 2);

            John.pets.forEach(pet => {
                assert.property(pet, "name");
                assert.property(pet, "extra");
                assert.isObject(pet.extra);
                assert.property(pet.extra, "since");
                assert.ok(pet.extra.since instanceof Date);

                assert.equal(typeof pet.extra.data, 'object');
                assert.equal(JSON.stringify(data), JSON.stringify(pet.extra.data));
            });
        }

        describe("findBy*() - A hasMany B, without reverse", function () {
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

            it("could find A with `findByB()`", function (done) {
                var John = Person.findByPets(
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        order: 'name',
                        autoFetch: true,
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

            it("use mismatch extra data find A with `findByB()`", function (/* done */) {
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
                                    // 1day after test since
                                    since: Date.now() + 86400 * 1e3
                                }
                            }
                        ],
                        order: 'name',
                        autoFetch: true,
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
                        order: ['name'],
                        autoFetch: true
                    }
                ).firstSync();

                assert.ok(John === null);
            });

            it("use right extra data find A with `findByB()`", function () {
                ;[
                    [
                        {since: since},
                    ],
                    [
                        {since: ORM.eq(since)},
                    ],
                    [
                        {since: {eq: since}},
                    ]
                ].forEach(([conditions]) => {
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
                                    conditions: conditions
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

        describe("findBy('extend') - A hasMany B, without reverse", function () {
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

            it('conditions is required', () => {
                var { errMsg } = runProcAndCatch(() => {
                    Person.findBySync('pets');
                });

                assert.equal(errMsg, '.findByPets() is missing a conditions object');
            });

            it("no extra properties as conditions - could find A with `findBy('extB')`", function (done) {
                var John = Person.findBy('pets', 
                    { name: "Mutt" }, 
                    // find options for host model `Person`
                    {
                        order: 'name',
                        autoFetch: true,
                    }
                ).firstSync();

                assertion_people_for_findby([John]);

                var personCount = Person.findBy('pets', { name: "Mutt" }, { autoFetch: true }).countSync();
                assert.ok(personCount, 1);

                ;[
                    'all',
                    'where',
                    'find',
                    // 'remove',
                    'run'
                ].forEach(ichainFindKey => {
                    var people = Person.findBy('pets', { name: "Mutt" }, { autoFetch: true })[`${ichainFindKey}Sync`]();
                    assertion_people_for_findby(people);
                });

                var people = Person.findBySync('pets', { name: "Mutt" }, { autoFetch: true });
                assertion_people_for_findby(people);

                // asynchronous version
                Person.findBy('pets', { name: "Mutt" }, { autoFetch: true })
                    .run(function (err, people) {
                        assertion_people_for_findby(people);
                        done();
                    });
            });

            it("implicit join find: use mismatch extra data find A with `findBy('extB')`", function (/* done */) {
                var John = Person.findBy('pets', 
                    {
                        name: "Mutt",
                        // 1day after test since
                        since: Date.now() + 86400 * 1e3
                    }, 
                    // find options for host model `Person`
                    {
                        order: 'name',
                        autoFetch: true,
                    }
                ).firstSync();

                assert.ok(John === null);

                var John = Person.findBy('pets', 
                    {
                        name: "Mutt",
                        since: ORM.ne(since)
                    }, 
                    // find options for host model `Person`
                    {
                        order: 'name',
                        autoFetch: true
                    }
                ).firstSync();

                assert.ok(John === null);
            });

            describe("explicit join find: use mismatch extra data find A with `findBy('extB')`", function (/* done */) {
                it('use greater since property', () => {
                    var John = Person.findBy('pets', 
                        { name: "Mutt" }, 
                        // find options for host model `Person`
                        {
                            /**
                             * @notice in fact, in workflow of `findBy('extB')`,
                             * 1. the whole exists would be overridden/corrected
                             * 2. `table`, `link` would be overridden/corrected
                             * 3. conditions would be collected from 2nd argument of `findBy('extB')`
                             * 
                             * we just write here to make it clear
                             */
                            exists: [
                                {
                                    table: 'person_pets',
                                    link: [ 'pets_id', 'id' ],
                                    conditions: {
                                        // 1day after test since
                                        since: Date.now() + 86400 * 1e3
                                    }
                                }
                            ],
                            order: 'name',
                            autoFetch: true,
                        }
                    ).firstSync();

                    assert.ok(John === null);
                });

                it('not equal the correct since property', () => {
                    var John = Person.findBy('pets', 
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

                it('correct association conditions, but base conditions mismatch', () => {
                    // multiple associations
                    var John = Person.findBy(
                        [
                            {
                                association_name: 'pets',
                                conditions: { name: "Mutt" }
                            },
                            {
                                association_name: 'pets',
                                conditions: { since: since }
                            }
                        ], 
                        {
                            name: "NonExistedPerson"
                        }, 
                        {
                            order: 'name',
                            autoFetch: true
                        }
                    ).firstSync();

                    assert.equal(John, null);
                });
            });

            describe("implicit join find: use right extra data find A with `findBy('extB')`", function () {
                const conditionsList = [
                    {since: since},
                    {since: ORM.eq(since)},
                    {since: {eq: since}},
                ];

                it(`by only one association' conditions`, () => {
                    conditionsList.forEach((conditions) => {
                        var John = Person.findBy('pets', 
                            {
                                name: "Mutt",
                                since: conditions.since,
                            },
                            {
                                order: 'name',
                                autoFetch: true
                            }
                        ).firstSync();

                        assert.property(John, "pets");
                        assertion_people_for_findby([John]);
                    });
                });

                it(`by multiple associations' conditions`, () => {
                    conditionsList.forEach((conditions) => {
                        var John = Person.findBy(
                            [
                                {
                                    association_name: 'pets',
                                    conditions: { name: "Mutt" }
                                },
                                {
                                    association_name: 'pets',
                                    conditions: { since: conditions.since }
                                }
                            ], 
                            {
                            }, 
                            {
                                order: 'name',
                                autoFetch: true
                            }
                        ).firstSync();
    
                        assert.property(John, "pets");
                        assertion_people_for_findby([John]);
                    });
                });
            });
            
            it.skip("explicit whereExists: use right extra data find A with `findBy('extB')`", function () {
                ;[
                    [
                        {since: since},
                    ],
                    [
                        {since: ORM.eq(since)},
                    ],
                    [
                        {since: {eq: since}},
                    ]
                ].forEach(([conditions]) => {
                    var John = Person.findBy('pets', 
                        {
                            name: "Mutt",
                        },
                        {
                            /**
                             * @notice in fact, in workflow of `findBy('extB')`,
                             * 1. `table`, `link` would be overridden/corrected
                             * 2. conditions would be collected from 2nd argument of `findBy('extB')`
                             * 
                             * we just write here to make it clear
                             */
                            exists: [
                                {
                                    table: 'person_pets',
                                    link: [
                                        'pets_id', 'id'
                                    ],
                                    conditions: conditions
                                }
                            ],
                            order: 'name',
                            autoFetch: true
                        }
                    ).firstSync();

                    assert.property(John, "pets");
                    assertion_people_for_findby([John]);

                    var John = Person.findBy(
                        [
                            {
                                association_name: 'pets',
                                conditions: { name: "Mutt" }
                            }
                        ], 
                        {}, 
                        // find options for host model `Person`
                        {
                            exists: [
                                {
                                    table: 'person_pets',
                                    link: [
                                        'pets_id', 'id'
                                    ],
                                    conditions: conditions
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
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
