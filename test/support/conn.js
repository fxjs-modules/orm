const sqliteConn = process.env.FX_ORM_TEST_SQLITE ? 'sqlite:test.db' : ''
let mysqlConn = process.env.FX_ORM_TEST_MYSQL_CONN;
if ((!mysqlConn || !mysqlConn.startsWith('mysql://')))
    mysqlConn = 'mysql://root:@127.0.0.1:3306/fxjs-orm-test';

let conn = sqliteConn || mysqlConn;
if (process.env.FX_ORM_BD_DEBUG)
    conn += '?debug=1'

module.exports = conn