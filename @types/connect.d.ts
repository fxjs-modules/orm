declare namespace FxOrmNS {
    interface IDbConnection extends Class_DbConnection {
        close: {
            (cb?: FxOrmNS.VoidCallback): void
        }
        end?: {
            (cb?: FxOrmNS.VoidCallback): void
        }
        release?: {
            (cb?: FxOrmNS.VoidCallback): void
        }
        begin: {
            <T=any>(cb?: FxOrmNS.GenericCallback<T>): void
        };
        commit: {
            <T=any>(cb?: FxOrmNS.GenericCallback<T>): void
        };
        rollback: {
            <T=any>(cb?: FxOrmNS.GenericCallback<T>): void
        };
        trans: {
            <T=any>(cb?: FxOrmNS.GenericCallback<T>): void
            (func: Function): boolean
        }
        execute: {
            <T=any>(sql: string, cb: FxOrmNS.GenericCallback<T>): any;
            (sql: string, ...args: any[]): any;
        }

        hasMany?: Function;
        remove?: Function;

        propertyToValue?: Function;
        insert?: Function;
    }
    
    interface IConnectionCallback {
        (err: Error, orm?: FxOrmNS.ORM): void
    }

    interface IConnectFunction {
        (uri: string): FxOrmNS.ORM;
        (uri: string, callback: IConnectionCallback): FxOrmNS.ORM;
        (options: FxOrmNS.IConnectionOptions): FxOrmNS.ORM;
        (options: FxOrmNS.IConnectionOptions, callback: IConnectionCallback): FxOrmNS.ORM;
    }

    interface IConnectionOptions {
        protocol?: string;
        /**
         * 
         * prioty: hasOwnProperty('hostname') > host
         */
        hostname?: string;
        host?: string;
        port?: number|string;
        /**
         * if auth existed, user/password would be overwritten
         */
        auth?: string;
        user?: string;
        password?: string;

        database?: string;
        pool?: boolean;
        debug?: boolean;
        query?: {
            [key: string]: string | number;
        }

        [extra: string]: any
    }

    interface IDBConnectionConfig extends IConnectionOptions {
        protocol: string
        query: {
            [key: string]: string;
        }
        database: string
        user: string
        password: string
        host: string
    }
}