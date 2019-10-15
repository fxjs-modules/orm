const test = require('test')
test.setup()

const parser = require('../../');

describe('parse sql to query structure', function() {
  describe('parse select to structured object', function () {
    it('select one table', function () {
      assert.deepEqual(
        parser.parse(`select * from table_a`),
        {
          "referencedTables": [
            "table_a"
          ],
          "aliases": {
            "table_a": "table_a"
          },
          "createdTables": undefined,
          "sourceTables": [
            "table_a"
          ],
          "operation": "select",
          "parsed": {
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
                    "table": "table_a"
                  }
                ]
              },
              "where": undefined,
              "groupby": undefined,
              "having": undefined,
              "order": undefined,
              "limit": undefined
            }
          },
          "joins": [],
          "returnColumns": []
        }
      )
    });

    it('inner join two tables', function () {
      assert.deepEqual(
        parser.parse(`select * from table_a a inner join table_b b on a.id = b.a_id`)
          .parsed.table_exp,
        {
          "type": "from_table",
          "from": {
            "type": "from",
            "table_refs": [
              {
                "type": "table_ref",
                "side": undefined,
                "ref_left": {
                  "type": "table",
                  "table": "table_a",
                  "alias": "a"
                },
                "ref_right": {
                  "type": "table",
                  "table": "table_b",
                  "alias": "b"
                },
                "on": {
                  "type": "operator",
                  "operator": "=",
                  "op_left": {
                    "type": "column",
                    "table": "a",
                    "name": "id"
                  },
                  "op_right": {
                    "type": "column",
                    "table": "b",
                    "name": "a_id"
                  }
                },
                "inner": true,
                "specific_outer": false,
                "using": undefined
              }
            ]
          },
          "where": undefined,
          "groupby": undefined,
          "having": undefined,
          "order": undefined,
          "limit": undefined
        }
      )
    });

    it('join three tables', function () {
      var samplesql = `\
        select * from table_a a
        inner join table_b b on a.id = b.a_id
        left join table_c c on a.id = c.a_id
        where 1=1
      `
      assert.deepEqual(
        parser.parse(samplesql).parsed.table_exp,
        {
          "type": "from_table",
          "from": {
            "type": "from",
            "table_refs": [
              {
                "type": "table_ref",
                "side": "left",
                "ref_left": {
                  "type": "table_ref",
                  "side": undefined,
                  "ref_left": {
                    "type": "table",
                    "table": "table_a",
                    "alias": "a"
                  },
                  "ref_right": {
                    "type": "table",
                    "table": "table_b",
                    "alias": "b"
                  },
                  "on": {
                    "type": "operator",
                    "operator": "=",
                    "op_left": {
                      "type": "column",
                      "table": "a",
                      "name": "id"
                    },
                    "op_right": {
                      "type": "column",
                      "table": "b",
                      "name": "a_id"
                    }
                  },
                  "inner": true,
                  "specific_outer": false,
                  "using": undefined
                },
                "ref_right": {
                  "type": "table",
                  "table": "table_c",
                  "alias": "c"
                },
                "on": {
                  "type": "operator",
                  "operator": "=",
                  "op_left": {
                    "type": "column",
                    "table": "a",
                    "name": "id"
                  },
                  "op_right": {
                    "type": "column",
                    "table": "c",
                    "name": "a_id"
                  }
                },
                "inner": false,
                "specific_outer": false,
                "using": undefined
              }
            ]
          },
          "where": {
            "type": "where",
            "condition": {
              "type": "operator",
              "operator": "=",
              "op_left": {
                "type": "decimal",
                "value": 1
              },
              "op_right": {
                "type": "decimal",
                "value": 1
              }
            }
          },
          "groupby": undefined,
          "having": undefined,
          "order": undefined,
          "limit": undefined
        }
      )

      assert.deepEqual(
        parser.parse(samplesql).joins.map(join => (
          {
            side: join.side,
            specific_outer: join.specific_outer,
            inner: join.inner,
            columns: join.columns,
            ref_right: join.ref_right
          }
        )),
        [
          {
            "side": "left",
            "specific_outer": false,
            "inner": false,
            "columns": [
              {
                "type": "column",
                "table": "a",
                "name": "id"
              },
              {
                "type": "column",
                "table": "c",
                "name": "a_id"
              }
            ],
            "ref_right": {
              "type": "table",
              "table": "table_c",
              "alias": "c"
            }
          },
          {
            "side": undefined,
            "specific_outer": false,
            "inner": true,
            "columns": [
              {
                "type": "column",
                "table": "a",
                "name": "id"
              },
              {
                "type": "column",
                "table": "b",
                "name": "a_id"
              }
            ],
            "ref_right": {
              "type": "table",
              "table": "table_b",
              "alias": "b"
            }
          }
        ]
      )

      assert.deepEqual(
        parser.parse(samplesql).referencedTables,
        [
          'table_a',
          'table_b',
          'table_c'
        ]
      )

      assert.deepEqual(
        parser.parse(samplesql).aliases,
        {
          "a": "table_a",
          "b": "table_b",
          "c": "table_c"
        }
      )
    });

    it('aliases when multiple tables', function () {
      var samplesql = `\
        select * from table_a t_a
        inner join table_b t_b on t_a.id = t_b.a_id
        left join table_c t_c on t_a.id = t_c.a_id
        where 1=1
      `

      assert.deepEqual(
        parser.parse(samplesql).referencedTables,
        [
          'table_a',
          'table_b',
          'table_c'
        ]
      )

      assert.deepEqual(
        parser.parse(samplesql).aliases,
        {
          "t_a": "table_a",
          "t_b": "table_b",
          "t_c": "table_c"
        }
      )
    });
  });
});

if (require.main === module) {
  test.run(console.DEBUG)
}
