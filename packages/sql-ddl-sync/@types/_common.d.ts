declare namespace FxOrmSqlDDLSync {
    type TableName = string
    type ColumnName = string

    interface NextCallbackWrapper<T=any> {
        (arg1: any, arg2?: any, arg3?: any, cb?: FxOrmSqlDDLSync.ExecutionCallback<T>): void
    }

    interface ExecutionCallback<T> {
        (err?: Error|null, result?: T): any
    }

    interface QueueTypedNextFunction<ARG_TYPE=any>{
        (arg: ARG_TYPE, next: ExecutionCallback<void>): any
    }
}
