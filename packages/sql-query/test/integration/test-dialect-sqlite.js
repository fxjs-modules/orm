const test = require('test')
test.setup()

var common = require('../common')
var assert = require('assert')
var dialect = common.getDialect('sqlite')
var d = new Date(1378322111133)
var tzOffsetMillis = (d.getTimezoneOffset() * 60 * 1000)

describe('dialect-sqlite', () => {
  it('dialect-sqlite', () => {
    assert.equal(
      dialect.escapeId('col'),
      '`col`'
    )

    assert.equal(
      dialect.escapeId('table', 'col'),
      '`table`.`col`'
    )

    assert.equal(
      dialect.escapeId('table', 'co`l'),
      '`table`.`co``l`'
    )

    assert.equal(
      dialect.escapeVal(undefined),
      'NULL'
    )

    assert.equal(
      dialect.escapeVal(null),
      'NULL'
    )

    assert.equal(
      dialect.escapeVal(123),
      '123'
    )

    if(common.isSupportBigInt()){
      assert.equal(
        dialect.escapeVal(BigInt(12)),
        '12'
      )
    }

    assert.equal(
      dialect.escapeVal(NaN),
      "'NaN'"
    )

    assert.equal(
      dialect.escapeVal(Infinity),
      "'Infinity'"
    )

    assert.equal(
      dialect.escapeVal('abc'),
      "'abc'"
    )

    assert.equal(
      dialect.escapeVal("ab'c"),
      "'ab''c'"
    )

    assert.equal(
      dialect.escapeVal([ 1, 'abc', "a'" ]),
      "(1, 'abc', 'a''')"
    )

    assert.equal(
      dialect.escapeVal(true),
      '1'
    )

    assert.equal(
      dialect.escapeVal(false),
      '0'
    )

    assert.equal(
      dialect.escapeVal({ key: 'value' }),
      '\'{"key":"value"}\''
    )

    assert.equal(
      dialect.escapeVal(Symbol('why does this exist')),
      'NULL'
    )

    assert.equal(
      dialect.escapeVal(new Date(d.getTime() + tzOffsetMillis)),
      "'2013-09-04 19:15:11.133'"
    )

    assert.equal(
      dialect.escapeVal(new Date(d.getTime()), 'Z'),
      "'2013-09-04T19:15:11.133Z'"
    )

    assert.equal(
      dialect.escapeVal(new Date(d.getTime()), '-0000'),
      "'2013-09-04T19:15:11.133Z'"
    )

    assert.equal(
      dialect.escapeVal(new Date(d.getTime()), '-0400'),
      "'2013-09-04T15:15:11.133Z'"
    )

    assert.equal(
      dialect.escapeVal(new Date(d.getTime())),
      dialect.escapeVal(new Date(d.getTime()), 'local')
    )

    // For all dialects but mssql limitAsTop should be undefined or false
    assert.equal(
      dialect.limitAsTop || false,
      false
    )
  })
})

if (require.main === module) {
  test.run(console.DEBUG)
}
