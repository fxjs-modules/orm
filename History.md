
v1.11.4 / 2019-11-04
==================

  * bugfix: dont cache global models.
  * bugfix: miss defaultCacheSize default setting (#25)
  * package, db-driver: Release v0.0.5
  * package, db-driver: robust change, and add `connectionPool` to driver.
  * package, db-driver:  add `getConnection` to driver.
  * package, db-driver: Release v0.0.4
  * package, db-driver: support false as boolean-value in querystring.
  * support `ModelDefineOptions.useSelfSettings`

v1.11.3 / 2019-08-19
====================

  * Release v1.11.3
  * package, sql-ddl-sync: Release v0.6.2
  * feat, main: add comment for type `FxOrmAssociation.AssociationKeyComputation`.
  * package, sql-ddl-sync: use better strategy to check if one collection has column for `mysql`, add test cases about it.
  * package, sql-ddl-sync: allow processCollection when strategy is 'mixed'.
  * feat, main: better semantic declaration, add some comments.
  * packages, sql-ddl-sync: Release v0.6.1
  * code clean.

v1.11.2 / 2019-07-21
====================

  * Release v1.11.2
  * upgrade sql-ddl-sync
  * packages, sql-ddl-sync: Release v0.6.0
  * packages, sql-ddl-sync: robust change; add Sync[`needDefinitionToColumn`]

v1.11.1 / 2019-07-20
====================

  * Release v1.11.1
  * expose `ddlDialect` for DMLDriver; fix strategy passing when `doSync`.

v1.11.0 / 2019-07-19
====================

  * Release v1.11.0
  * feat: remove FxOrmDb.DatabaseBase['conn']
  * travis fix; upgrade dependencies.
  * packages, sql-ddl-sync: Release v0.5.7
  * packages, sql-ddl-sync: recover rollup build, fix typo about Property.
  * orm: use @fxjs/db-driver as backend of Drivers/DB; upgrade dependencies.
  * packages, sql-ddl-sync: Release v0.5.6
  * packages, sql-ddl-sync: make SyncOptions['suppressColumnDrop'] near `true`.
  * packages, sql-ddl-sync: Release v0.5.5
  * packages, sql-ddl-sync: disable default force-sync, keep same behavior with previous minor version; other robust changes when force-sync.
  * packages, sql-ddl-sync: Release v0.5.4
  * packages, sql-ddl-sync: robust change.
  * packages, sql-ddl-sync: Release v0.5.3
  * packages, db-driver: Release v0.0.3
  * packages, db-driver: typo fix.
  * packages, sql-ddl-sync: Release v0.5.2
  * packages, sql-ddl-sync: fix test cases.
  * packages, sql-ddl-sync: upgrade dependencies.
  * packages, sql-ddl-sync: robust change
  * packages, sql-ddl-sync: robust change, open more APIs of `Sync`
  * packages, sql-ddl-sync: Release v0.5.1
  * packages, sql-ddl-sync: support Dialect['getCollectionColumnsSync'] and Dialect['hasCollectionColumnsSync']
  * packages, db-driver: robust change.
  * packages, db-driver: Release v0.0.2
  * packages, db-driver: typo fix.
  * packages, sql-ddl-sync: Release v0.5.0
  * packages, sql-ddl-sync: code clean.
  * packages, sql-ddl-sync: remove dependency on orm, use db-driver instead.
  * packages, db-driver: finish 1st version.
  * packages, db-driver: add typo about ServiceDriver
  * add test about redis
  * packages, db-driver: add test about specific db
  * packages, db-driver: Init.
  * packages, publish: sql-ddl-sync v0.4.1
  * packages, sql-ddl-sync: robust fix about Dialect sqlite.
  * robust change.
  * peer dependencies version correction.
  * packages, sql-ddl-sync: release 0.4.0
  * packages. sql-ddl-sync: synchronous style first, use native coroutine feature of driver in orm
  * packages, core: Init.
  * feat, packages: sync sql-ddl-sync from original repo.
  * feat, packages: integrate @fxjs/sql-ddl-sync as package. (#20)
  * upgrade @fibjs/enforce, robust change.

v1.10.3 / 2019-06-30
====================

  * Release v1.10.3
  * support $hookRef for instance.
  * typo fix.
  * [orm-plugin-uacl] use LruCache as ACLTree storage.
  * publish @fxjs/orm-plugin-uacl
  * [orm-plugin-uacl] add test cases.
  * [orm-plugin-uacl] support instance $uaclPool
  * [orm-plugin-uacl] fix bug when revoke permissions with `REVOKE_BY_UACI`.
  * [orm-plugin-uacl] typo clean, remove pointless props.
  * [orm-plugin-uacl] fix  ACLNode::could and add test case.
  * better ACLNode::could
  * [orm-plugin-uacl] add method `could` to ACLNode
  * little fix.
  * [orm-plugin-uacl] little fix about custom field type.
  * [orm-plugin-uacl] robust.
  * [orm-plugin-uacl] robust change and add README.md
  * [orm-plugin-uacl] test fix.
  * [orm-plugin-uacl] add typos.

v1.10.2 / 2019-06-25
====================

  * Release v1.10.2
  * add packages to .npmignore

v1.10.1 / 2019-06-25
====================

  * Release v1.10.1
  * literal change.
  * feat: add features about hook, use them drive orm-plugin-uacl. (#24)
  * update .npmignore.
  * plugin, feat: add orm-plugin-pool
  * typo robust.
  * helpers, feat: expose hookWait/hookTrigger in Helpers.
  * upgrade types.
  * bind Instance to event handler.
  * feat, instance: emitt events about association operations.
  * feat, instance: open `ievents` when model definition to pass `events` as instance's initial options.
  * feat, instance: support event $on, $emit, $off.
  * feat, instance: support `instance.emit`.
  * typo robust.
  * feat, hook: support keepable hook.
  * typo fix.
  * code format.

v1.10.0 / 2019-04-25
====================

  * Release v1.10.0
  * feat, instance: remove unnecessary `util.sync` in instance's creation.
  * test, model: add test case model-create.callback.js
  * test, model: add test case model-remove[.callback].js
  * fix, model: add test case property-lazyload.callback.js
  * test, model: add test case model-sync.callback.js
  * test, model: add test case model-count.callback.js
  * fix, model: add test case model-save.callback.js
  * test, model: add test case model-find.callback.js
  * test, model: add test case model-one.callback.js
  * fix, model: add test case model-get.callback.js
  * feat, Singleton: refactor with model.caches.
  * feat, Singleton: simplify inner implementaion.
  * code clean.
  * feat, orm: syncify findby about APIs.
  * feat, orm: syncify ORM.connect()
  * feat, types: replace `@types/fibjs` with `@fibjs/types`
  * fix, typo: add `fib-pool`.

v1.10.0-alpha.1 / 2019-04-22
============================

  * Release v1.10.0-alpha.1
  * code, literal: ORM/DB, config; use file mode in sqlite's test cases.
  * fix, test: fix lack of async-return-signal.

v1.10.0-alpha / 2019-04-22
==========================

  * Release v1.10.0-alpha
  * code clean.
  * feat, model: support specify parallel option when creating.
  * code, clean: ChainFind.ts
  * code, format: remove unnecessary event lock in autoFetch of association get.
  * fix, test: add test cases about callback-style function in extendsTo association.
  * fix, test: add test cases about callback-style function in hasMany association.
  * fix, test: fix wrong return-value in chain style usage for hasOne association.
  * test, config: update ci config.
  * fix, one: fix implementation about getAccessor/getSyncAccessor
  * code clean.
  * feat, instance: refactor internal events on/emit by native EventEmitter.
  * clean, code: instance.d.ts
  * feat, parallel: speed by do parallel actions  when possible.
  * feat, patch: migrate execQuerySync to driver's shared method function.
  * feat, patch: deprecate patchFindBy, patchModelAfterDefine.
  * feat, patch: try to deprecate patchObject, patchHooksInModelOptions.
  * feat, associations: finish syncifying for hasOne, hasMany associations accessor
  * feat, ExtendsTo: syncify internal implementation.
  * fix, package.json: peerDependencies
  * tuning, instance: `.save()` without callback
  * feat, test: add test environment variable `FX_ORM_TEST_DEBUG`.
  * fix, db: robust of sqlite's driver/dml
  * feat, instance: syncify internal implementation.
  * feat, patch: deprecate patchInsert, patchDriver, patchIChainFindLikeRs, patchAggregate, patchResult.
  * feat, patch: try to deprecate patchResult.
  * feat, aggregation: normalize typo, syncify internal implementation.
  * feat, model: finish syncifying basic methods.
  * feat, db: syncify internal implementation, support pool executation.
  * feat, Model: syncify internal implementation.
  * feat, ChainFind: syncify internal implementation.
  * Syncify internal API about Model.
  * use @fxjs/sql-query@0.4.0
  * test, orm: add test about orm exports(ignore unsupported drivers).
  * feat, model: recover feature of passing empty instances to `hasAccessor` in many association.

v1.9.8 / 2019-04-16
===================

  * Release v1.9.8
  * feat, model: little robust change.
  * feat, model: improve implementation of model creeate & eagerLoad.
  * feat, model: simplify implementation of `eagerLoad`
  * feat, model: fix typo and add TODO about model's `create`
  * fix, model: add `ModelOptions__Create` and apply it, fix default parallel strategy when creating items;

v1.9.7 / 2019-04-15
===================

  * Release v1.9.7
  * typo and implements normalization about callback/synchronous style arguments in driver's low-level apis.

v1.9.6 / 2019-04-10
===================

  * Release v1.9.6
  * refactor findBy*() method of model's associations, replace exists with `join on`.
  * little fix.

v1.9.5 / 2019-04-01
===================

  * Release v1.9.5
  * little fix.
  * add Helpers.parseDbConfig and apply it internally.
  * config adjust for typescript debug.
  * fix typo about validator.
  * fix typo about DMLDriver.
  * typo fix.

v1.9.4 / 2019-03-27
===================

  * Release v1.9.4
  * better implements for patch on Model and model's hooks.

v1.9.3 / 2019-03-26
===================

  * Release v1.9.3
  * add helpers; fix lack of patch to instance in afterLoad hook.
  * code clean and add some TODO.
  * abstract common code in Drivers' find/count implements.
  * upgrade @fxjs/sql-ddl-sync to version with typo not bound with @fxjs/sql-query
  * robust for test cases.
  * add pointless helpers; normalize code.

v1.9.2 / 2019-03-16
===================

  * Release v1.9.2
  * support `join_where` option in `ModelAssociationMethod__Options`.

v1.9.1 / 2019-03-16
===================

  * Release v1.9.1
  * peer latest @fxjs/sql-query to support modifiers.

v1.9.0 / 2019-03-11
===================

  * Release v1.9.0
  * 1.9.0
  * upgrade core dependencies to support literal where-condition-object.
  * robust change for test case.
  * upgrade dependency.
  * upgrade core dependencies, typo robust.
  * recovery fallback mysql conn in test.
  * use mysql as default test db in travis-ci.
  * change default mysql test connection, fix one error test case for mysql.
  * upgrade key dependency.
  * add type Model['associations'] and support it.
  * 1.9.0-dev
  * doc fix.

v1.8.8 / 2019-03-06
===================

  * Release v1.8.8
  * fix bad config in package.json
  * enable 'compilerOptions.noImplicitAny' in tsconfig.json; upgrade key dependencies, enhance robust of typo.
  * type robust.
  * typo fix.
  * [hasmany-extra] robust change; add test case about.
  * type robust.
  * code normalization.
  * test case code clean.
  * robust type change.
  * support semantic `{accessor}_find_options` for findby options in has-many options.
  * [WIP]
  * batch robust change for `for-loop` iteration initial idx statement.
  * type robust change.
  * robust change.
  * [Many.ts] fix.
  * update README.md.
  * code clean.
  * support `findBy*()` in has-many association.
  * add Helpers Module
  * code normalization.
  * support `InstanceAssociationItem_ExtendTos['modelFindByAccessor']` and `InstanceAssociationItem_HasOne['modelFindByAccessor']`, then apply them.

v1.8.7 / 2019-03-03
===================

  * Release v1.8.7
  * code literal change.
  * support `ModelOptions__Find['chainfind_linktable']` and apply it.
  * remove wrong comment.

v1.8.6 / 2019-02-20
===================

  * Release v1.8.6
  * robust.
  * upgrade dependency, fix peerDependencies.
  * upgrade entry and dependencies.
  * fix IChainFind['eager']

v1.8.5 / 2019-01-14
===================

  * Release v1.8.5
  * upgrade.
  * normalize assoc'name formmting.

v1.8.4 / 2019-01-13
===================

  * Release v1.8.4
  * upgrade fib-typify.
  * add whereExists method to ChainFind Instance.
  * allow pass `exists` to ChainFind's options in Model's `find`.

v1.8.3 / 2019-01-09
===================

  * Release v1.8.3
  * typo fix.

v1.8.2 / 2019-01-09
===================

  * Release v1.8.2
  * typo fix.
  * upgrade dependencies.
  * normalize some types
  * robust.
  * typo fix.

v1.8.1 / 2019-01-08
===================

  * Release v1.8.1
  * Release --sevmer
  * remove `FxOrmModel.ModelFieldItem`, `FxOrmProperty.NormalizedFieldOptions`.
  * fix ORM.d.ts.
  * little typo fix.

v1.8.0 / 2019-01-08
===================

  * Release v1.8.0
  * remove some comments.
  * build next minor version's typo.
  * remove unstandard interface.
  * typo fix.

v1.7.3 / 2018-12-21
===================

  * Release v1.7.3
  * typo fix.

v1.7.2 / 2018-12-18
===================

  * Release v1.7.2
  * require 'lodash.*' on demand
  * remove 3rd-party module 'hat'.

v1.7.1 / 2018-12-18
===================

  * Release v1.7.1
  * remove useless library about asynchronous.
  * replace async module in Model.ts
  * replace lodash, async with native module in 'ChainFind.ts', do related typo adjust.
  * fix type of validator modules.

v1.7.0 / 2018-12-15
===================

  * Release v1.7.0
  * remove module patch in package entry, integrate patched module as internal module.
  * [test/integration/date-type.js] fix mistake when dialect is 'mysql'.
  * adjust files position about orm-patch
  * replace 'sql-query' with '@fxjs/sql-query'.
  * replace 'sql-ddl-sync' with '@fxjs/sql-ddl-sync'

v1.6.10 / 2018-12-10
====================

  * Release v1.6.10
  * fix typo.
  * support test/intergration/model-find-chain.js tested alone.
  * support test/intergration/association-hasmany.js tested alone.
  * support test/intergration/model-save.js tested alone.
  * support test/intergration/model-get.js tested alone.
  * support test/intergration/association-hasone-reverse.js tested alone.
  * support test/intergration/model-aggregate.js tested alone.

v1.6.9 / 2018-12-07
===================

  * Release v1.6.9
  * fix dependency.

v1.6.8 / 2018-12-03
===================

  * Release v1.6.8
  * add module 'tty' module to entry sandbox.
  * add TODO.md

v1.6.7 / 2018-12-02
===================

  * Release v1.6.7
  * typo fix.

v1.6.6 / 2018-11-30
===================

  * Release v1.6.6
  * fix .npmignore

v1.6.5 / 2018-11-30
===================

  * Release v1.6.5
  * typo fix.
  * add appyeor ci badget.
  * add appveyor ci config.

v1.6.4 / 2018-11-30
===================

  * Release v1.6.4
  * typo clean.
  * add some test cases.
  * remove useless chain api, unlock supported features' use cases.
  * format code, and fix some options.
  * ts-debugable.

v1.6.3 / 2018-11-17
===================

  * Release v1.6.3
  * fix lack of export member 'enforce'

v1.6.2 / 2018-11-17
===================

  * Release v1.6.2
  * typo fix.

v1.6.1 / 2018-11-17
===================

  * Release v1.6.1
  * typo fix.

v1.6.0 / 2018-11-17
===================

  * Release v1.6.0
  * better typo

v1.5.2 / 2018-11-04
===================

  * Release v1.5.2
  * typo fix

v1.5.1 / 2018-11-04
===================

  * Release v1.5.1
  * typo fix

v1.5.0 / 2018-11-03
===================

  * Release v1.5.0
  * upgrade 'fib-typify', clean code.

v1.4.3-postalpha.7 / 2018-10-12
===============================

  * Release v1.4.3-postalpha.7
  * upgrade '@fibjs/enforce'

v1.4.3-postalpha.6 / 2018-10-12
===============================

  * Release v1.4.3-postalpha.6
  * typo fix

v1.4.3-postalpha.5 / 2018-10-12
===============================

  * Release v1.4.3-postalpha.5
  * typo fix

v1.4.3-postalpha.4 / 2018-10-12
===============================

  * Release v1.4.3-postalpha.4
  * upgrade '@fibjs/enforce', typo fix

v1.4.3-postalpha.3 / 2018-10-11
===============================

  * Release v1.4.3-postalpha.3
  * upgrade '@fibjs/enforce', do typo fix.

v1.4.3-postalpha.2 / 2018-10-10
===============================

  * Release v1.4.3-postalpha.2
  * typo fix

v1.4.3-postalpha.1 / 2018-10-09
===============================

  * Release v1.4.3-postalpha.1
  * typo fix.

v1.4.3 / 2018-10-03
===================

  * Release v1.4.3
  * code structure adjust.
  * fix params passed to driver's customType.valueToProperty
  * [WIP] normalize type definitions
  * mv 'src/orm/src' to 'src/orm/entry'
  * [README.md] little fix.

v1.4.2-postalpha / 2018-10-02
=============================

  * Release v1.4.2-postalpha
  * migrate from 'fib-orm'
  * upgrade version of 'fib-typify'
  * rename package to '@fxjs/orm'
  * upgrade package.json, add lib to .gitginore
  * type fix.
  * fix: little patch for Datebase of mysql

v1.4.2 / 2018-06-13
===================

  * Merge pull request #8 from richardo2016/master
  * 1.4.2
  * more explicit and extensible types declaration.
  * more explicit and extensible types declaration.
  * Merge pull request #6 from richardo2016/feat/1.4.1
  * Merge pull request #5 from richardo2016/feat/src_2_ts
  * Merge pull request #4 from richardo2016/feat/src_2_ts

v1.4.1 / 2018-06-10
===================

  * 1.4.1
  * add npm package badget.
  * add test dir to .npmignore
  * add .npmignore
  * basic types support for fibjs's internal typescript.
  * fix date op in find.
  * fix date type in insert and update.
  * fix afterAutoFetch hook error.
  * fix mysql timezone.
  * change version to 1.3.0
  * patch sqlite insertId error.
  * 1.2.1
  * fix afterAutoFetch error.
  * fix timezone.
  * support transaction.
  * remove mysql driver insert function patch.
  * 使用缺省 url 模块
  * 取消 rs 转换
  * 修复 fibjs 新版本兼容
  * 更新 ci 地址
  * 更新版本号
  * 更新 repository 地址
  * 修改版本号
  * 修复错误
  * 增加事物支持
  * 增加 keywords
  * Merge pull request #1 from ngot/ci
  * chore:add lost deps & add ci
  * readme 和 版本信息
  * 恢复部分未支持的用例
  * 完善链式调用的对象修补
  * 支持 execQuerySync
  * typo
  * init.
