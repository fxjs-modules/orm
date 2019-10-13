declare namespace FxORMPlugin {
    interface PluginOptions {
        beforeDefine (name: string, properties: Fibjs.AnyObject): void
    }
}