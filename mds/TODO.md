## @fxjs/orm

### features
- [ ] db
    - [ ] standalone version `@fxjs/db`, which provide variables of `FxOrmDb.Database`
    - [ ] make test for mongodb running
    - [ ] setup travis test env for mysql/mariadb/mongodb
- [ ] pool
    - [ ] privode api for create orm pool
    - [ ] make `DMLDriverOptions.pool` availble

### test cases
* [ ] many_associations(with props)
    - [x] extra: addAccessor
    - [ ] extra: hasAccessor
    - [ ] extra: setAccessor
    - [ ] extra: getAccessor
    - [ ] extra: delAccessor
* [ ] low-level driver usages
    - [ ] `driver.query`
    - [ ] `driver.execQuerySync`
    - [ ] `driver.trans`
* [ ] mixture findBy
    - [ ] hasOne + hasMany
    - [ ] hasOne + extendsTo
    - [ ] hasMany + extendsTo
    - [ ] hasOne + hasMany + extendsTo
* [ ] `join_where` in findBy

### benchmark

* [ ] chainFind 100 data items
* [ ] chainFind 1000 data items
* [ ] chainFind 10000 data items

### docs

- [ ] usage about `exports.Settings`
- [ ] usage about `exports.settings`
- [ ] usage about `exports.use`
    - [ ] add `exports.useSync` or make `exports.use` can be used as sync function
- [ ] usagea about `mysql::ChainFindObject.whereExists`
- [ ] low-level driver usages about `driver.query`, `driver.execQuerySync`, `driver.trans`, etc.