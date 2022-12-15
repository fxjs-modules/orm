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

describe("hasMany with extra properties", function () {
    /** @type {import('../..').ORM} */
    var db = null;
    var Person = null;
    var Pet = null;

    var setup = function (opts) {
        opts = opts || {};
        return function () {
            db.settings.set('instance.identityCache', false);

            Person = db.define('person', {
                name: { type: 'text', mapsTo: 'name' },
            }, opts);
            Pet = db.define('pet', {
                name: { type: 'text', mapsTo: 'name' },
            });
            Person.hasMany('pets', Pet, {
                name2: {
                    type: 'text',
                    // repeat mapsTo, pointless, but should not cause any problems
                    mapsTo: 'name',
                    // TODO: 
                    // 1. add failure test about it on sql execution
                    // 2. add failure test about it on before add
                    required: true
                },
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

    describe('robust', function () {
        before(setup());

        it('disallow duplicate property name on extra properties', () => {
            var { errMsg } = runProcAndCatch(() => {
                Person.hasMany('pets_with_name', Pet, {
                    name: String
                })
            });

            assert.equal(errMsg, `disallow defining same name extra property 'name' with property on model 'pet'`);
        });
    });

    describe("getAccessor with join_where", function () {
       const bt = cutOffMilliSecond(new Date());
        const since_list = Array.apply(null, {length: 2}).fill(undefined).map((_, idx) => {
            return new Date(bt.getTime() + 86400 * 1e3 * idx)
        });

        var data = { adopted: true };

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
                assert.property(pet.extra, "name2");
                
                assert.ok(pet.extra.since instanceof Date);
                assert.equal(pet.extra.since + '', since_list[idx] + '');

                assert.equal(pet.extra.name2, `name2-${idx}`);

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
                        name2: `name2-${idx}`,
                        data: data
                    });
                });
            });

            it("could get B from A with filter to join table", function () {
                var John = Person.find(
                    { name: "John" }, 
                ).firstSync();

                var Deco = John.getPets({
                    since: db.comparators.eq(since_list[0])
                }).firstSync();

                var Mutt = John.getPets({
                    since: db.comparators.eq(since_list[1])
                }).firstSync();

                John.pets = [Deco, Mutt];

                assertion_people_for_get_with_join_where([John]);
            });

            it("find item with non-exists join where condition", function () {
                var John = Person.find(
                    { name: "John" }, 
                ).firstSync();
                
                var Invalid = John.getPets({
                    since: ORM.lt(since_list[0])
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
                        name2: `name2-${idx}`,
                        data: data
                    });
                });
            });

            describe("could get A from B with filter to join table", function () {
                it("only join conditions", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnForDeco = Deco.getOwners(
                        { since: db.comparators.eq(since_list[0]) },
                    ).firstSync();
                    Deco.extra = JohnForDeco.extra;

                    var JohnForMutt = Mutt.getOwners(
                        { since: db.comparators.eq(since_list[1]) }
                    ).firstSync();
                    Mutt.extra = JohnForMutt.extra;

                    var John = new Person(JohnForMutt);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });

                it("with limit", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnForDeco = Deco.getOwners(
                        { since: db.comparators.eq(since_list[0]) },
                        { limit: 50 }
                    ).allSync()[0];
                    Deco.extra = JohnForDeco.extra;

                    var JohnForMutt = Mutt.getOwners(
                        { since: db.comparators.eq(since_list[1]) },
                        { limit: 50 }
                    ).allSync()[0];
                    Mutt.extra = JohnForMutt.extra;

                    var John = new Person(JohnForMutt);
                    John.pets = [Deco, Mutt];

                    assertion_people_for_get_with_join_where([John]);
                });
                
                it("with limit/order", () => {
                    var Deco = Pet.find({ name: "Deco" }).firstSync();
                    var Mutt = Pet.find({ name: "Mutt" }).firstSync();

                    var JohnsForDeco = Deco.getOwners(
                        { since: db.comparators.eq(since_list[0]) },
                        {
                            limit: 50,
                            order: [[Person.table, 'name'], 'Z']
                        } 
                    ).allSync();
                    Deco.extra = JohnsForDeco[0].extra;

                    var JohnsForMutt = Mutt.getOwners(
                        { since: db.comparators.eq(since_list[1]) },
                        {
                            limit: 50,
                            order: '-name'
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
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
