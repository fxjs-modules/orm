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
        | ColumnExprNode
        | ColumnRefNode
        | ExprCommaListNode
        | WhereNode
        | HavingNode
        | SelectionColumnList
        | LimitStatementNode
        | OrderNode
        | OrderStatementNode
        | OperatorExprNode
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
        | ValueTypeDecimalNode

    interface ParsedResult {
        referencedTables: string[]
        createdTables: Undefineable<string[]>
        sourceTables: string[]
        aliases: { [t: string]: string }
        operation: ParsedResult['parsed']['type']
        /**
         * @description parsed syntax tree, you can find all source raw of other information in `ParsedResult`
         */
        parsed: ActionNode__CreateView | StatementNode__Select
        joins: {
          side?: TableRefNode['side']
          specific_outer: TableRefNode['specific_outer']
          inner: TableRefNode['inner']
          // simple_eq_columns: ColumnRefNode[]
          conditions: OperatorExprNode[]
          ref_right: TableRefNode['ref_right']
        }[]
        returnColumns: {
            name: string
            expression: ColumnExprNode['expression']
            alias?: string
            alias_expression?: ColumnExprNode['alias']
            sourceColumns: ColumnRefNode[]
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
  const Singleton: FxHQL.Parser
  export = Singleton
}

declare module "@fxjs/orm-hql/lib/sql-parser" {
  const compiled: {
    lexer: nearley.Lexer | undefined
    ParserRules: nearley.CompiledRules
    ParserStart: nearley.ParserOptions
  }
  export = compiled
}
