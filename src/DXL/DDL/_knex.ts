import Base from "./_base";
import { configurable } from "../../Decorators/accessor";

class DDL_KnexBased extends Base {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    createCollection (collection: string) {
        
    }

    dropCollection (collection: string) {
        const kq = this.sqlQuery
            .knex.schema
            .dropTableIfExists(collection)

        this.dbdriver.connectionPool(connection => {
            this.execSqlQuery(connection, kq.toString());
        })

        return true;
    }
}

export default DDL_KnexBased