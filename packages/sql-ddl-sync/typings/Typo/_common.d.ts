import { IDbDriver } from "@fxjs/db-driver";
import type { IProperty } from '@fxjs/orm-property';
export declare namespace FxOrmSqlDDLSync {
    type TableName = string;
    type ColumnName = string;
    interface SyncOptions<ConnType extends IDbDriver.IConnTypeEnum = IDbDriver.IConnTypeEnum> {
        dbdriver: IDbDriver<ConnType>;
        debug?: Function | false;
        /**
         * @default true
         */
        suppressColumnDrop?: boolean;
        syncStrategy?: FxOrmSqlDDLSync.SyncCollectionOptions['strategy'];
    }
    interface SyncResult {
        changes: number;
    }
    interface SyncCollectionOptions {
        columns?: Record<string, IProperty>;
        strategy?: 'soft' | 'hard' | 'mixed';
        /**
         * @default true
         */
        suppressColumnDrop?: boolean;
    }
}
