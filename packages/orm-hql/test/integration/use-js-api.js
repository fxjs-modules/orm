const test = require('test')
test.setup()

const parser = require('../../');

false && describe('use with ddlsync', function() {
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
  });
});

if (require.main === module) {
  test.run(console.DEBUG)
}
