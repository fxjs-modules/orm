import Base from "./_base";
import { configurable } from "../../Decorators/accessor";

class DDL_SQLite extends Base {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    dropTable: Base['dropTable'] = function (
        this: DDL_SQLite,
        table,
        {
            beforeQuery = () => void 0
        } = {}
    ) {

        let kq = this.sqlQuery
            .knex.schema
            .dropTableIfExists(table)

        if (typeof beforeQuery === 'function') {
            const kqbuilder = beforeQuery(kq)

            if (kqbuilder)
                kq = kqbuilder
        }

        this.execSqlQuery(kq.toString());

        return true;
    }
}

export default DDL_SQLite