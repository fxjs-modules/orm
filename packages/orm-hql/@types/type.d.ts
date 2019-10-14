declare namespace FxHQL {
    class Parser {
        parse (sql: string): string
    }
}

declare module "@fxjs/orm-hql" {
    export = FxHQL.Parser
}