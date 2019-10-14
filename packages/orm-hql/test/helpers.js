exports.dotest = function (tests, parser) {
  tests.map(t => {
    let describeFunc = describe;

    if (t.only) describeFunc = odescribe;

    if (t.exclude) return ;

    const description = t.description || t.error || t.sql.slice(0,100)

    describeFunc(description, function() {
      try {
        let parsed

        if (t.error) {
          it('parse error', function () {
            assert.throws(() => {
              parser.parse(t.sql)
            })
          })
          return ;
        }

        it('parse', function() {
          parsed = parser.parse(t.sql);
        });

        for(let e in t.expected) {
          it(e + " = " + JSON.stringify(t.expected[e]), function() {
            assert.deepEqual(t.expected[e], parsed[e]);
          });
        }

        it('toSql = ' + t.toSql, function() {
          const toSql=parser.toSql(parsed.parsed);
          assert.equal(t.toSql, toSql);
        });
      } catch(e) {
        it('parse error', function() {
          // console.error(e)
          throw e
        });
      }
    });
  })
}
