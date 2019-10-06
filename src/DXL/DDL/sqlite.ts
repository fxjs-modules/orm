import Base from "./_base";
import { configurable } from "../../Decorators/accessor";

class DDL_SQLite extends Base {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    dropTable (
        this: DDL_SQLite,
        table: string,
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

        this.dbdriver.connectionPool(connection => {
            this.execSqlQuery(connection, kq.toString());
        })

        return true;
    }
}

export default DDL_SQLite