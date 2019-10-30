var helper = require('../support/spec_helper');
var ORM = require('../../');

xdescribe("ORM Plugin", function () {
    var db = null;
    var User = null;
    var Profile = null;
    var Post = null;
    var Group = null;

    var setup = function () {
        return function () {
            User = db.define("user", {
                username: {
                    type: 'text',
                    size: 64
                },
                password: {
                    type: 'text',
                    size: 128
                }
            }, {
                id: 'username'
            });

            Profile = User.extendsTo("profile", {
                firstname: String,
                lastname: String
            });

            Group = db.define("group", {
                name: {
                    type: 'text',
                    size: 64
                }
            }, {
                id: 'name'
            });
            Group.hasMany(User, {
                as: 'users',
                reverseAs: 'groups'
            });

            Post = db.define("post", {
                content: String
            });
            Post.hasOne(User, {
                as: 'author',
            });

            return helper.dropSync([User, Profile, Group, Post], function () {
                var billy = User.create({
                    username: 'billy',
                    password: 'hashed password'
                });
                var profile = billy.$saveRef("profile", new Profile({
                    firstname: 'William',
                    lastname: 'Franklin'
                }));
                var groups = billy.$addRef("groups", [
                    new Group({
                        name: 'admins'
                    }),
                    new Group({
                        name: 'developers'
                    })
                ]);
                var posts = billy.$saveRef("posts", new Post({
                    content: 'Hello world!'
                }));
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });

    describe("Cache", function () {
        before(setup());

        it("define", function () {
            ORM.definePlugin("cache", {
                onBootstrap () {
                    new routing = new mq.Routing()
                },
                onSynchronized () {},
                onDroped () {},
                onFoundItems () {},
                onCreatedItems () {},
                onUpdatedItems () {},
                onRemovedItems () {},

                onDMLInsert () {},
                onDMLFind () {},
                onDMLUpdate () {},
                onDMLRemove () {},
                onDMLClear () {},
            });
        });
    });

    describe("Http Endpoints", function () {
        before(setup());

        it("define", function () {
            ORM.definePlugin("http-routes", {
                
            });
        });
    });
});