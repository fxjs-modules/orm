var common = exports;
var Query  = require('../');

common.Query = Query;
common.Text  = Query.Text;

function assertQuery (query) {
	assert.property(query, 'knex')
	assert.property(query, 'Dialect')

	assert.property(query.Dialect, 'type')
	assert.property(query.Dialect, 'DataTypes')
}

common.Select = function (qOpts) {
	var q = new (Query.Query)(qOpts);
	assertQuery(q);

	return q.select();
};
common.Create = function (qOpts){
    var q = new (Query.Query)(qOpts);
	assertQuery(q);

    return q.create();
};
common.Insert = function (qOpts) {
	var q = new (Query.Query)(qOpts);
	assertQuery(q);

	return q.insert();
};

common.Update = function (qOpts) {
	var q = new (Query.Query)(qOpts);
	assertQuery(q);

	return q.update();
};

common.Remove = function (qOpts) {
	var q = new (Query.Query)(qOpts);
	assertQuery(q);

	return q.remove();
};

/**
 * 
 * @param {import('../lib/Typo/Dialect').FxSqlQueryDialect.DialectType} dialect 
 * @returns {import('../lib/Typo/Dialect').FxSqlQueryDialect.Dialect}
 */
common.getDialect = function (dialect) {
	return require('../lib/Dialects/' + dialect);
};

common.getProtocol = function () {
	return process.env.QUERT_PROTOCOL || 'mysql'
}

common.isSupportBigInt = function(){
	try{
		var n = BigInt(12);
		return true;
	}catch(error){}
	return false;
}

common.runProcAndCatch = function(proc) {
	let errMsg = '';
	let error = null;

	try {
		proc();
	} catch (e) {
		error = e;
		errMsg = e.message;
	}

	return { errMsg, error }
}