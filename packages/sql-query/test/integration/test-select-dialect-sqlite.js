const test = require('test')
test.setup()

var common = require('../common')
var assert = require('assert')

describe('select - sqlite', () => {
  it('select', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').build(),
      'select * from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id', 'name').build(),
      'select `id`, `name` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id', 'name').as('label').build(),
      'select `id`, `name` as `label` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id', 'name').select('title').as('label').build(),
      'select `id`, `name`, `title` as `label` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id', 'name').as('label').select('title').build(),
      'select `id`, `name` as `label`, `title` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select([ 'id', 'name' ]).build(),
      'select `id`, `name` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select().build(),
      'select * from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select(
        ['abc', 'def', { a: 'ghi', sql: 'SOMEFUNC(ghi)' }]
      ).build(),
      'select `abc`, `def`, SOMEFUNC(ghi) as `ghi` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select(
        ['abc', 'def', { as: 'ghi', sql: 'SOMEFUNC(ghi)' }]
      ).build(),
      'select `abc`, `def`, SOMEFUNC(ghi) as `ghi` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).calculateFoundRows().from('table1').build(),
      'select SQL_CALC_FOUND_ROWS * from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).calculateFoundRows().from('table1').select('id').build(),
      'select SQL_CALC_FOUND_ROWS `id` from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id1', 'name')
        .from('table2', 'id2', 'id1').select('id2').build(),
      'select `t1`.`id1`, `t1`.`name`, `t2`.`id2` from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`',
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id1')
        .from('table2', 'id2', 'id1', { joinType: 'left inner' }).select('id2').build(),
      'select `t1`.`id1`, `t2`.`id2` from `table1` as `t1` left join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').select('id1', 'name')
        .from('table2', 'id2', 'table1', 'id1').select('id2').build(),
      'select `t1`.`id1`, `t1`.`name`, `t2`.`id2` from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1')
        .from('table2', 'id2', 'table1', 'id1').count().build(),
      'select COUNT(*) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1')
        .from('table2', 'id2', 'table1', 'id1').count(null, 'c').build(),
      'select COUNT(*) as `c` from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1')
        .from('table2', 'id2', 'table1', 'id1').count('id').build(),
      'select COUNT(`t2`.`id`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1').count('id')
        .from('table2', 'id2', 'table1', 'id1').count('id').build(),
      'select COUNT(`t1`.`id`), COUNT(`t2`.`id`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1')
        .from('table2', 'id2', 'table1', 'id1').count('id').count('col').build(),
      'select COUNT(`t2`.`id`), COUNT(`t2`.`col`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1')
        .from('table2', 'id2', 'table1', 'id1').fun('AVG', 'col').build(),
      'select AVG(`t2`.`col`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1')
        .from('table2', ['id2a', 'id2b'], 'table1', ['id1a', 'id1b']).count('id').build(),
      'select COUNT(`t2`.`id`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2a` = `t1`.`id1a` and `t2`.`id2b` = `t1`.`id1b`'
    )
  })

  it('alias: valid but useless', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1 as t1')
        .build(),
      'select * from `table1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' }).from('table1 t1')
        .build(),
      'select * from `table1`'
    )
  })

  it('alias: two tables', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').select('id1', 'name')
        .from('table2 as custom_t2', 'id2', 'id1').select('id2')
        .build(),
      'select `custom_t1`.`id1`, `custom_t1`.`name`, `custom_t2`.`id2` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').select('id1', 'name')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').select('id2')
        .build(),
      'select `custom_t1`.`id1`, `custom_t1`.`name`, `custom_t2`.`id2` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )
  })

  it('alias: two tables - Custom Join Type', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').select('id1')
        .from('table2 as custom_t2', 'id2', 'id1', { joinType: 'left inner' }).select('id2')
        .build(),
      'select `custom_t1`.`id1`, `custom_t2`.`id2` from `table1` as `custom_t1` left join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )
  })

  it('alias: two tables - count', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count()
        .build(),
      'select COUNT(*) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count(null, 'c')
        .build(),
      'select COUNT(*) as `c` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count('id')
        .build(),
      'select COUNT(`custom_t2`.`id`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').count('id')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count('id')
        .build(),
      'select COUNT(`custom_t1`.`id`), COUNT(`custom_t2`.`id`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count('id').count('col')
        .build(),
      'select COUNT(`custom_t2`.`id`), COUNT(`custom_t2`.`col`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', ['id2a', 'id2b'], 'table1', ['id1a', 'id1b']).count('id')
        .build(),
      'select COUNT(`custom_t2`.`id`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2a` = `custom_t1`.`id1a` and `custom_t2`.`id2b` = `custom_t1`.`id1b`'
    )
  })

  it('alias: two tables - Aggregation Function', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').fun('AVG', 'col')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1')
        .build(),
      'select AVG(`custom_t1`.`col`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').fun('AVG', 'col')
        .build(),
      'select AVG(`custom_t2`.`col`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )
  })

  it('alias: more than two tables', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').select('id1', 'id2', 'name')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').select('id2')
        .from('table2 as custom_t3', 'id3', 'custom_t1', 'id2').select('id3')
        .build(),
      'select `custom_t1`.`id1`, `custom_t1`.`id2`, `custom_t1`.`name`, `custom_t2`.`id2`, `custom_t3`.`id3` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1` inner join `table2` as `custom_t3` on `custom_t3`.`id3` = `custom_t1`.`id2`'
    )
  })

  it('alias: more than two tables - count', () => {
    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('table1 as custom_t1').select('id1', 'id2', 'name')
        .from('table2 as custom_t2', ['id2a', 'id2b'], 'table1', ['id1a', 'id1b'])
        .from('table2 as custom_t3', 'id3', 'custom_t1', 'id2').select('id3')
        .build(),
      'select `custom_t1`.`id1`, `custom_t1`.`id2`, `custom_t1`.`name`, `custom_t3`.`id3` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2a` = `custom_t1`.`id1a` and `custom_t2`.`id2b` = `custom_t1`.`id1b` inner join `table2` as `custom_t3` on `custom_t3`.`id3` = `custom_t1`.`id2`'
    )

    assert.equal(
      common.Select({ dialect: 'sqlite' })
        .from('stage s').select('id').as('stage_id').select('name', 'description')
        .from('task t', 'of_stage_id', 'stage', 'id').count('id', 'count_task')
        .from('project p', 'id', 's', 'project_id').select('id').as('project_id').select('name', 'description')
        .groupBy('stage_id')
        .build(),
      'select `s`.`id` as `stage_id`, `s`.`name`, `s`.`description`, COUNT(`t`.`id`) as `count_task`, `p`.`id` as `project_id`, `p`.`name`, `p`.`description` from `stage` as `s` inner join `task` as `t` on `t`.`of_stage_id` = `s`.`id` inner join `project` as `p` on `p`.`id` = `s`.`project_id` group by `stage_id`'
    )
  })

  describe('select as', () => {
    var querySelect
    var subquery

    beforeEach(() => {
      querySelect = common.Select({ dialect: 'sqlite' });
      subquery = querySelect.knex.table('table1')
        .select(
          'name',
          querySelect.knex.raw('sum(value) as ?', ['total']),
          // querySelect.knex.sum('value').as('total')
        )
        .as('totals')
        .groupBy('name');
    })

    it('by knex instance', () => {
      var knex = querySelect.knex;

      assert.equal(
        knex
          .from({
            'table1': 'table1',
            'totals': knex.raw(subquery).wrap('(', ')')
          })
          .select(...[
            'name',
            knex.raw('sum(value) as ?', ['sum(value)']),
            knex.raw('sum(value) / totals.total as ?', ['value of total']),
          ])
          .whereBetween('year', [2000, 2001])
          .where('table1.name', '=', knex.ref('totals.name'))
          .groupBy('name')
          .toQuery(),
        // 'select name, sum(value) as "sum(value)", sum(value) / totals.total as "value of total" from table1, (select name, sum(value) as total from table1 group by name) as totals where table1.name = totals.name and year between 2000 and 2001 group by name;'
        "select `name`, sum(value) as 'sum(value)', sum(value) / totals.total as 'value of total' from `table1` as `table1`, (select `name`, sum(value) as 'total' from `table1` group by `name`) as `totals` where `year` between 2000 and 2001 and `table1`.`name` = `totals`.`name` group by `name`"
      )
    });

    it(`by query.Select()`, () => {
      var knex = querySelect.knex;

      assert.equal(
        querySelect
          .from(['table1', 'table1'])
          .select([
            'name',
            { sql: 'sum(value)', as: 'sum(value)'},
            { sql: 'sum(value) / totals.total', as: 'value of total' }
          ])
          .from([subquery, 'totals'])
          .where({
            year: common.Query.comparators.between(2000, 2001),
            'table1.name': knex.ref('totals.name')
          })
          .groupBy('name')
          .build(),
        // 'select name, sum(value) as "sum(value)", sum(value) / totals.total as "value of total" from table1, (select name, sum(value) as total from table1 group by name) as totals where table1.name = totals.name and year between 2000 and 2001 group by name;'
        "select `table1`.`name`, sum(value) as `sum(value)`, sum(value) / totals.total as `value of total` from `table1` as `table1`, (select `name`, sum(value) as 'total' from `table1` group by `name`) as `totals` where `year` between 2000 and 2001 and `table1`.`name` = `totals`.`name` group by `name`"
      )
    });

    it('by query.Select() 2', () => {
      var knex = querySelect.knex;

      assert.equal(
        querySelect
          .from(['table1', 'table1'])
          .select([
            'name',
            { func_name: 'sum', column_name: 'value', as: 'sum(value)' },
            { sql: 'sum(value) / totals.total', as: 'value of total' }
          ])
          .from([subquery, 'totals'])
          .where({
            year: common.Query.comparators.between(2000, 2001),
            'table1.name': knex.ref('totals.name')
          })
          .groupBy('name')
          .build(),
        // 'select name, sum(value) as "sum(value)", sum(value) / totals.total as "value of total" from table1, (select name, sum(value) as total from table1 group by name) as totals where table1.name = totals.name and year between 2000 and 2001 group by name;'
        "select `table1`.`name`, sum(`table1`.`value`) as `sum(value)`, sum(value) / totals.total as `value of total` from `table1` as `table1`, (select `name`, sum(value) as 'total' from `table1` group by `name`) as `totals` where `year` between 2000 and 2001 and `table1`.`name` = `totals`.`name` group by `name`"
      )
    });
  })

  it('from: error assertion', () => {
    const { errMsg } = common.runProcAndCatch(() => {
      common.Select()
        .from('table1 as custom_t1').select('id1', 'id2', 'name')
        .from('table2 as custom_t2', [], 'table1', [])
        .build()
    });

    assert.equal(errMsg, '[SQL-QUERY] both from_id & to_id cannot be empty!')
  })
});

if (require.main === module) {
  test.run(console.DEBUG)
}
