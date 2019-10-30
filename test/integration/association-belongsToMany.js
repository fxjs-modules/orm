var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Association belongsToMany", function () {
    var db = null;
    var Pet = null;
    var Person = null;
    var PersonPets = null

    function setup() {
        Person = db.define("person", {
            name: String
        });
        Pet = db.define("pet", {
            name: {
                type: "text",
                defaultValue: "Mutt"
            }
        });
        PersonPets = Pet.belongsToMany(Person, {
            as: "pets",
            collection: "person_pets"
        });

        PetOwners = Person.belongsToMany(Pet, {
            as: "owners",
            collection: "person_pets"
        });

        Person.drop();
        Pet.drop();
        PersonPets.drop();
        PetOwners.drop();

        db.sync();
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    describe("Model existence", function () {
        before(setup);

        it("association models has corresponding association", function () {
            assert.property(db.models, 'person')
            assert.equal(db.models.person, Person)
            assert.property(db.models, 'pet')
            assert.equal(db.models.pet, Pet)

            assert.property(Person.associations, 'pets')
            assert.equal(Person.associations.pets, PersonPets)
            assert.equal(Person.associations.pets.sourceModel, Person)
            assert.equal(Person.associations.pets.targetModel, Pet)

            assert.notProperty(Person.associations, 'owners')

            assert.property(Pet.associations, 'owners')
            assert.equal(Pet.associations.owners, PetOwners)
            assert.equal(Pet.associations.owners.sourceModel, Pet)
            assert.equal(Pet.associations.owners.targetModel, Person)
            assert.notProperty(Pet.associations, 'pets')

            assert.notProperty(db.models, 'person_pets')
            assert.notProperty(db.models, 'pet_owners')
        });

        it("keys of associated model", function () {
            assert.deepEqual(Person.associations.pets.sourceKeys, ['id'])
            assert.deepEqual(Person.associations.pets.targetKeys, ['id'])

            assert.deepEqual(Pet.associations.owners.sourceKeys, ['id'])
            assert.deepEqual(Pet.associations.owners.targetKeys, ['id'])
        });

        it("keys of association model", function () {
            assert.deepEqual(PersonPets.ids, [ "person_id", "pet_id" ])
            assert.deepEqual(PetOwners.ids, [ "pet_id", "person_id" ])
        });

        it("distingush model though they connection same collections", function () {
            assert.ok(PersonPets !== PetOwners)
        });
    });

    describe("Association", function () {
        before(setup);

        it('merge model has association property', function () {
            assert.property(PersonPets.properties, 'person_id')
            assert.property(PersonPets.properties, 'pet_id')
        })

        it('attach PersonPets to source model', function () {
            assert.propertyVal(PersonPets.associationInfo, 'collection', 'person_pets')

            assert.property(Person.associations, 'pets')
            assert.notProperty(Pet.associations, 'persons')
        });

        it("associated key properties existed", () => {
            assert.ok(PersonPets.hasPropertyRemotely('pet_id'))
            assert.ok(PersonPets.hasPropertyRemotely('person_id'))
        });
    });

    describe("if element has an association", function () {
        before(setup);

        it("should also create it or save it", function () {
            var John = Person.create({
                name: "John Doe",
                pets: [Pet.New({
                    name: "Deco"
                })]
            });

            assert.propertyVal(John, "name", "John Doe");

            assert.ok(Array.isArray(John.pets));

            assert.propertyVal(John.pets[0], "name", "Deco");

            assert.property(John.pets[0], Pet.ids[0]);

            assert.ok(John.pets[0].$saved);
            assert.ok(John.pets[0].$isPersisted);
        });

        it("should also create it or save it even if it's an object and not an instance", function () {
            var John = Person.create({
                name: "John Doe",
                pets: [
                    {
                        name: "Deco"
                    }
                ]
            });

            assert.propertyVal(John, "name", "John Doe");

            assert.ok(Array.isArray(John.pets));

            assert.propertyVal(John.pets[0], "name", "Deco");
            assert.property(John.pets[0], Pet.ids[0]);
            assert.ok(John.pets[0].$saved);
        });
    });

    describe("accessors", function () {
        before(setup);
        var John, Deco

        function initData ({ doSave = true } = {}) {
            return () => {
                John = Person.create({
                    name: "John Doe",
                });

                if (doSave) {
                    John.$saveRef('pets', {
                        name: "Deco"
                    });

                    Deco = John.pets[0];
                }
            }
        }

        describe("#$saveRef", function () {
            before(initData())

            it("basic", function () {
                assert.isTrue(John.$hasRef('pets').final)

                assert.exist(John.pets);
                assert.isArray(John.pets);

                Deco = John.pets[0];

                assert.exist(PersonPets.one({ where: { person_id: John.id, pet_id: Deco.id } }))
            })
        });

        describe("#$getRef", function () {
            before(initData({ doSave: false }))

            it("basic", function () {
                var _Deco = John.$getRef('pets')[0];

                assert.exist(_Deco.id)
                assert.equal(Deco.id, _Deco.id)
            });

            it("use where conditions to filter", function () {
                var _Deco = John.$getRef('pets', {
                    where: {
                        [Pet.propIdentifier('name')]: 'Deco'
                    }
                })[0];

                assert.exist(_Deco.id)
                assert.equal(Deco.id, _Deco.id)

                var found = John.$getRef('pets', {
                      where: {
                        [Pet.propIdentifier('name')]: 'Invalid Name'
                      }
                  });

                assert.isArray(found)
                assert.equal(found.length, 0)
            });

            it("valid ref name is requried", function () {
                assert.throws(() => {
                    John.$getRef()
                })

                assert.throws(() => {
                    John.$getRef('non-existed')
                })
            });
        });

        describe("#$hasRef", function () {
            before(initData())

            it("basic", function () {
                assert.isTrue(John.$hasRef('pets').final)

                assert.isTrue(John.$hasRef('pets', Deco).final)
                assert.isTrue(John.$hasRef('pets', [Deco]).final)

                assert.isTrue(John.$hasRef('pets', { id: Deco.id }).final)
                assert.isTrue(John.$hasRef('pets', [{ id: Deco.id }]).final)
            })
        });

        describe("#$unlinkRef", function () {
            before(initData())

            it("basic", function () {
                assert.throws(() => {
                    John.$unlinkRef()
                })

                assert.isTrue(John.$hasRef('pets').final)
                John.$unlinkRef('pets')

                assert.isFalse(John.$hasRef('pets').final)
                John.$addRef('pets', Deco)
                assert.isTrue(John.$hasRef('pets').final)

                John.$unlinkRef('pets', Deco)
                assert.isFalse(John.$hasRef('pets').final)
            });
        });
    });

    describe("findByRef", function () {
        before(setup);
        var John, Jane

        function getPets ({ ownerName }) {
          return Array(20).fill(undefined).map((_, idx) => (
            {
              name: `${ownerName}'s Pet ${idx}`
            }
          ));
        }

        function initData ({ doSave = true } = {}) {
            return () => {
                John = Person.create({
                    name: "John Doe",
                });
                Jane = Person.create({
                    name: "Jane Dan",
                });

                if (doSave) {
                    John.$saveRef('pets', getPets({ ownerName: 'John' }));
                    Jane.$saveRef('pets', getPets({ ownerName: 'Jane' }));

                    Deco = John.pets[0];
                }
            }
        }

        describe("findByRef() - A belongsToMany B", function () {
          before(initData())

          it("basic", function () {
            var _John = Person.findByRef('pets', {
              [Pet.propIdentifier('name')]: Pet.Opf.startsWith('John\'s')
            })[0];

            assert.exist(_John.id)
            assert.equal(_John.id, John.id)

            var _Jane = Person.findByRef('pets', {
              [Pet.propIdentifier('name')]: Pet.Opf.startsWith('Jane\'s')
            })[0];

            assert.exist(_Jane.id)
            assert.equal(_Jane.id, Jane.id)
          });

          it("not found", function () {
            var found = Person.findByRef('pets', {
              [Pet.propIdentifier('name')]: Pet.Opf.startsWith('Invalid\'s')
            });

            assert.isArray(found)
            assert.equal(found.length, 0)
          });
        });
    })

    describe("accessors - source no serial id", function () {
        var Email;
        var Station;

        var setup = function (opts) {
            return function () {
              Email = db.define('email', {
                  text: {
                      type: 'text',
                      key: true,
                      required: true
                  },
                  bounced: Boolean
              });

              Station = db.define('station', {
                  name: String
              });

              Email.belongsToMany(Station, {
                as: 'emails',
                collection: 'custom_station_emails',
                sourceJoinPropertyName: 'custom_stationid',
                targetJoinPropertyName: 'custom_emailid',
              });

              helper.dropSync([Email, Station]);
            }
        };

        describe('#addRef', function () {
            before(setup({}))

            it("basic", function () {
              var emails = Email.create([{
                  bounced: true,
                  text: 'a@test.com'
              }, {
                  bounced: false,
                  text: 'z@test.com'
              }]);

              var station = Station.create({
                  name: "Stuff"
              });
              station.$addRef('emails', emails);
            });
        });
    });
});
