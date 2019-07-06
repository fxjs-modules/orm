/// <reference types="@fxjs/orm" />

interface FxOrmPluginSearchliteOptions {

    /**
     * @description sqlite connection string
     * @default ':memory:'
     */
    sqlite_connection?: string
}
interface FxOrmPluginSearchlite extends FxOrmNS.PluginConstructCallback<
    FxOrmNS.ORM, FxOrmNS.PluginOptions & FxOrmPluginSearchliteOptions
> {
}

declare namespace FxOrmNS {
    interface ORM {
        $pool: FibPoolNS.FibPoolFunction<FxOrmNS.ORM>
    }

    interface ExportModule {
    }
}

declare module "@fxjs/orm-plugin-searchlite" {
    var plugin: FxOrmPluginSearchlite
    export = plugin;
}
