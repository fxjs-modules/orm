const test = require('test')
test.setup()

var common = require('../common')
var assert = require('assert')

describe('where-postgresql', () => {
  it('postgresql', () => {
    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where().build(),
      'select * from "table1"'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where(null).build(),
      'select * from "table1"'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: 1 }).build(),
      'select * from "table1" where "col" = 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: 0 }).build(),
      'select * from "table1" where "col" = 0'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: null }).build(),
      'select * from "table1" where "col" is null'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.eq(null) }).build(),
      'select * from "table1" where "col" is null'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.ne(null) }).build(),
      'select * from "table1" where "col" is not null'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: undefined }).build(),
      'select * from "table1" where "col" is null'
    )

    if ({ dialect: 'postgresql' }.dialect !== 'sqlite') {
      assert.equal(
        common.Select({ dialect: 'postgresql' }).from('table1').where({ col: false }).build(),
        'select * from "table1" where "col" = false'
      )

      assert.equal(
        common.Select({ dialect: 'postgresql' }).from('table1').where({ col: true }).build(),
        'select * from "table1" where "col" = true'
      )
    }

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: '' }).build(),
      `select * from "table1" where "col" = ''`
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: 'a' }).build(),
      `select * from "table1" where "col" = 'a'`
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: [ 1, 2, 3 ] }).build(),
      'select * from "table1" where "col" in (1, 2, 3)'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: [] }).build(),
      'select * from "table1" where 1 = 0'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col1: 1, col2: 2 }).build(),
      'select * from "table1" where "col1" = 1 and "col2" = 2'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col1: 1 }, { col2: 2 }).build(),
      'select * from "table1" where "col1" = 1 and "col2" = 2'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: 1 }).where({ col: 2 }).build(),
      'select * from "table1" where "col" = 1 and "col" = 2'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col1: 1, col2: 2 }).where({ col3: 3 }).build(),
      'select * from "table1" where "col1" = 1 and "col2" = 2 and "col3" = 3'
    )

    // .where(tablename, conditions, tablename, conditions)
    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1')
        .from('table2', 'id', 'id')
        .where('table1', { col: 1 }, 'table2', { col: 2 }).build(),
      'select * from "table1" as "t1" inner join "table2" as "t2" on "t2"."id" = "t1"."id" where "t1"."col" = 1 and "t2"."col" = 2'
    )

    // .where(tablename, conditions, aliasname, conditions)
    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1')
        .from('table2', 'id', 'id')
        .where('table1', { col: 1 }, 't2', { col: 2 }).build(),
      'select * from "table1" as "t1" inner join "table2" as "t2" on "t2"."id" = "t1"."id" where "t1"."col" = 1 and "t2"."col" = 2'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1')
        .from('table2', 'id', 'id')
        .where('table1', { col: 1 }, { col: 2 }).build(),
      'select * from "table1" as "t1" inner join "table2" as "t2" on "t2"."id" = "t1"."id" where "t1"."col" = 1 and "col" = 2'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.gt(1) }).build(),
      'select * from "table1" where "col" > 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.gte(1) }).build(),
      'select * from "table1" where "col" >= 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.lt(1) }).build(),
      'select * from "table1" where "col" < 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.lte(1) }).build(),
      'select * from "table1" where "col" <= 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.eq(1) }).build(),
      'select * from "table1" where "col" = 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.ne(1) }).build(),
      'select * from "table1" where "col" <> 1'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.between('a', 'b') }).build(),
      'select * from "table1" where "col" between \'a\' and \'b\''
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.not_between('a', 'b') }).build(),
      'select * from "table1" where "col" not between \'a\' and \'b\''
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.like('abc') }).build(),
      'select * from "table1" where "col" like \'abc\''
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.not_like('abc') }).build(),
      'select * from "table1" where "col" not like \'abc\''
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.not_in([ 1, 2, 3 ]) }).build(),
      'select * from "table1" where "col" not in (1, 2, 3)'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ __sql: [[`LOWER("stuff") LIKE 'peaches'`]] }).build(),
      'select * from "table1" where LOWER("stuff") LIKE \'peaches\''
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ __sql: [['LOWER("stuff") LIKE ?', ['peaches']]] }).build(),
      'select * from "table1" where LOWER("stuff") LIKE \'peaches\''
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ __sql: [['LOWER("stuff") LIKE ? AND "number" > ?', ['peaches', 12]]] }).build(),
      'select * from "table1" where LOWER("stuff") LIKE \'peaches\' AND "number" > 12'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ __sql: [['LOWER("stuff") LIKE ? AND "number" == ?', ['peaches']]] }).build(),
      'select * from "table1" where LOWER("stuff") LIKE \'peaches\' AND "number" == NULL'
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: "a'" }).build(),
      `select * from "table1" where "col" = 'a'''`
    )

    assert.equal(
      common.Select({ dialect: 'postgresql' }).from('table1').where({ col: common.Query.comparators.eq('col2', { asIdentifier: true }) }).build(),
      `select * from "table1" where "col" = "col2"`
    )
  })
})

if (require.main === module) {
  test.run(console.DEBUG)
}
