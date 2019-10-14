/// <reference path="_common.d.ts" />
/// <reference path="parser.d.ts" />

declare namespace FxHQLParser {
    type ParsedNode =
        TableNode
        | TableRefNode
        | ActionNode__CreateView
        | StatementNode__Select
        | Statement_Binary
        | UnionNode
        | FromNode
        | FromTableNode
        | AllNode
        | DistinctNode
        | GroupByNode
        | SelectAllNode
        | ColumnNode
        | ExprCommaListNode
        | WhereNode
        | HavingNode
        | SelectionColumnNode
        | OrderNode
        | OrderStatementNode
        | OperatorNode
        | IsNullNode
        | InNode
        | OpNode__Between
        | OpNode_Like
        | ExistsNode
        | ValueNode_Null
        | ValueNode_True
        | ValueNode_False
        | Statement_If
        | Statement_Case
        | Statement_When
        | ConvertNode
        | IntervalNode
        | CastNode
        | DataTypeNode
        | DateUintNode
        | FunctionCallNode
        | ValueTypeStringNode
        | IdentifierNode
        | ValueTypeDecimal

    interface ParsedResult {
        referencedTables: string[]
        createdTables: string[] | undefined
        sourceTables: string[]
        aliases: { [t: string]: string }
        operation: ParsedNodeBase['type']
        parsed: IParsedNode<any>
        joins: JoinInfoItem[]
        returnColumns: {
            name: string
            expression: ColumnNode['expression']
            sourceColumns: ColumnNode[]
            mappedTo: {
                column: ColumnNode['expression']['value']
            } | {
                column: ColumnNode['expression']['name']
                table: ColumnNode['expression']['table']
            }
        }[]
    }
}

declare namespace FxHQL {
    class Parser {
        static singleton: Parser

        _parser: any
        constructor(opts: {
            stringEscape?: (...args: any[]) => string
            identifierEscape?: (...args: any[]) => string
        })
        
        parse (sql: string): FxHQLParser.ParsedResult
        toSql (parsed: FxHQLParser.ParsedResult['parsed']): string
    }
}

declare module "@fxjs/orm-hql" {
    export = FxHQL.Parser
}
