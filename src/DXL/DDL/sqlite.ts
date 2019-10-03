import Base from "./_base";
import { configurable } from "../../Decorators/accessor";

class DDL_SQLite extends Base {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }
}

export default DDL_SQLite