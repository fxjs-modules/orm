var ORM = require('../../');
var helper = require('../support/spec_helper');

odescribe("Model.find() - advanced", function () {
    var db = null;
    var Person = null;
    var Jack = Joe = null;

    var Post = null;
    var Tag = null;
    var Category = null;

    var setup = function (opts) {
        opts = opts || {};

        return function () {
            Person = db.define("person", {
                name: { type: 'text' },
                email: { type: 'text' }
            });

            Category = db.define("category", {
                name: { type: 'text' },
                description: { type: 'text' }
            });

            Tag = db.define("name", {
                name: { type: 'text' },
                description: { type: 'text' }
            });

            Post = db.define("post", {
                title: { type: 'text' },
                description: { type: 'text' },
                author_id: { type: 'integer', size: 4 }
            });

            PostTagRel = db.define("post_tag", {
              tag_id: Tag.idPropertyList[0].renameTo({ name: 'tag_id' }).deKeys(),
              post_id: Post.idPropertyList[0].renameTo({ name: 'post_id' }).deKeys(),
            }, {
              keys: false
            })

            helper.dropSync([Person, Post, Tag, Category, PostTagRel], function () {
              var [ _Tag1, _Tag2 ] = Tag.create(
                /**
                 * @TODO if could, use transaction to speed it.
                 */
                Array(20).fill(undefined).map((_, idx) => {
                  var c = idx + 1
                  switch (c) {
                    case 1:
                      return { name: `tag${c}`, description: 'first tag' }
                    case 2:
                      return { name: `tag${c}`, description: 'second tag' }
                    case 3:
                      return { name: `tag${c}`, description: 'second tag' }
                    default:
                      return { name: `tag${c}`, description: `${idx}th tag`}
                  }
                })
              )

              var [_Jack, _Joe] = Person.create([
                { name: 'Jack', email: 'Jack@gmail.com' },
                { name: 'Joe', email: 'Joe@gmail.com' }
              ]);
              Jack = _Jack;
              Joe = _Joe;

              var [_JackPost, _JoePost] = Post.create([
                { title: `Jack's post`, description: 'by Jack', author_id: Jack.id },
                { title: `Joe's post`, description: 'by Joe', author_id: Joe.id }
              ])

              PostTagRel.create([
                { tag_id: _Tag1.id, post_id: _JackPost.id },
                { tag_id: _Tag2.id, post_id: _JoePost.id }
              ])
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    odescribe("$dml.find", function () {
        before(setup());

        it("no where", function () {
          var [_Jack, _Joe] = Person.find({
            orderBy: 'id'
          })

          assert.deepEqual(_Jack.toJSON(), Jack.toJSON())
          assert.deepEqual(_Joe.toJSON(), Joe.toJSON())
        });

        it("join", function () {
          var [_JackPost] = Post.find({
            select: {
              'title': `${Post.collection}.title`,
              'description': `${Post.collection}.description`,
              'author_id': `${Post.collection}.author_id`,
              'author_name': `${Person.collection}.name`,
              'id': `${Post.collection}.id`
            },
            joins: [
              ORM.Qlfn.Selects.join({
                collection: Person.collection,
                on: {
                  author_id: ORM.Qlfn.Others.refTableCol({table: Person.collection, column: Person.id})
                }
              })
            ]
          })

          assert.deepEqual(_JackPost.author_id, Jack.id)
          assert.notExist(_JackPost.author_name)
          assert.property(JSON.parse(_JackPost.$bornsnapshot), 'author_name')
        });

        it("leftJoin", function () {
          var [_JackPost] = Post.find({
            select: {
              'title': `${Post.collection}.title`,
              'description': `${Post.collection}.description`,
              'author_id': `${Post.collection}.author_id`,
              'author_name': `${Person.collection}.name`,
              'id': `${Post.collection}.id`
            },
            joins: [
              ORM.Qlfn.Selects.leftJoin({
                collection: Person.collection,
                on: {
                  author_id: ORM.Qlfn.Others.refTableCol({table: Person.collection, column: Person.id})
                }
              })
            ]
          })

          assert.deepEqual(_JackPost.author_id, Jack.id)
          assert.notExist(_JackPost.author_name)
          assert.property(JSON.parse(_JackPost.$bornsnapshot), 'author_name')
        });
    });
});
