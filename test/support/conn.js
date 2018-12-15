const sqliteConn = 'sqlite:test.db'
let mysqlConn = process.env.FX_ORM_TEST_MYSQL

if (mysqlConn)
    mysqlConn = mysqlConn.startsWith('mysql://') ? mysqlConn : 'mysql://root:123456@127.0.0.1:3306/fxjs-orm-test';

module.exports = mysqlConn || sqliteConn;