var test = require("test");
test.setup();

var helper = require('../support/spec_helper');

function assertModelInstanceWithHasMany(instance) {
    assert.property(instance, '__opts')
    assert.isObject(instance.__opts, 'one_associations')

    assert.isObject(instance.__opts, 'many_associations')
    assert.isObject(instance.__opts, 'extend_associations')

    assert.property(instance.__opts, 'association_properties')
    assert.property(instance.__opts, 'fieldToPropertyMap')

    assert.property(instance.__opts, 'associations')
}

describe("hasMany", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.closeSync();
    });

    describe("normal", function () {

        var setup = function (opts) {
            opts = opts || {};

            return function (done) {
                db.settings.set('instance.identityCache', false);

                Person = db.define('person', {
                    name: String,
                    surname: String,
                    age: Number
                });
                Pet = db.define('pet', {
                    name: String
                });
                Person.hasMany('pets', Pet, {}, {
                    reverse: opts.reversePets,
                    autoFetch: opts.autoFetchPets
                });
                Person.hasMany('friends', Person, {}, {});

                helper.dropSync([Person, Pet], function () {
                    Pet.createSync([{
                        name: "Cat"
                    }, {
                        name: "Dog"
                    }]);

                    /**
                     * @relationship
                     * 
                     * John --+---> Deco
                     *        '---> Mutt <----- Jane <---- Bob
                     *
                     * Justin
                     */
                    Person.createSync([{
                        name: "Bob",
                        surname: "Smith",
                        age: 30
                    }, {
                        name: "John",
                        surname: "Doe",
                        age: 20,
                        pets: [{
                            name: "Deco"
                        }, {
                            name: "Mutt"
                        }]
                    }, {
                        name: "Jane",
                        surname: "Doe",
                        age: 16
                    }, {
                        name: "Justin",
                        surname: "Dean",
                        age: 18
                    }]);

                    var Jane = Person.find({
                        name: "Jane"
                    }).firstSync();

                    var pets = Pet.findSync({
                        name: "Mutt"
                    });

                    Jane.addPetsSync(pets);
                    Jane.addFriendsSync(
                        Person.findSync({
                            name: "Bob",
                        })
                    );
                    done();
                });
            };
        };

        describe("getAccessor", function () {
            before(setup());

            it("should allow to specify order as string", function () {
                var people = Person.findSync({
                    name: "John"
                });

                var pets = people[0].getPetsSync("-name");

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
                assert.equal(pets[0].model(), Pet);
                assert.equal(pets[0].name, "Mutt");
                assert.equal(pets[1].name, "Deco");
            });

            it("should return proper instance model", function () {
                var people = Person.findSync({
                    name: "John"
                });
                var pets = people[0].getPetsSync("-name");
                assert.equal(pets[0].model(), Pet);
            });

            it("should allow to specify order as Array", function () {
                var people = Person.findSync({
                    name: "John"
                });

                var pets = people[0].getPetsSync(["name", "Z"]);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
                assert.equal(pets[0].name, "Mutt");
                assert.equal(pets[1].name, "Deco");
            });

            it("should allow to specify a limit", function () {
                var John = Person.find({
                    name: "John"
                }).firstSync();

                var pets = John.getPetsSync(1);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
            });

            it("should allow to specify conditions", function () {
                var John = Person.find({
                    name: "John"
                }).firstSync();

                var pets = John.getPetsSync({
                    name: "Mutt"
                });

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].name, "Mutt");
            });

            it("should return a chain if no callback defined", function () {
                var people = Person.findSync({
                    name: "John"
                });
                var chain = people[0].getPets({
                    name: "Mutt"
                });

                assert.isObject(chain);
                assert.isFunction(chain.find);
                assert.isFunction(chain.only);
                assert.isFunction(chain.limit);
                assert.isFunction(chain.order);
            });

            it("should allow chaining count()", function () {
                var people = Person.findSync({});

                var count = people[1].getPets().countSync();
                assert.strictEqual(count, 2);
                count = people[2].getPets().countSync();
                assert.strictEqual(count, 1);
                count = people[3].getPets().countSync();
                assert.strictEqual(count, 0);
            });
        });

        describe("hasAccessor", function () {
            before(setup());

            it("should return true if instance has associated item", function () {
                var pets = Pet.findSync({
                    name: "Mutt"
                });
                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();
                var has_pets = Jane.hasPetsSync(pets[0]);
                assert.ok(has_pets);
            });

            // xit("should return true if not passing any instance and has associated items", function (done) {
            //     Person.find({ name: "Jane" }).first(function (err, Jane) {
            //         assert.equal(err, null);

            //         Jane.hasPets(function (err, has_pets) {
            //             assert.equal(err, null);
            //             assert.ok(has_pets);

            //             return done();
            //         });
            //     });
            // });

            it("should return false if not passing any instance", function () {
                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();
                var has_pets = Jane.hasPetsSync();
                assert.notOk(has_pets);
            });

            it("should return true if all passed instances are associated", function () {
                var pets = Pet.findSync({
                    name: ["Mutt", "Deco"]
                });
                var John = Person.find({
                    name: "John"
                }).firstSync();
                var has_pets = John.hasPetsSync(pets);
                assert.ok(has_pets);
            });

            it("should return false if any passed instances are not associated", function () {
                var pets = Pet.findSync();
                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();
                var has_pets = Jane.hasPetsSync(pets);
                assert.notOk(has_pets);
            });

            it("should return true if join table has duplicate entries", function () {
                var pets = Pet.findSync({
                    name: ["Mutt", "Deco"]
                });

                assert.equal(pets.length, 2);

                var John = Person.find({
                    name: "John"
                }).firstSync();

                var hasPets = John.hasPetsSync(pets);

                assert.equal(hasPets, true);

                db.driver.execQuerySync(
                    "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)", [John.id, pets[0].id, John.id, pets[1].id]);

                var hasPets = John.hasPetsSync(pets);
                assert.equal(hasPets, true);
            });
        });

        describe("delAccessor", function () {
            before(setup());

            it("should remove specific associations if passed", function () {
                var pets = Pet.findSync({
                    name: "Mutt"
                });
                var people = Person.findSync({
                    name: "John"
                });

                people[0].removePetsSync(pets[0]);

                var pets = people[0].getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].name, "Deco");
            });

            it("should remove all associations if none passed", function () {
                var John = Person.find({
                    name: "John"
                }).firstSync();

                John.removePetsSync();

                var pets = John.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 0);
            });
        });

        describe("addAccessor", function () {
            before(setup());

            it("might add duplicates", function () {
                var pets = Pet.findSync({
                    name: "Mutt"
                });
                var people = Person.findSync({
                    name: "Jane"
                });

                people[0].addPetsSync(pets[0]);

                var pets = people[0].getPetsSync("name");

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
                assert.equal(pets[0].name, "Mutt");
                assert.equal(pets[1].name, "Mutt");
            });

            it("should keep associations and add new ones", function () {
                var Deco = Pet.find({
                    name: "Deco"
                }).firstSync();
                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();

                var janesPets = Jane.getPetsSync();

                var petsAtStart = janesPets.length;

                Jane.addPetsSync(Deco);

                var pets = Jane.getPetsSync("name");

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, petsAtStart + 1);
                assert.equal(pets[0].name, "Deco");
                assert.equal(pets[1].name, "Mutt");
            });

            it("should accept several arguments as associations", function () {
                var pets = Pet.findSync();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();
                Justin.addPetsSync(pets[0], pets[1]);

                var pets = Justin.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
            });

            it("should accept array as list of associations", function () {
                var pets = Pet.createSync([{
                    name: 'Ruff'
                }, {
                    name: 'Spotty'
                }]);
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                var justinsPets = Justin.getPetsSync();

                var petCount = justinsPets.length;

                Justin.addPetsSync(pets);

                justinsPets = Justin.getPetsSync();

                assert.ok(Array.isArray(justinsPets));
                // Mongo doesn't like adding duplicates here, so we add new ones.
                assert.equal(justinsPets.length, petCount + 2);
            });

            it("should throw if no items passed", function () {
                var person = Person.oneSync();

                assert.throws(function () {
                    person.addPetsSync();
                });
            });
        });

        describe("setAccessor", function () {
            before(setup());

            it("should accept several arguments as associations", function () {
                var pets = Pet.findSync();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                Justin.setPetsSync(pets[0], pets[1]);

                var pets = Justin.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
            });

            it("should accept an array of associations", function () {
                var pets = Pet.findSync();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                Justin.setPetsSync(pets);

                var all_pets = Justin.getPetsSync();

                assert.ok(Array.isArray(all_pets));
                assert.equal(all_pets.length, pets.length);
            });

            it("should remove all associations if an empty array is passed", function () {
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();
                var pets = Justin.getPetsSync();
                assert.equal(pets.length, 4);

                Justin.setPetsSync([]);
                var pets = Justin.getPetsSync();
                assert.equal(pets.length, 0);
            });

            it("clears current associations", function () {
                var pets = Pet.findSync({
                    name: "Deco"
                });
                var Deco = pets[0];

                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();

                var pets = Jane.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].name, "Mutt");

                Jane.setPetsSync(Deco);

                var pets = Jane.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].name, Deco.name);
            });
        });

        describe("findBy*()", function () {
            function assertion_people_for_findby (people) {
                assert.equal(people.length, 2);
                
                var Jane = people.find(person => person.name === "Jane")
                var JanePets = Jane.getPetsSync("-name");
                
                assert.ok(Array.isArray(JanePets));
                assert.equal(JanePets.length, 1);
                assert.equal(JanePets[0].model(), Pet);
                assert.equal(JanePets[0].name, "Mutt");
                
                var John = people.find(person => person.name === "John")
                var JohnPets = John.getPetsSync("-name");
                
                assert.ok(Array.isArray(JohnPets));
                assert.equal(JohnPets.length, 2);
                assert.equal(JohnPets[0].model(), Pet);
                assert.equal(JohnPets[0].name, "Mutt");
                assert.equal(JohnPets[1].name, "Deco");
            }

            function assertion_pets_for_findby (pets) {
                assert.equal(pets.length, 2);
                
                var Mutt = pets.find(pet => pet.name === "Mutt")
                var MuttOwners = Mutt.getOwnersSync("-name");
                
                assert.ok(Array.isArray(MuttOwners));
                assert.equal(MuttOwners.length, 2);
                assert.equal(MuttOwners[0].model(), Person);
                assert.equal(MuttOwners[0].name, "John");
                assert.equal(MuttOwners[1].name, "Jane");
                
                var Deco = pets.find(pet => pet.name === "Deco")
                var DecoOwners = Deco.getOwnersSync("-name");
                
                assert.ok(Array.isArray(DecoOwners));
                assert.equal(DecoOwners.length, 1);
                assert.equal(DecoOwners[0].model(), Person);
                assert.equal(DecoOwners[0].name, "John");
            }

            describe("findBy() - A hasMany B, with reverse", function () {
                before(setup({
                    reversePets: 'owners',
                    autoFetchPets: false
                }));

                it("could find A with `findByB()`", function (done) {
                    var John = Person.findByPets({ name: "Mutt" }, { order: 'name' }).lastSync();
                    var Jane = Person.findByPets({ name: "Mutt" }, { order: 'name' }).firstSync();
                    assertion_people_for_findby([John, Jane]);

                    var John = Person.findByPets({ name: "Mutt" }, {  }).firstSync();
                    var Jane = Person.findByPets({ name: "Mutt" }, {  }).lastSync();
                    assertion_people_for_findby([John, Jane]);

                    var personCount = Person.findByPets({ name: "Mutt" }, {  }).countSync();
                    assert.ok(personCount, 2);

                    ;[
                        'all',
                        'where',
                        'find',
                        // 'remove',
                        'run'
                    ].forEach(ichainFindKey => {
                        var people = Person.findByPets({ name: "Mutt" })[`${ichainFindKey}Sync`]();
                        assertion_people_for_findby(people);
                    });

                    var people = Person.findByPetsSync({ name: "Mutt" });
                    assertion_people_for_findby(people);

                    var people = Person.findBy('pets', { name: "Mutt" }).runSync();
                    assertion_people_for_findby(people);

                    // asynchronous version
                    Person.findByPets({ name: "Mutt" })
                        .run(function (err, people) {
                            assertion_people_for_findby(people);
                            done();
                        });
                });

                it("could find B with `findbyA()`", function (done) {
                    var Mutt = Pet.findByOwners({ name: "John" }, {
                        Owners_find_options: { order: 'name' }
                    }).lastSync();
                    var Deco = Pet.findByOwners({ name: "John" }, {
                        Owners_find_options: { order: 'name' }
                    }).firstSync();
                    assertion_pets_for_findby([Mutt, Deco]);

                    var Mutt = Pet.findByOwners({ name: "John" }, {  }).firstSync();
                    var Deco = Pet.findByOwners({ name: "John" }, {  }).lastSync();
                    assertion_pets_for_findby([Mutt, Deco]);

                    var personCount = Pet.findByOwners({ name: "John" }, {  }).countSync();
                    assert.ok(personCount, 2);

                    ;[
                        'all',
                        'where',
                        'find',
                        // 'remove',
                        'run'
                    ].forEach(ichainFindKey => {
                        var people = Pet.findByOwners({ name: "John" })[`${ichainFindKey}Sync`]();
                        assertion_pets_for_findby(people);
                    });

                    var pets = Pet.findByOwnersSync({ name: "John" });
                    assertion_pets_for_findby(pets);

                    var pets = Pet.findBy('owners', { name: "John" }).runSync();
                    assertion_pets_for_findby(pets);

                    // asynchronous version
                    Pet.findByOwners({ name: "John" })
                        .run(function (err, pets) {
                            assertion_pets_for_findby(pets);
                            done();
                        });
                });

                it("could find A with `findBy([...])`", function () {
                    /**
                     * View details in @relationship above
                     */
                    var Nil = Person.findBy(
                        [
                            {
                                association_name: 'pets',
                                conditions: { name: "Deco" }
                            },
                            {
                                association_name: 'friends',
                                conditions: { name: "Bob" }
                            }
                        ],
                        {},
                        {
                            order: '-name'
                        }
                    ).firstSync();
                    assert.ok(!Nil);

                    var John = Person.findBy(
                        [
                            {
                                association_name: 'pets',
                                conditions: { name: "Mutt" }
                            }
                        ],
                        {},
                        {
                            order: '-name'
                        }
                    ).firstSync();
                    var Jane = Person.findBy(
                        [
                            {
                                association_name: 'pets',
                                conditions: { name: "Mutt" }
                            },
                            {
                                association_name: 'friends',
                                conditions: { name: "Bob" }
                            }
                        ],
                        {},
                        {
                        }
                    ).firstSync();
                    assertion_people_for_findby([John, Jane]);
                });

                it("zero count", function () {
                    var personCount = Pet.findByOwners({ name: "Bob" }, {  }).countSync();
                    assert.equal(personCount, 0);
                })
            });

            describe("findBy() - A hasMany B, without reverse", function () {
                before(setup({
                    autoFetchPets: false
                }));

                it("could find A with `findByB()`", function (done) {
                    var John = Person.findByPets({ name: "Mutt" }, { order: 'name' }).lastSync();
                    var Jane = Person.findByPets({ name: "Mutt" }, { order: 'name' }).firstSync();
                    assertion_people_for_findby([John, Jane]);

                    var John = Person.findByPets({ name: "Mutt" }, {  }).firstSync();
                    var Jane = Person.findByPets({ name: "Mutt" }, {  }).lastSync();
                    assertion_people_for_findby([John, Jane]);

                    var personCount = Person.findByPets({ name: "Mutt" }, {  }).countSync();
                    assert.ok(personCount, 2);

                    ;[
                        'all',
                        'where',
                        'find',
                        // 'remove',
                        'run'
                    ].forEach(ichainFindKey => {
                        var people = Person.findByPets({ name: "Mutt" })[`${ichainFindKey}Sync`]();
                        assertion_people_for_findby(people);
                    });

                    var people = Person.findByPetsSync({ name: "Mutt" });
                    assertion_people_for_findby(people);

                    var people = Person.findBy('pets', { name: "Mutt" }).runSync();
                    assertion_people_for_findby(people);

                    // asynchronous version
                    Person.findByPets({ name: "Mutt" })
                        .run(function (err, people) {
                            assertion_people_for_findby(people);
                            done();
                        });
                });
            });
        });

        describe("with autoFetch turned on", function () {
            before(setup({
                autoFetchPets: true
            }));

            it("should fetch associations", function () {
                var John = Person.find({
                    name: "John"
                }).firstSync();

                assert.property(John, "pets");
                assert.ok(Array.isArray(John.pets));
                assert.equal(John.pets.length, 2);
            });

            it("should save existing", function () {
                Person.createSync({
                    name: 'Bishan'
                });
                var person = Person.oneSync({
                    name: 'Bishan'
                });
                person.surname = 'Dominar';
                person.saveSync();
            });

            it("should not auto save associations which were autofetched", function () {
                var pets = Pet.allSync();
                assert.equal(pets.length, 4);

                var paul = Person.createSync({
                    name: 'Paul'
                });

                var paul2 = Person.oneSync({
                    name: 'Paul'
                });

                assert.equal(paul2.pets.length, 0);

                paul.setPetsSync(pets);

                // reload paul to make sure we have 2 pets
                var paul = Person.oneSync({
                    name: 'Paul'
                });
                assert.equal(paul.pets.length, 4);

                // Saving paul2 should NOT auto save associations and hence delete
                // the associations we just created.
                paul2.saveSync();

                // let's check paul - pets should still be associated
                var paul = Person.oneSync({
                    name: 'Paul'
                });
                assert.equal(paul.pets.length, 4);
            });

            it("should save associations set by the user", function () {
                var john = Person.oneSync({
                    name: 'John'
                });

                assert.equal(john.pets.length, 2);

                john.pets = [];

                john.saveSync();

                // reload john to make sure pets were deleted
                var john = Person.oneSync({
                    name: 'John'
                });
                assert.equal(john.pets.length, 0);
            });

        });
    });

    describe("with non-standard keys", function () {
        var Email;
        var Account;

        var setup = function (opts) {
            Email = db.define('email', {
                text: {
                    type: 'text',
                    key: true,
                    required: true
                },
                bounced: Boolean
            });

            Account = db.define('account', {
                name: String
            });

            Account.hasMany('emails', Email, {}, {
                key: opts.key
            });

            helper.dropSync([Email, Account]);
        };

        it("should place ids in the right place", function () {
            setup({});
            var emails = Email.createSync([{
                bounced: true,
                text: 'a@test.com'
            }, {
                bounced: false,
                text: 'z@test.com'
            }]);

            var account = Account.createSync({
                name: "Stuff"
            });
            assertModelInstanceWithHasMany(account)

            account.addEmailsSync(emails[1]);

            var data = db.driver.execQuerySync("SELECT * FROM account_emails");

            assert.equal(data[0].account_id, 1);
            assert.equal(data[0].emails_text, 'z@test.com');
        });

        it("should generate correct tables", function () {
            setup({});

            var protocol = db.driver.db.conn.type;
            var sql;

            if (protocol == 'SQLite') {
                sql = "PRAGMA table_info(?)";
            } else {
                sql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? AND table_schema = ? ORDER BY data_type";
            }

            var cols = db.driver.execQuerySync(sql, ['account_emails', db.driver.config.database]);

            if (protocol == 'SQLite') {
                assert.equal(cols[0].name, 'account_id');
                assert.equal(cols[0].type, 'INTEGER');
                assert.equal(cols[1].name, 'emails_text');
                assert.equal(cols[1].type, 'TEXT');
            } else if (protocol == 'mysql') {
                assert.equal(cols[0].column_name, 'account_id');
                assert.equal(cols[0].data_type, 'int');
                assert.equal(cols[1].column_name, 'emails_text');
                assert.equal(cols[1].data_type, 'varchar');
            }
        });

        it("should add a composite key to the join table if requested", function () {
            setup({
                key: true
            });

            var protocol = db.driver.db.conn.type;
            var sql;

            if (protocol == 'mysql') {
                var data = db.driver.execQuerySync("SHOW KEYS FROM ?? WHERE Key_name = ?", ['account_emails', 'PRIMARY']);

                assert.equal(data.length, 2);
                assert.equal(data[0].Column_name, 'account_id');
                assert.equal(data[0].Key_name, 'PRIMARY');
                assert.equal(data[1].Column_name, 'emails_text');
                assert.equal(data[1].Key_name, 'PRIMARY');
            } else if (protocol == 'SQLite') {
                var data = db.driver.execQuerySync("pragma table_info(??)", ['account_emails']);
                assert.equal(data.length, 2);
                assert.equal(data[0].name, 'account_id');
                assert.equal(data[0].pk, 1);
                assert.equal(data[1].name, 'emails_text');
                assert.equal(data[1].pk, 2);
            }
        });
    });

    describe("accessors", function () {
        var Email;
        var Account;

        var setup = function (opts) {
            Email = db.define('email', {
                text: {
                    type: 'text',
                    key: true,
                    required: true
                },
                bounced: Boolean
            });

            Account = db.define('account', {
                name: String
            });

            Account.hasMany('emails', Email, {}, {
                mergeTable: 'custom_account_emails',
                mergeId: 'custom_accountid',
                mergeAssocId: 'custom_emailid',
                key: opts.key
            });

            helper.dropSync([Email, Account]);
        };

        it('should query association model data with getAccessor', function () {
            setup({})
            var emails = Email.createSync([{
                bounced: true,
                text: 'a@test.com'
            }, {
                bounced: false,
                text: 'z@test.com'
            }]);

            var account = Account.createSync({
                name: "Stuff"
            });
            account.addEmailsSync(emails);

            var assoc = account.__opts.many_associations.find(x => x.name === 'emails')

                ;['bounced', 'text'].forEach((field) => {
                    emails.forEach((email) => {
                        assert.equal(
                            email[field],
                            account[assoc['getAccessor']]()
                                .find({ [field]: email[field] })
                                .firstSync()[field]
                        )
                    })
                });
        })
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}