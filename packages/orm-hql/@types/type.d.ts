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
        | FromTableExpNode
        | AllNode
        | DistinctNode
        | GroupByNode
        | SelectAllNode
        | ColumnNode
        | ExprCommaListNode
        | WhereNode
        | HavingNode
        | SelectionColumnNode
        | LimitStatementNode
        | OrderNode
        | OrderStatementNode
        | ConditionExprNode
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
        createdTables: Undefineable<string[]>
        sourceTables: string[]
        aliases: { [t: string]: string }
        operation: ParsedResult['parsed']['type']
        parsed: ActionNode__CreateView | StatementNode__Select
        joins: {
          side: TableRefNode['side']
          specific_outer: TableRefNode['specific_outer']
          inner: TableRefNode['inner']
          columns: ColumnNode[]
          ref_left: TableRefNode['ref_left']
          ref_right: TableRefNode['ref_right']
      }[]
        returnColumns: {
            name: string
            expression: ColumnNode['expression']
            sourceColumns: ColumnNode[]
            mappedTo: {
                column: string
                table?: string
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
