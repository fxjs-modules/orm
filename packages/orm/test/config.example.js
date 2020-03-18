// To fxjs-orm-test, rename this file to config.js and update
// the following configuration
//
// To run a single driver, go to root folder and do (mysql example):
// ORM_PROTOCOL=mysql fibjs test/run
//
// To run all drivers:
// make test

exports.mysql = {
  protocol : "mysql://",
  user     : "root",
  port     : 3306,
  password : "",
  database : "fxjs-orm-test",
  query    : {
    pool     : false
  }
};
exports.postgres = {
  protocol : "postgres://",
  user     : "root",
  password : "",
  database : "fxjs-orm-test"
};
exports.redshift = {
  protocol  : "redshift://",
  user      : "root",
  password  : "",
  database  : "fxjs-orm-test"
};
exports.mongodb = {
  protocol  : "mongodb://",
  host      : "localhost",
  database  : "fxjs-orm-test"
};
exports.sqlite = {
  protocol  : "sqlite:",
  // comment line below to enable memory mode
  database  : 'test',
  query    : {
    pool     : false
  }
}; // uses in-memory database