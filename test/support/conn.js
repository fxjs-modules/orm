const sqliteConn = 'sqlite:test.db'
let mysqlConn = process.env.FX_ORM_TEST_MYSQL

if (mysqlConn)
    mysqlConn = mysqlConn.startsWith('mysql://') ? mysqlConn : 'mysql://root:@127.0.0.1:3306/fxjs-orm-test';

let conn = mysqlConn || sqliteConn;
if (process.env.FX_ORM_BD_DEBUG)
    conn += '?debug=1'

module.exports = conn