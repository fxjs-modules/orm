var url = require('url')

var ORM = require('../../');

module.exports.connect = function (opts = {}) {
    return ORM.connectSync({
        ...url.parse(
            require('./conn'), true
        ).toJSON(),
        ...opts
    });
};

module.exports.dropSync = function (models, done) {
    if (!Array.isArray(models)) {
        models = [models];
    }

    models.forEach(function (item) {
        item.dropSync();
        item.syncSync();
    });

    if (done)
        done();
};