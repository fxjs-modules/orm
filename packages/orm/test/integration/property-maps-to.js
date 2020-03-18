var _ = require('lodash');
var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Property.mapsTo", function () {
    var db = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("normal", function () {
        var Book = null;
        var id1 = null,
            id2 = null;

        before(function () {
            Book = db.define("book", {
                title: {
                    type: 'text',
                    mapsTo: 'book_title',
                    required: true
                },
                pages: {
                    type: 'integer',
                    required: false
                }
            });
            return helper.dropSync(Book);
        });

        it("should create", function () {
            var book = Book.createSync({
                title: "History of the wheel",
                pages: 297
            });
            assert.exist(book);
            assert.equal(book.title, "History of the wheel");
            id1 = book.id;
        });

        it("should save new", function () {
            var book = new Book({
                title: "Stuff",
                pages: 33
            })
            book = book.saveSync();

            assert.exist(book);
            assert.equal(book.title, "Stuff");
            id2 = book.id;
        });

        it("should get book1", function () {
            var book = Book.getSync(id1);
            assert.exist(book);
            assert.equal(book.title, "History of the wheel");
        });

        it("should get book2", function () {
            var book = Book.getSync(id2);
            assert.exist(book);
            assert.equal(book.title, "Stuff");
        });

        it("should find", function () {
            var book = Book.oneSync({
                title: "History of the wheel"
            });
            assert.exist(book);
            assert.equal(book.title, "History of the wheel");
        });

        it("should update", function () {
            var book = Book.oneSync();
            assert.exist(book);
            assert.equal(book.title, "History of the wheel");

            book.title = "Quantum theory";
            book.pages = 5;

            book.saveSync();
            assert.equal(book.title, "Quantum theory");

            var freshBook = Book.getSync(book.id);
            assert.exist(freshBook);
            assert.equal(book.title, "Quantum theory");
        });

        it("should order", function () {
            Book.createSync({
                title: "Zzz",
                pages: 2
            });
            Book.createSync({
                title: "Aaa",
                pages: 3
            });

            var items = Book.find().order("-title").allSync();
            assert.equal(
                _.map(items, 'title').join(','),
                "Zzz,Stuff,Quantum theory,Aaa"
            )
            items = Book.find().order("title").allSync();
            assert.equal(
                _.map(items, 'title').join(','),
                "Aaa,Quantum theory,Stuff,Zzz"
            )
        });
    });

    describe("keys", function () {
        var Person = null;
        var id1 = null,
            id2 = null;

        before(function () {
            Person = db.define("person", {
                firstName: {
                    type: 'text',
                    mapsTo: 'first_name',
                    key: true
                },
                lastName: {
                    type: 'text',
                    mapsTo: 'last_name',
                    key: true
                },
                age: {
                    type: 'integer'
                }
            });

            return helper.dropSync(Person);
        });

        it("should throw an error if invalid keys are specified", function () {
            assert.throws(function () {
                db.define("blah", {
                    name: {
                        type: 'text'
                    }
                }, {
                    id: ['banana']
                });
            }, "Model defined without any keys");
        });

        it("should create", function () {
            var person = Person.createSync({
                firstName: 'John',
                lastName: 'Smith',
                age: 48
            });
            assert.exist(person);
            assert.equal(person.firstName, 'John');
            assert.equal(person.lastName, 'Smith');
            id1 = [person.firstName, person.lastName];
        });

        it("should save new", function () {
            var person = new Person({
                firstName: 'Jane',
                lastName: 'Doe',
                age: 50
            });

            person.saveSync();
            assert.exist(person);
            assert.equal(person.firstName, 'Jane');
            assert.equal(person.lastName, 'Doe');
            id2 = [person.firstName, person.lastName];
        });

        it("should get person1", function () {
            var person = Person.getSync(id1[0], id1[1]);
            assert.exist(person);
            assert.equal(person.firstName, 'John');
            assert.equal(person.lastName, 'Smith');
        });

        it("should get person2", function () {
            var person = Person.getSync(id2[0], id2[1]);
            assert.exist(person);
            assert.equal(person.firstName, 'Jane');
            assert.equal(person.lastName, 'Doe');
        });

        it("should find", function () {
            var person = Person.oneSync({
                firstName: 'Jane'
            });
            assert.exist(person);
            assert.equal(person.firstName, 'Jane');
            assert.equal(person.lastName, 'Doe');
        });

        it("should update", function () {
            var person = Person.oneSync({
                firstName: 'Jane'
            });
            assert.exist(person);

            person.firstName = 'Jeniffer';
            person.saveSync();

            assert.equal(person.firstName, 'Jeniffer');
            assert.equal(person.lastName, 'Doe');

            var freshPerson = Person.getSync(person.firstName, person.lastName);
            assert.exist(freshPerson);

            assert.equal(freshPerson.firstName, 'Jeniffer');
            assert.equal(freshPerson.lastName, 'Doe');

            freshPerson.lastName = 'Dee';
            freshPerson.saveSync();

            assert.equal(freshPerson.firstName, 'Jeniffer');
            assert.equal(freshPerson.lastName, 'Dee');

            var jennifer = Person.getSync(freshPerson.firstName, freshPerson.lastName);

            assert.equal(jennifer.firstName, 'Jeniffer');
            assert.equal(jennifer.lastName, 'Dee');
        });

        it("should count", function () {
            var person = Person.createSync({
                firstName: 'Greg',
                lastName: 'McDoofus',
                age: 30
            });

            var count = Person.find({
                firstName: 'Greg',
                lastName: 'McDoofus'
            }).countSync();
            assert.equal(count, 1);
        });

        it("should chain delete", function () {
            var person = Person.createSync({
                firstName: 'Alfred',
                lastName: 'McDoogle',
                age: 50
            });

            var count = Person.find({
                firstName: 'Alfred',
                lastName: 'McDoogle'
            }).countSync();
            assert.equal(count, 1);

            Person.find({
                firstName: 'Alfred',
                lastName: 'McDoogle'
            }).removeSync();

            var count = Person.find({
                firstName: 'Alfred',
                lastName: 'McDoogle'
            }).countSync();
            assert.equal(count, 0);
        });
    });
});