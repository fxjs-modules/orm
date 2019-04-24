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
    }
    
    type IConnectionCallback = FibOrmNS.ExecutionCallback<any, FxOrmNS.ORMLike>

    // just for compatible
    type IConnectFunction = FxOrmNS.ExportModule['connect'];

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
        pool?: boolean | IConnectionPoolOptions;
        debug?: boolean;
        // query?: { [key: string]: string | number; }
        pathname?: string
        query?: Class_UrlObject['query']
        href?: Class_UrlObject['href']
        
        timezone?: FxSqlQuery.FxSqlQueryTimezone

        [extra: string]: any
    }

    interface IConnectionPoolOptions {
        maxsize?: FibPoolNS.FibPoolOptionArgs['maxsize']
        timeout?: FibPoolNS.FibPoolOptionArgs['timeout']
        retry?: FibPoolNS.FibPoolOptionArgs['retry']
    }

    interface IDBConnectionConfig {
        protocol: IConnectionOptions['protocol']
        query: IConnectionOptions['query']
        database: IConnectionOptions['database']
        user: IConnectionOptions['user']
        password: IConnectionOptions['password']
        host: IConnectionOptions['host']

        href: IConnectionOptions['href']
        pathname: IConnectionOptions['pathname']
        timezone: IConnectionOptions['timezone']

        [extra: string]: any
    }
}