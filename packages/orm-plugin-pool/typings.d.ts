/// <reference types="@fxjs/orm" />
/// <reference types="fib-pool" />

interface FxOrmPluginPoolOptions {
    definitions?: ((orm: FxOrmNS.ORM, ...args: any) => any)[]
                
    maxsize?: FibPoolNS.FibPoolOptionArgs['maxsize'],
    retry?: FibPoolNS.FibPoolOptionArgs['retry'],
    timeout?: FibPoolNS.FibPoolOptionArgs['timeout'],

    /**
     * @default true
     */
    useConnectionPool?: boolean
}
interface FxOrmPluginPool extends FxOrmNS.PluginConstructCallback<
    FxOrmNS.ORM, FxOrmNS.PluginOptions & FxOrmPluginPoolOptions
> {
}

declare namespace FxOrmNS {
    interface ORM {
        $pool: FibPoolNS.FibPoolFunction<FxOrmNS.ORM>
    }

    interface ExportModule {
        getPool: {
            (options: {
                connection: string | FxOrmNS.IConnectionOptions,
                definitions?: FxOrmPluginPoolOptions['definitions'],
                hooks?: {
                    beforeSyncModel?: FxOrmHook.HookActionCallback
                    afterSyncModel?: FxOrmHook.HookActionCallback
                }
                
                maxsize?: FibPoolNS.FibPoolOptionArgs['maxsize'],
                retry?: FibPoolNS.FibPoolOptionArgs['retry'],
                timeout?: FibPoolNS.FibPoolOptionArgs['timeout']
            }): FibPoolNS.FibPoolFunction<FxOrmNS.ORM>
        }
    }
}

declare module "@fxjs/orm-plugin-pool" {
    var plugin: FxOrmPluginPool
    export = plugin;
}
