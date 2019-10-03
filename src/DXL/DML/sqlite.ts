import Base, { ConstructorOpts } from "./_base";
import { configurable } from "../../Decorators/accessor";

interface T_DML_SQLite {
    find: FxOrmDML.DMLDriver['find']
    insert: FxOrmDML.DMLDriver['insert']
    remove: FxOrmDML.DMLDriver['remove']
    update: FxOrmDML.DMLDriver['update']
    clear: FxOrmDML.DMLDriver['clear']
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

    find: FxOrmDML.DMLDriver['find'] = function (
        this: DML_SQLite,
        table,
        {
            fields,
            offset = 0,
            limit = 1000, // '9223372036854775807',
            orderBy = undefined,
            beforeQuery = () => void 0
        } = {}
    ) {
        let kq = this.sqlQuery.knex(table)

        if (fields) kq.select(fields)
        if (offset) kq.offset(offset)
        if (limit) kq.limit(limit as number)
        if (orderBy) kq.orderBy.apply(kq, orderBy)

        if (typeof beforeQuery === 'function') {
            const kqbuilder = beforeQuery(kq)

            if (kqbuilder)
                kq = kqbuilder
        }

        return this.execSqlQuery(kq.toString());
    }

    insert: FxOrmDML.DMLDriver['insert'] = function (
        this: DML_SQLite,
        table,
        data,
        {
            keyProperties,
            beforeQuery = () => void 0
        } = {}
    ) {
        
        let kq = this.sqlQuery.knex(table)

        kq.insert(data)

        if (typeof beforeQuery === 'function') {
            const kqbuilder = beforeQuery(kq)

            if (kqbuilder)
                kq = kqbuilder
        }

        const info = this.execSqlQuery<FxOrmQuery.InsertResult>(kq.toString());

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

    update: FxOrmDML.DMLDriver['update'] = function (
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

    remove: FxOrmDML.DMLDriver['remove'] = function (
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

    clear: FxOrmDML.DMLDriver['clear'] = function(
        this: FxOrmDML.DMLDriver_SQLite,
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