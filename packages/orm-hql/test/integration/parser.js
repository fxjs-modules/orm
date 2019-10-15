const test = require('test')
test.setup()

const tests = [
  {
    sql: 'select * from test',
    expected: {
      referencedTables: ['test'],
      operation: 'select',
    },
    toSql: '(select * from (`test`))'
  },
  {
    sql: 'select x from test',
    toSql: '(select `x` from (`test`))',
		expected: {
			returnColumns: [{
				name: 'x',
				expression: {
					type: 'identifier',
					value: 'x'
				},
				mappedTo: {
					column: 'x'
				},
				sourceColumns: [{
					type: 'identifier',
					value: 'x'
				}]
			}]
		}
  },
  {
    sql: [
			'select * # comments!',
			'from -- more comments!',
			'test -- hello'
		].join('\n'),
    expected: {
      referencedTables: ['test'],
      operation: 'select',
    },
    toSql: '(select * from (`test`))'
  },
  {
    sql: 'create or replace view test as select * from x',
    expected: {
      referencedTables: ['test', 'x'],
      operation: 'create_view',
      createdTables: ['test'],
      sourceTables: ['x']
    },
    toSql: 'create or replace view `test` as (select * from (`x`))'
  },
  {
    sql: 'create or replace view test as select * from x left join y on x.a=y.a',
    expected: {
      referencedTables: ['test', 'x', 'y'],
      operation: 'create_view',
      createdTables: ['test'],
      sourceTables: ['x', 'y']
    },
    toSql: 'create or replace view `test` as (select * from ((`x` left join `y` on (`x`.`a` = `y`.`a`))))'
  },
  {
    sql: 'select a, b, c from test',
    expected: {
      aliases: {
        "test": "test"
      },
      returnColumns: [
        ['a'],
        ['b'],
        ['c']
      ].map(([identifier]) => {
        return {
          "name": identifier,
          "expression": {
            "type": "identifier",
            "value": identifier
          },
          "sourceColumns": [
            {
              "type": "identifier",
              "value": identifier
            }
          ],
          "mappedTo": {
            "column": identifier
          }
        }
      })
    },
    toSql: '(select `a`, `b`, `c` from (`test`))'
  },
  {
    sql: 'select a aa, b bb, c as cc from test',
    expected: {
      aliases: {
        "test": "test"
      },
      returnColumns: [
        ['a', 'aa'],
        ['b', 'bb'],
        ['c', 'cc']
      ].map(([identifier, alias]) => {
        return {
          "name": alias,
          "expression": {
            "type": "identifier",
            "value": identifier,
          },
          alias: alias,
          alias_expression: {
            "type": "identifier",
            "value": alias,
          },
          "sourceColumns": [
            {
              "type": "identifier",
              "value": identifier,
            }
          ],
          "mappedTo": {
            "column": identifier
          }
        }
      })
    },
    toSql: '(select `a` as `aa`, `b` as `bb`, `c` as `cc` from (`test`))'
  },
  {
    sql: 'select * from x inner join y on x.a=y.a',
    expected: {
      referencedTables: ['x', 'y'],
      operation: 'select',
      createdTables: undefined,
      sourceTables: ['x', 'y']
    },
    toSql: '(select * from ((`x` inner join `y` on (`x`.`a` = `y`.`a`))))'
  },
  {
    sql: 'select case when x=1 then "hello" else "bye" end',
    expected: {
      referencedTables: []
    },
    toSql: '(select (case when (`x` = 1) then "hello" else "bye" end))',
  },
  {
    sql: 'select case when x=1 then "x" when x=2 then "y" end',
    toSql: '(select (case when (`x` = 1) then "x" when (`x` = 2) then "y" end))'
  },
  {
    sql: 'select case when (x=1) then "x" when x = 2 then "y" end',
    toSql: '(select (case when (`x` = 1) then "x" when (`x` = 2) then "y" end))'
  },
  {
    sql: 'select case when true then case when true then 1 end end as `v` from `test_table`',
    toSql: '(select (case when true then (case when true then 1 end) end) as `v` from (`test_table`))'
  },
  {
    sql: 'select x, sum(1) AS \`count\` from y left join x on (a.foo=b.foo)',
    toSql: '(select `x`, sum(1) as `count` from ((`y` left join `x` on (`a`.`foo` = `b`.`foo`))))',
    expected: {
      joins: [
        {
          side: 'left',
          inner: false,
          specific_outer: false,
          columns: [
            {name: 'foo', type: 'column', table:'a'},
            {name: 'foo', type: 'column', table:'b'}
          ],
          ref_right: {type: 'table', table: 'x'},
        }
      ]
    }
  },
  {
    sql: 'select x, sum(1) AS \`count\` from y left outer join x on (a.foo=b.foo)',
    toSql: '(select `x`, sum(1) as `count` from ((`y` left outer join `x` on (`a`.`foo` = `b`.`foo`))))',
    expected: {
      joins: [
        {
          side: 'left',
          inner: false,
          specific_outer: true,
          columns: [
            {name: 'foo', type: 'column', table:'a'},
            {name: 'foo', type: 'column', table:'b'}
          ],
          ref_right: {type: 'table', table: 'x'},
        }
      ]
    }
  },
  {
    sql: 'select x, sum(1) AS \`count\` from y right join x on (a.bar=b.bar)',
    toSql: '(select `x`, sum(1) as `count` from ((`y` right join `x` on (`a`.`bar` = `b`.`bar`))))',
    expected: {
      joins: [
        {
          side: 'right',
          inner: false,
          specific_outer: false,
          columns: [
            {name: 'bar', type: 'column', table:'a'},
            {name: 'bar', type: 'column', table:'b'}
          ],
          ref_right: {type: 'table', table: 'x'},
        }
      ]
    }
  },
  {
    sql: 'select x from ((test))',
    expected:  {
      referencedTables: ['test']
    },
    toSql: '(select `x` from (`test`))',
  },
  {
    sql: 'select x and y and z from l',
    toSql: '(select ((`x` and `y`) and `z`) from (`l`))'
  },
  {
    sql: 'select x + y + z from l',
    toSql: '(select ((`x` + `y`) + `z`) from (`l`))'
  },
  {
    sql: "select replace(substr('test',10), 'a', '') AS `testing`",
    toSql: '(select replace(substr("test", 10), "a", "") as `testing`)'
  },
  {
    sql: "select sum(if(`this`.`name`=`mapping`, 0, 1))",
    toSql: "(select sum(if((`this`.`name` = `mapping`), 0, 1)))"
  },
  {
    sql: 'select (select * from x) as x',
    toSql: '(select (select * from (`x`)) as `x`)'
  },
  {
    sql: 'select (x is not null) as y',
    toSql: '(select (`x` is not null) as `y`)'
  },
  {
    sql: 'select cast(x as date)',
    toSql: '(select cast(`x` as date))'
  },
  {
    sql: 'select cast(x as decimal(10))',
    toSql: '(select cast(`x` as decimal(10)))'
  },
  {
    sql: 'select cast(x as decimal(10,2))',
    toSql: '(select cast(`x` as decimal(10, 2)))'
  },
  {
    sql: 'select cast(x as decimal(10,   2))',
    toSql: '(select cast(`x` as decimal(10, 2)))'
  },
  {
    sql: 'select length(x)>0 and a.b is not null',
    toSql: '(select ((length(`x`) > 0) and (`a`.`b` is not null)))'
  },
  {
    sql: 'select * from a group by a.x',
    toSql: '(select * from (`a`) group by (`a`.`x`))',
    expected: {
			returnColumns: []
		}
  },
  {
    sql: 'select * from foo group by foo.x',
    toSql: '(select * from (`foo`) group by (`foo`.`x`))',
    expected: {
      parsed: {
        "type": "select",
        "top": undefined,
        "all_distinct": undefined,
        "selection": {
          "type": "select_all"
        },
        "table_exp": {
          "type": "from_table",
          "from": {
            "type": "from",
            "table_refs": [
              {
                "type": "table",
                "table": "foo"
              }
            ]
          },
          "where": undefined,
          "groupby": {
            "type": "group_by",
            "columns": {
              "type": "selection_columns",
              "columns": [
                {
                  "type": "column_expr",
                  "expression": {
                    "type": "column",
                    "table": "foo",
                    "name": "x"
                  }
                }
              ]
            }
          },
          "having": undefined,
          "order": undefined,
          "limit": undefined
        }
      },
		}
  },
  {
    sql: 'select * from foo group by foo.x limit 1',
    toSql: '(select * from (`foo`) group by (`foo`.`x`) limit 1)',
  },
  {
    sql: 'select * from foo group by foo.x limit -1',
    toSql: '(select * from (`foo`) group by (`foo`.`x`) limit -1)',
  },
  {
    sql: 'select * from foo group by foo.x order by foo.x desc limit -1',
    toSql: '(select * from (`foo`) group by (`foo`.`x`) order by `foo`.`x` desc limit -1)',
  },
  {
    error: `it's not allowed to place 'limit' before 'order by'`,
    sql: 'select * from foo group by foo.x limit -1 order by foo.x desc',
  },
  {
    sql: 'select `a`.`b` AS `c`,(`x`.`y` - interval (dayofmonth(`a`.`b`) - 1) day) AS `month`,sum(`a`.`b`) AS `a`,sum(`a`.`b`) AS `c`,cast(substr(max(concat(`x`.`y`,`x`.`total`)),11) as signed) AS `a` from `b` group by `a`.`a`,(`a`.`b` - interval (dayofmonth(`x`.`y`) - 1) day)',
    toSql: '(select `a`.`b` as `c`, '+
      '(`x`.`y` - interval (dayofmonth(`a`.`b`) - 1) day) as `month`, '+
      'sum(`a`.`b`) as `a`, '+
      'sum(`a`.`b`) as `c`, '+
      'cast(substr(max(concat(`x`.`y`, `x`.`total`)), 11) as signed) as `a` '+
      'from (`b`) group by (`a`.`a`, (`a`.`b` - interval (dayofmonth(`x`.`y`) - 1) day)))'
  },
  {
    sql: 'select case "test" when "test" then 1 else 3 end',
    toSql: '(select (case "test" when "test" then 1 else 3 end))'
  },
  {
    sql: 'select [order] from [test]',
    toSql: '(select `order` from (`test`))'
  },
  {
    sql: 'select * from x having a=b',
    toSql: '(select * from (`x`) having ((`a` = `b`)))'
  },
  {
    sql: 'select * from x order by a, b asc',
    toSql: '(select * from (`x`) order by `a`, `b` asc)'
  },
  {
    sql: 'select * from x limit 1',
    toSql: '(select * from (`x`) limit 1)'
  },
  {
    sql: 'select * from x order by c desc limit 1',
    toSql: '(select * from (`x`) order by `c` desc limit 1)'
  },
  // handle different cases in function identifiers, and regular identifiers
  {
    sql: 'select dAte() as x',
    toSql: '(select dAte() as `x`)'
  },
  {
    sql: 'select DaTe() as X',
    toSql: '(select DaTe() as `X`)'
  },
  {
    sql: "select count(*) as count, FROM_DAYS(TO_DAYS(`modified_at`)-MOD(TO_DAYS(`modified_at`) -1, 7)) as ts from job group by ts",
    toSql: '(select count(*) as `count`, FROM_DAYS((TO_DAYS(`modified_at`) - MOD((TO_DAYS(`modified_at`) - 1), 7))) as `ts` from (`job`) group by (`ts`))'
  },
  {
    sql: "select cast(x as float)",
    toSql: '(select cast(`x` as float))'
  },
  {
    sql: "select top 10 x from test_table",
    toSql: "(select top 10 `x` from (`test_table`))"
  },
  {
    sql: "select cast(x as decimal) as y",
    toSql: "(select cast(`x` as decimal) as `y`)"
  },
  {
    sql: "select cast(x as decimal) as y#comment",
    toSql: "(select cast(`x` as decimal) as `y`)"
  },
	{
    sql: "select cast(x as decimal); ",
    toSql: "(select cast(`x` as decimal))"
  },
  {
    sql: 'select x.y>DATE_SUB(CURDATE(),INTERVAL 7 day) -- comments',
    toSql: "(select (`x`.`y` > DATE_SUB(CURDATE(), interval 7 day)))"
  },
	{
		sql: `select x, sum(y), count(*) from test group by x, sum(y) with rollup`,
		toSql: '(select `x`, sum(`y`), count(*) from (`test`) group by (`x`, sum(`y`)) with rollup)'
	},
	{
		sql: `select a.x,b.y from a left join (select x,y from c) b on a.x=b.x`,
		toSql: '(select `a`.`x`, `b`.`y` from ((`a` left join (select `x`, `y` from (`c`)) as `b` on (`a`.`x` = `b`.`x`))))',
		expected: {
			sourceTables: ['a','c']
		}
	},
	{
		sql: `select a.x, b.y from a left join b using (x)`,
		toSql: '(select `a`.`x`, `b`.`y` from ((`a` left join `b` using (`x`))))',
		expected: {
			aliases: {
				a:'a',
				b:'b'
			}
		}
	},
	{
		sql: `select a.x, b.y from c as a left join d as b using (z)`,
		toSql: '(select `a`.`x`, `b`.`y` from ((`c`as `a` left join `d`as `b` using (`z`))))',
		expected: {
			aliases: {
				a:'c',
				b:'d'
			}
		}
	},
	{
		sql:'select x, y -- testing\n\tfrom x\n-- help',
		toSql: '(select `x`, `y` from (`x`))'
	},
	{
		sql:`select binary x=y from t`,
		toSql: '(select (binary (`x`) = `y`) from (`t`))'
	},
	{
		sql: 'select x <=> z from y',
		toSql: '(select (`x` <=> `z`) from (`y`))'
	},
	{
		sql: `select a from b where d`,
		toSql: '(select `a` from (`b`) where (`d`))',
		expected: {
			returnColumns: [{
				name: 'a',
				expression: {
					type: 'identifier',
					value: 'a',
				},
				mappedTo: {
					column: 'a'
				},
				sourceColumns: [{
					type: 'identifier',
					value: 'a'
				}]
			}]
		}
	},
	{
		sql: `select a from x where (z or not b)`,
		toSql: '(select `a` from (`x`) where ((`z` or (not `b`))))'
  },
	{
    sql: `select a from x where (id = 1)`,
		toSql: '(select `a` from (`x`) where ((`id` = 1)))'
  },
	{
    sql: `select a from x where (name = 'Jack')`,
		toSql: "(select `a` from (`x`) where ((`name` = \"Jack\")))"
  },
	{
    sql: `select a from x where name = 'Jack' and id > 19`,
		toSql: "(select `a` from (`x`) where (((`name` = \"Jack\") and (`id` > 19))))"
  },
	{
		sql: `select not a or b from x`,
		toSql: '(select ((not `a`) or `b`) from (`x`))'
	},
	{
		sql: `select not (a or b) from x`,
		toSql: '(select (not (`a` or `b`)) from (`x`))'
	},
	{
		sql: 'select a from b where (c or not d) and e is not null and f',
		toSql: '(select `a` from (`b`) where ((((`c` or (not `d`)) and (`e` is not null)) and `f`)))'
	},
	{
    exclude: true,
		sql: 'select a.x from b',
		toSql: '(select `a`.`x` from (`b`))',
		expected: {
			returnColumns: [{
				expression: {
					type: 'column',
					table: 'a',
					name: 'x'
				},
				name: 'x',
				mappedTo: {
					column: 'x',
					table: 'a'
				},
				sourceColumns: [{
					type: 'column',
					table: 'a',
					name: 'x'
				}]
			}]
		}
	},
  {
    exclude: true,
		sql: `\
select user.id as uid,
user.name as name,
task.checked as finished,
form.title as task_title
from user
inner join task on (task.executor_id = user.id)
left outer join form on (task.task_form_id = form.id)
where task.checked = 1 and user.name = 'Jack'
    `.split('\n').join('\n'),
		toSql: '(select `a`.`x` from (`b`))',
		expected: {
			returnColumns: [{
				expression: {
					type: 'column',
					table: 'a',
					name: 'x'
				},
				name: 'x',
				mappedTo: {
					column: 'x',
					table: 'a'
				},
				sourceColumns: [{
					type: 'column',
					table: 'a',
					name: 'x'
				}]
			}]
		}
	}
];

const parser = require('../../');

describe('parse', function() {
  require('../helpers').dotest(tests, parser)
});

if (require.main === module) {
  test.run(console.DEBUG)
}
