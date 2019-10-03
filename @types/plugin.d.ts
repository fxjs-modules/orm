declare namespace FxORMPlugin {
    interface PluginOptions {
        beforeDefine (name: string, properties: FxOrmModel.ModelPropertyDefinitionHash): void
    }
}