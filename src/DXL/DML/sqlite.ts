import Base, { ConstructorOpts } from "./_base";
import { configurable } from "../../Decorators/accessor";

interface T_DML_SQLite {
    find: FxOrmDMLDriver.DMLDriver['find']
    insert: FxOrmDMLDriver.DMLDriver['insert']
    remove: FxOrmDMLDriver.DMLDriver['remove']
    update: FxOrmDMLDriver.DMLDriver['update']
    clear: FxOrmDMLDriver.DMLDriver['clear']
}

class DML_SQLite extends Base<Class_SQLite> implements T_DML_SQLite {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    constructor(opts: ConstructorOpts<Class_SQLite>) {
        super({ dbdriver: opts.dbdriver })
    }

    find: FxOrmDMLDriver.DMLDriver['find'] = function (
        this: DML_SQLite,
        fields,
        table,
        conditions,
        opts
    ) {
        const q = this.sqlQuery.select()
            .from(table)
            .select(fields);

        if (opts.offset) {
            q.offset(opts.offset);
        }
        if (typeof opts.limit == "number") {
            q.limit(opts.limit);
        } else if (opts.offset) {
            // OFFSET cannot be used without LIMIT so we use the biggest INTEGER number possible
            q.limit('9223372036854775807');
        }

        const results = this.dbdriver.execute(q.build());

        // utils.buildOrderToQuery.apply(this, [q, opts.order]);
        // q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
        // utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

        return results
    }

    insert: FxOrmDMLDriver.DMLDriver['insert'] = function (
        this: DML_SQLite,
        table,
        data,
        keyProperties,
    ) {
        const q = this.sqlQuery.insert()
            .into(table)
            .set(data)
            .build();

        const info = this.execSqlQuery<FxOrmQuery.InsertResult>(q);

        if (!keyProperties) return null;

        const ids: { [k: string]: any } = {};

        if (keyProperties.length == 1 && keyProperties[0].type == 'serial') {
            ids[keyProperties[0].name] = info.insertId;
        } else {
            for (let i = 0, prop; i < keyProperties.length; i++) {
                prop = keyProperties[i];
                // Zero is a valid value for an ID column
                ids[prop.name] = data[prop.mapsTo] !== undefined ? data[prop.mapsTo] : null;
            }
        }

        return ids;
    }

    update: FxOrmDMLDriver.DMLDriver['update'] = function (
        this: DML_SQLite,
        table,
        changes,
        conditions
    ) {
        const q = this.sqlQuery.update()
            .into(table)
            .set(changes)
            .where(conditions)
            .build();

        if (this.isDebug)
            require("../../Debug").sql('sqlite', q);

        return this.execSqlQuery(q);
    }

    remove: FxOrmDMLDriver.DMLDriver['remove'] = function (
        this: DML_SQLite,
        table,
        conditions
    ) {
        var q = this.sqlQuery.remove()
                        .from(table)
                        .where(conditions)
                        .build();

        if (this.isDebug)
            require("../../Debug").sql('sqlite', q);

        return this.execSqlQuery(q);
    }

    clear: FxOrmDMLDriver.DMLDriver['clear'] = function(
        this: FxOrmDMLDriver.DMLDriver_SQLite,
        table
    ) {
        this.execQuery(
            this.query.remove()
                    .from(table)
                    .build()
        );
        
        this.execQuery(
            this.query.remove()
                    .from(table)
                    .where({ name: 'sqlite_sequence' })
                    .build()
        );

        return undefined
    }
}

export default DML_SQLite