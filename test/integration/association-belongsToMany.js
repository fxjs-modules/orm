var helper = require('../support/spec_helper');
var ORM = require('../../');

odescribe("Association belongsToMany", function () {
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

    odescribe("Model existence", function () {
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
});
