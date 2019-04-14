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
            <T=any>(): void
        };
        commit: {
            <T=any>(): void
        };
        rollback: {
            <T=any>(): void
        };
        trans: {
            <T=any>(
                cb?: FxOrmNS.GenericCallback<T, void | boolean, IDbConnection>
            ): boolean
        }
        execute: {
            <T=any, T2=any>(sql: string, cb?: FxOrmNS.GenericCallback<T>): T2;
            (sql: string, ...args: any[]): any;
        }

        [ext: string]: any;
        /* maybe useless :start */
        // hasMany?: Function;
        // remove?: Function;

        // propertyToValue?: Function;
        // insert?: Function;
        /* maybe useless :end */
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
        protocol: IConnectionOptions['protocol']
        query: IConnectionOptions['query']
        database: IConnectionOptions['database']
        user: IConnectionOptions['user']
        password: IConnectionOptions['password']
        host: IConnectionOptions['host']
    }
}