declare namespace FxORMPlugin {
    interface PluginOptions {
        beforeDefine (name: string, properties: Fibjs.AnyObject): void
    }

    interface PluginHooksDefinition {
        before_connect? (
            snapshot: {
                connect_options: Class_UrlObject
            }
        ): void
        after_connect? (
            snapshot: {
                connect_options: Class_UrlObject
            }
        ): void
        before_query? (
            context: {
                uuid: string,
                type: 'get-one' | 'find' | 'aggregation' | 'generate-view' | 'search',
                conditions: any
            }
        ): void
        after_query? (
            context: {
                uuid: string,
                type: 'get-one' | 'find' | 'aggregation' | 'generate-view' | 'search',
            } & ({
                success: true
                result: any
            } | {
                success?: false
                error: Error
            })
        ): void
    }
}
