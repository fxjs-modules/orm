var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("hasOne", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    var setup = function (autoFetch) {
        return function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);

            Person = db.define('person', {
                id: {
                    type: "integer",
                    mapsTo: "personID",
                    key: true
                },
                firstName: {
                    type: "text",
                    size: "255"
                },
                lastName: {
                    type: "text",
                    size: "255"
                }
            });

            Pet = db.define('pet', {
                id: {
                    type: "integer",
                    mapsTo: "petID",
                    key: true
                },
                petName: {
                    type: "text",
                    size: "255"
                },
                ownerID: {
                    type: "integer",
                    size: "4"
                }
            });

            Pet.hasOne('owner', Person, {
                field: 'ownerID',
                autoFetch: autoFetch
            });

            helper.dropSync([Person, Pet], function () {
                Pet.createSync([{
                    id: 10,
                    petName: 'Muttley',
                    owner: {
                        id: 12,
                        firstName: 'Stuey',
                        lastName: 'McG'
                    }
                }, {
                    id: 11,
                    petName: 'Snagglepuss',
                    owner: {
                        id: 0,
                        firstName: 'John',
                        lastName: 'Doe'
                    }
                }]);
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("auto fetch", function () {
        before(setup(true));

        it("should work for non-zero ownerID ", function () {
            var pets = Pet.findSync({
                petName: "Muttley"
            });

            assert.equal(pets[0].petName, "Muttley");
            assert.property(pets[0], "id");
            assert.equal(pets[0].id, 10);
            assert.equal(pets[0].ownerID, 12);

            assert.property(pets[0], "owner");
            assert.equal(pets[0].owner.firstName, "Stuey");
        });

        it("should work for zero ownerID ", function () {
            var pets = Pet.findSync({
                petName: "Snagglepuss"
            });

            assert.equal(pets[0].petName, "Snagglepuss");
            assert.property(pets[0], "id");
            assert.equal(pets[0].id, 11);

            var people = db.models.person.allSync();
        });
    });

    describe("no auto fetch", function () {
        before(setup(false));

        it("should work for non-zero ownerID ", function () {
            var pets = Pet.findSync({
                petName: "Muttley"
            });

            assert.equal(pets[0].petName, "Muttley");
            assert.property(pets[0], "id");
            assert.equal(pets[0].id, 10);
            assert.equal(pets[0].ownerID, 12);

            assert.notProperty(pets[0], "owner");

            // But we should be able to see if its there
            var result = pets[0].hasOwnerSync();
            assert.equal(result, true);

            // ...and then get it
            var result = pets[0].getOwnerSync();
            assert.equal(result.firstName, "Stuey");
        });

        it("should work for zero ownerID ", function () {
            var pets = Pet.findSync({
                petName: "Snagglepuss"
            });

            assert.equal(pets[0].petName, "Snagglepuss");
            assert.property(pets[0], "id");
            assert.equal(pets[0].id, 11);
            assert.equal(pets[0].ownerID, 0);

            assert.notProperty(pets[0], "owner");

            // But we should be able to see if its there
            var result = pets[0].hasOwnerSync();
            assert.equal(result, true);

            // ...and then get it
            result = pets[0].getOwnerSync();
            assert.equal(result.firstName, "John");
        });
    });
});