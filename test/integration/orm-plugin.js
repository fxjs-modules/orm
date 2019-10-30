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
            }, {
                reverse: 'user',
                required: true
            });

            Group = db.define("group", {
                name: {
                    type: 'text',
                    size: 64
                }
            }, {
                id: 'name'
            });
            Group.hasMany('users', User, {}, {
                reverse: 'groups'
            });

            Post = db.define("post", {
                content: String
            }, {

            });
            Post.hasOne('user', User, {
                reverse: 'posts'
            });

            ORM.singleton.clear();
            return helper.dropSync([User, Profile, Group, Post], function () {
                var billy = User.createSync({
                    username: 'billy',
                    password: 'hashed password'
                });

                var profile = billy.setProfileSync(new Profile({
                    firstname: 'William',
                    lastname: 'Franklin'
                }));
                var groups = billy.addGroupsSync([new Group({
                    name: 'admins'
                }), new Group({
                    name: 'developers'
                })]);
                var posts = billy.setPostsSync(new Post({
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

        it("use", function () {

        });
    });

    describe("http plugin", function () {
        before(setup());

        it("use", function () {

        });
    });
});