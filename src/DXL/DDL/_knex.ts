import Base from "./_base";
import { configurable } from "../../Decorators/accessor";

class DDL_KnexBased<ConnType= any> extends Base<ConnType> {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    // createCollection (collection: string) { return null as any }

    dropCollection (collection: string) {
        const kq = this.sqlQuery
            .knex.schema
            .dropTableIfExists(collection)

        this.useConnection(connection => {
            this.execSqlQuery(connection, kq.toString());
        })

        return true;
    }
}

export default DDL_KnexBased
