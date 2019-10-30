var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model APIs", function () {
    var db = null;
    var Pet = null;
    var Person = null;
    var PersonPets = null;

    var models = {};

    function resync() {
        Object.values(models).forEach(m => m.drop());
        Person.drop();
        Pet.drop();

        db.sync();
    }

    function setup() {
        Person = db.define("person", {
            name: String,
            email: {
                type: 'text',
                defaultValue: 'xxx@gmail.com',
                mapsTo: 'emailaddress'
            }
        });
        Pet = db.define("pet", {
            name: {
                type: "text",
                defaultValue: "Mutt",
                mapsTo: 'pet_name'
            },
            age: {
                type: 'integer',
                defaultValue: 0,
                mapsTo: 'pet_age'
            }
        });

         Person.belongsToMany(Pet, { as: "owners" });
         Pet.belongsToMany(Person, { as: "pets" });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    describe("Model APIs about property", function () {
        before(setup);

        describe("#normalizePropertiesToData", function () {
            before(setup);

            it("simple", function () {
                ;[
                    [{
                        id: 1,
                        name: 'Jane',
                        email: 'Jane@gmail.com'
                    }, {
                        id: 1,
                        name: 'Jane',
                        emailaddress: 'Jane@gmail.com'
                    }],
                    [{
                        id: 2,
                        name: 'Joey',
                        emailaddress: 'Joey@gmail.com'
                    }, {
                        id: 2,
                        name: 'Joey',
                        emailaddress: 'Joey@gmail.com'
                    }]
                ].forEach(([input, output]) => {
                    assert.deepEqual(
                        Person.normalizePropertiesToData(input),
                        output
                    )
                });
            });

            it("leave out invalid input", function () {
                assert.deepEqual(
                    Person.normalizePropertiesToData({
                        id: 1,
                        name: 'Jane',
                        emailaddress1: 'Jane@gmail.com'
                    }),
                    {
                        id: 1,
                        name: 'Jane',
                    }
                )
            });

            it("defaultValue not work here", function () {
                assert.deepEqual(
                    Person.normalizePropertiesToData({
                        id: 1,
                        name: 'Jane',
                        emailaddress: undefined
                    }),
                    {
                        id: 1,
                        name: 'Jane',
                        emailaddress: undefined
                    }
                )

                assert.deepEqual(
                    Pet.normalizePropertiesToData({
                        id: 1,
                        name: 'Deco',
                        age: undefined
                    }),
                    {
                        id: 1,
                        pet_name: 'Deco',
                        pet_age: undefined
                    }
                )
            });
        });

        describe("#normalizeDataIntoInstance", function () {
            before(setup);

            it("simple", function () {
                assert.deepEqual(
                    Person.normalizeDataIntoInstance({
                        id: 1,
                        name: 'Jane',
                        emailaddress: 'Jane@gmail.com'
                    }),
                    {
                        id: 1,
                        name: 'Jane',
                        email: 'Jane@gmail.com'
                    }
                )

                assert.deepEqual(
                    Pet.normalizeDataIntoInstance({
                        id: 1,
                        pet_name: 'Deco',
                        pet_age: undefined
                    }),
                    {
                        id: 1,
                        name: 'Deco',
                        age: undefined
                    }
                )
            });

            it("leave out invalid input", function () {
                assert.deepEqual(
                    Person.normalizeDataIntoInstance({
                        id: 1,
                        name: 'Jane',
                    }),
                    {
                        id: 1,
                        name: 'Jane',
                    }
                )

                assert.deepEqual(
                    Pet.normalizeDataIntoInstance({
                        id: 1,
                        name1: 'Deco',
                        age1: 10
                    }),
                    {
                        id: 1,
                    }
                )
            });

            it("defaultValue not work here", function () {
                assert.deepEqual(
                    Person.normalizeDataIntoInstance({
                        id: 1,
                        name: 'Jane',
                        emailaddress: undefined
                    }),
                    {
                        id: 1,
                        name: 'Jane',
                        emailaddress: undefined
                    }
                )
            });
        });

        describe("#addProperty", function () {
            before(setup);

            it("add non-existed property", function () {
                Person.addProperty("non-existed", {
                    type: "text",
                    mapsTo: "non_exsited"
                });
            });

            it("add existed name of property", function () {
                assert.throws(() => {
                    Person.addProperty("name", String);
                });
            });

            it("add existed name of association", function () {
                assert.throws(() => {
                    Person.addProperty("pets", String);
                });
            });

            it("add property safely", function () {
                let added = false
                if (!Person.fieldInfo("name")) {
                    Person.addProperty("name", String);
                    added = true
                }

                assert.strictEqual(added, false);

                added = false
                if (!Person.fieldInfo("non-existed2")) {
                    Person.addProperty("non-existed2", String);
                    added = true
                }

                assert.strictEqual(added, true);
            });
        });
    });

    describe("Model APIs about associations", function () {
        before(setup);

        describe("#filterOutAssociatedData", function () {
            it("basic", function () {
                assert.deepEqual(
                    Person.filterOutAssociatedData({
                        id: 1,
                        name: "Jane",
                        pets: [
                            {
                                id: 1,
                                name: "Deco"
                            },
                            {
                                id: 2,
                                name: "Mary"
                            }
                        ]
                    })
                    .filter(x => x.association.targetModel === Pet)
                    .map(x => x.dataset)[0],
                    [
                        {
                            id: 1,
                            name: "Deco"
                        },
                        {
                            id: 2,
                            name: "Mary"
                        }
                    ]
                )
            });
        });
    });
});
