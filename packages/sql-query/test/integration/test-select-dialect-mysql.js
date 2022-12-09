const test = require('test')
test.setup()

var common = require('../common')
var assert = require('assert')

describe('select - mysql', () => {
  it('select', () => {
    assert.equal(
      common.Select().from('table1').build(),
      'select * from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select('id', 'name').build(),
      'select `id`, `name` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select('id', 'name').as('label').build(),
      'select `id`, `name` as `label` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select('id', 'name').select('title').as('label').build(),
      'select `id`, `name`, `title` as `label` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select('id', 'name').as('label').select('title').build(),
      'select `id`, `name` as `label`, `title` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select([ 'id', 'name' ]).build(),
      'select `id`, `name` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select().build(),
      'select * from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select(
        ['abc', 'def', { a: 'ghi', sql: 'SOMEFUNC(ghi)' }]
      ).build(),
      'select `abc`, `def`, SOMEFUNC(ghi) as `ghi` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select(
        ['abc', 'def', { as: 'ghi', sql: 'SOMEFUNC(ghi)' }]
      ).build(),
      'select `abc`, `def`, SOMEFUNC(ghi) as `ghi` from `table1`'
    )

    assert.equal(
      common.Select().calculateFoundRows().from('table1').build(),
      'select SQL_CALC_FOUND_ROWS * from `table1`'
    )

    assert.equal(
      common.Select().calculateFoundRows().from('table1').select('id').build(),
      'select SQL_CALC_FOUND_ROWS `id` from `table1`'
    )

    assert.equal(
      common.Select().from('table1').select('id1', 'name')
        .from('table2', 'id2', 'id1').select('id2').build(),
      'select `t1`.`id1`, `t1`.`name`, `t2`.`id2` from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`',
      // 'SELECT `t1`.`id1`, `t1`.`name`, `t2`.`id2` FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1').select('id1')
        .from('table2', 'id2', 'id1', { joinType: 'left inner' }).select('id2').build(),
      // 'SELECT `t1`.`id1`, `t2`.`id2` FROM `table1` `t1` LEFT INNER JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select `t1`.`id1`, `t2`.`id2` from `table1` as `t1` left join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1').select('id1', 'name')
        .from('table2', 'id2', 'table1', 'id1').select('id2').build(),
      // 'SELECT `t1`.`id1`, `t1`.`name`, `t2`.`id2` FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
    'select `t1`.`id1`, `t1`.`name`, `t2`.`id2` from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1')
        .from('table2', 'id2', 'table1', 'id1').count().build(),
      // 'SELECT COUNT(*) FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select COUNT(*) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1')
        .from('table2', 'id2', 'table1', 'id1').count(null, 'c').build(),
      // 'SELECT COUNT(*) AS `c` FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select COUNT(*) as `c` from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1')
        .from('table2', 'id2', 'table1', 'id1').count('id').build(),
      // 'SELECT COUNT(`t2`.`id`) FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select COUNT(`t2`.`id`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1').count('id')
        .from('table2', 'id2', 'table1', 'id1').count('id').build(),
      // 'SELECT COUNT(`t1`.`id`), COUNT(`t2`.`id`) FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select COUNT(`t1`.`id`), COUNT(`t2`.`id`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1')
        .from('table2', 'id2', 'table1', 'id1').count('id').count('col').build(),
      // 'SELECT COUNT(`t2`.`id`), COUNT(`t2`.`col`) FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select COUNT(`t2`.`id`), COUNT(`t2`.`col`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1')
        .from('table2', 'id2', 'table1', 'id1').fun('AVG', 'col').build(),
      // 'SELECT AVG(`t2`.`col`) FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2` = `t1`.`id1`'
      'select AVG(`t2`.`col`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2` = `t1`.`id1`'
    )

    assert.equal(
      common.Select().from('table1')
        .from('table2', ['id2a', 'id2b'], 'table1', ['id1a', 'id1b']).count('id').build(),
      // 'SELECT COUNT(`t2`.`id`) FROM `table1` `t1` JOIN `table2` `t2` ON `t2`.`id2a` = `t1`.`id1a` AND `t2`.`id2b` = `t1`.`id1b`'
      'select COUNT(`t2`.`id`) from `table1` as `t1` inner join `table2` as `t2` on `t2`.`id2a` = `t1`.`id1a` and `t2`.`id2b` = `t1`.`id1b`'
    )
  })

  it('alias: valid but useless', () => {
    assert.equal(
      common.Select().from('table1 as t1')
        .build(),
      // 'select * from `table1`'
      'select * from `table1`'
    )

    assert.equal(
      common.Select().from('table1 t1')
        .build(),
      // 'SELECT * FROM `table1`'
      'select * from `table1`'
    )
  })

  it('alias: two tables', () => {
    assert.equal(
      common.Select()
        .from('table1 as custom_t1').select('id1', 'name')
        .from('table2 as custom_t2', 'id2', 'id1').select('id2')
        .build(),
      // 'SELECT `custom_t1`.`id1`, `custom_t1`.`name`, `custom_t2`.`id2` FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select `custom_t1`.`id1`, `custom_t1`.`name`, `custom_t2`.`id2` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1').select('id1', 'name')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').select('id2')
        .build(),
      // 'SELECT `custom_t1`.`id1`, `custom_t1`.`name`, `custom_t2`.`id2` FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select `custom_t1`.`id1`, `custom_t1`.`name`, `custom_t2`.`id2` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )
  })

  it('alias: two tables - Custom Join Type', () => {
    assert.equal(
      common.Select()
        .from('table1 as custom_t1').select('id1')
        .from('table2 as custom_t2', 'id2', 'id1', { joinType: 'left inner' }).select('id2')
        .build(),
      // 'SELECT `custom_t1`.`id1`, `custom_t2`.`id2` FROM `table1` `custom_t1` LEFT INNER JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select `custom_t1`.`id1`, `custom_t2`.`id2` from `table1` as `custom_t1` left join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )
  })

  it('alias: two tables - count', () => {
    assert.equal(
      common.Select()
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count()
        .build(),
      // 'SELECT COUNT(*) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select COUNT(*) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count(null, 'c')
        .build(),
      // 'SELECT COUNT(*) AS `c` FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select COUNT(*) as `c` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count('id')
        .build(),
      // 'SELECT COUNT(`custom_t2`.`id`) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select COUNT(`custom_t2`.`id`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1').count('id')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count('id')
        .build(),
      // 'SELECT COUNT(`custom_t1`.`id`), COUNT(`custom_t2`.`id`) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select COUNT(`custom_t1`.`id`), COUNT(`custom_t2`.`id`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').count('id').count('col')
        .build(),
      // 'SELECT COUNT(`custom_t2`.`id`), COUNT(`custom_t2`.`col`) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select COUNT(`custom_t2`.`id`), COUNT(`custom_t2`.`col`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', ['id2a', 'id2b'], 'table1', ['id1a', 'id1b']).count('id')
        .build(),
      // 'SELECT COUNT(`custom_t2`.`id`) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2a` = `custom_t1`.`id1a` AND `custom_t2`.`id2b` = `custom_t1`.`id1b`'
      'select COUNT(`custom_t2`.`id`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2a` = `custom_t1`.`id1a` and `custom_t2`.`id2b` = `custom_t1`.`id1b`'
    )
  })

  it('alias: two tables - Aggregation Function', () => {
    assert.equal(
      common.Select()
        .from('table1 as custom_t1').fun('AVG', 'col')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1')
        .build(),
      // 'SELECT AVG(`custom_t1`.`col`) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select AVG(`custom_t1`.`col`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )

    assert.equal(
      common.Select()
        .from('table1 as custom_t1')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').fun('AVG', 'col')
        .build(),
      // 'SELECT AVG(`custom_t2`.`col`) FROM `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1`'
      'select AVG(`custom_t2`.`col`) from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1`'
    )
  })

  it('alias: more than two tables', () => {
    assert.equal(
      common.Select()
        .from('table1 as custom_t1').select('id1', 'id2', 'name')
        .from('table2 as custom_t2', 'id2', 'table1', 'id1').select('id2')
        .from('table2 as custom_t3', 'id3', 'custom_t1', 'id2').select('id3')
        .build(),
      // 'SELECT `custom_t1`.`id1`, `custom_t1`.`id2`, `custom_t1`.`name`, `custom_t2`.`id2`, `custom_t3`.`id3` FROM ( `table1` `custom_t1` JOIN `table2` `custom_t2` ON `custom_t2`.`id2` = `custom_t1`.`id1` ) JOIN `table2` `custom_t3` ON `custom_t3`.`id3` = `custom_t1`.`id2`'
      'select `custom_t1`.`id1`, `custom_t1`.`id2`, `custom_t1`.`name`, `custom_t2`.`id2`, `custom_t3`.`id3` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2` = `custom_t1`.`id1` inner join `table2` as `custom_t3` on `custom_t3`.`id3` = `custom_t1`.`id2`'
    )
  })

  it('alias: more than two tables - count', () => {
    assert.equal(
      common.Select()
        .from('table1 as custom_t1').select('id1', 'id2', 'name')
        .from('table2 as custom_t2', ['id2a', 'id2b'], 'table1', ['id1a', 'id1b'])
        .from('table2 as custom_t3', 'id3', 'custom_t1', 'id2').select('id3')
        .build(),
      'select `custom_t1`.`id1`, `custom_t1`.`id2`, `custom_t1`.`name`, `custom_t3`.`id3` from `table1` as `custom_t1` inner join `table2` as `custom_t2` on `custom_t2`.`id2a` = `custom_t1`.`id1a` and `custom_t2`.`id2b` = `custom_t1`.`id1b` inner join `table2` as `custom_t3` on `custom_t3`.`id3` = `custom_t1`.`id2`'
    )

    assert.equal(
      common.Select()
        .from('stage s').select('id').as('stage_id').select('name', 'description')
        .from('task t', 'of_stage_id', 'stage', 'id').count('id', 'count_task')
        .from('project p', 'id', 's', 'project_id').select('id').as('project_id').select('name', 'description')
        .groupBy('stage_id')
        .build(),
      // 'SELECT `s`.`id` AS `stage_id`, `s`.`name`, `s`.`description`, COUNT(`t`.`id`) AS `count_task`, `p`.`id` AS `project_id`, `p`.`name`, `p`.`description` FROM ( `stage` `s` JOIN `task` `t` ON `t`.`of_stage_id` = `s`.`id` ) JOIN `project` `p` ON `p`.`id` = `s`.`project_id` GROUP BY `stage_id`'
      'select `s`.`id` as `stage_id`, `s`.`name`, `s`.`description`, COUNT(`t`.`id`) as `count_task`, `p`.`id` as `project_id`, `p`.`name`, `p`.`description` from `stage` as `s` inner join `task` as `t` on `t`.`of_stage_id` = `s`.`id` inner join `project` as `p` on `p`.`id` = `s`.`project_id` group by `stage_id`'
    )
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
