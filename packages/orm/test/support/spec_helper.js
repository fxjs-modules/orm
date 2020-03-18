var common = require('../common');

exports.connect = function (cb) {
  var opts = {}

  if (1 in arguments) {
    opts = arguments[0]
    cb = arguments[1]
  }

  return common.createConnection(opts, function (err, conn) {
    if (err) throw err

    if (typeof cb === 'function')
        cb(conn)
  });
}

exports.dropSync = function (models, done) {
  if (!Array.isArray(models)) {
    models = [models]
  }

  models.forEach(function (item) {
    item.drop()
    item.sync()
  })

  if (done)
    done()
}

exports.countTime = function (syncRun) {
  const start = Date.now()
  syncRun()
  const end = Date.now()

  const diff = end - start

  return {
    start, end, diff
  }
}
