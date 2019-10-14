declare namespace FxHQLParser {
    interface ParsedNodeBase {
        type: 'create_view'
        | 'select'
        | 'binary_statement'
        | 'union'
        | 'from'
        | 'from_table'
        | 'all'
        | 'distinct'
        | 'group_by'
        | 'select_all'
        | 'column'
        | 'expr_comma_list'
        | 'table_ref'
        | 'table'
        | 'where'
        | 'having'
        | 'selection_columns'
        | 'order'
        | 'order_statement'
        | 'operator'
        | 'is_null'
        | 'in'
        | 'between'
        | 'like'
        | 'exists'
        | 'null'
        | 'true'
        | 'false'
        | 'if'
        | 'case'
        | 'when'
        | 'convert'
        | 'interval'
        | 'cast'
        | 'data_type'
        | 'date_unit'
        | 'function_call'
        | 'string'
        | 'identifier'
        | 'decimal'
    }

    type IParsedNode<EXT extends Fibjs.AnyObject> = EXT & ParsedNodeBase

    type SelectionNode = IParsedNode<{
        type: "selection_columns"
        columns: ColumnNode[]
    }>

    type StatementNode__Select = IParsedNode<{
        type: "select",
        all: boolean
        top: boolean,
        all_distinct: boolean,
        selection: SelectionNode,
        table_exp: {
            "type": "from_table",
            "from": {
                "type": "from",
                "table_refs": [
                    {
                    "type": "table",
                    "table": "b"
                    }
                ]
            },
            "where": undefined,
            "groupby": undefined,
            "having": undefined,
            "order": undefined,
            "limit": undefined
        }
    }>

    type Statement_Binary = IParsedNode<{
        type: "binary_statement"
        expr: any
    }>

    type UnionNode = IParsedNode<{
        type: "union"
        op_left: ColumnNode
        op_right: ColumnNode
    }>

    type FromNode = IParsedNode<{
        type: "from"
        table_refs: TableRefNode[]
        subquery: string
    }>

    type FromTableNode = IParsedNode<{
        type: "from_table"
        from?: string
        where?: string
        groupby?: string
        having?: string
        order?: string
    }>

    type AllNode = IParsedNode<{
        type: "all"
    }>

    type DistinctNode = IParsedNode<{
        type: "distinct"
    }>

    type GroupByNode = IParsedNode<{
        type: "group_by"
        columns: ColumnNode
        with_rollup?: boolean
    }>

    type SelectAllNode = IParsedNode<{
        type: "select_all"
    }>

    type ColumnNode = IParsedNode<{
        type: "column",
        expression: {
            type: "column" | "identifier",
            table: string,
            name: string
            value?: string
        }
        name?: string
        table?: string
        alias?: {
            value: string
        }
    }>

    type ExprCommaListNode = IParsedNode<{
        type: "expr_comma_list"
        exprs: string[]
    }>

    interface JoinInfoItem {
        side: 'left' | 'right' | undefined
        outer: boolean
        columns: ColumnNode[]
        op_left: ColumnNode
        op_right: ColumnNode
    }

    type TableNode = IParsedNode<{
        type: "table"
        table: string
        alias?: string
    }>

    type TableRefNode = IParsedNode<{
        type: "table_ref"
        side: JoinInfoItem['side']
        outer: JoinInfoItem['outer']
        op_left: JoinInfoItem['op_left']
        op_right: JoinInfoItem['op_right']
        alias?: string
        using?: string
        on?: (TableRefNode | ColumnNode)[]
    }>

    type WhereNode = IParsedNode<{
        type: "where"
        condition: string
    }>

    type HavingNode = IParsedNode<{
        type: "having"
        condition: string
    }>

    type SelectionColumnNode = IParsedNode<{
        type: "selection_columns"
        columns: string[]
    }>

    type OrderNode = IParsedNode<{
        type: "order",
        order: OrderStatementNode[]
    }>

    type OrderStatementNode = IParsedNode<{
        type: "order_statement"
        value: string
        direction: 'asc' | 'desc'
    }>

    type OperatorNode = IParsedNode<{
        type: "operator"
        operator: "not" | string
        operand: string
        op_left: ColumnNode
        op_right: ColumnNode
    }>

    type IsNullNode = IParsedNode<{
        type: "is_null"
        value: string
        not?: boolean
    }>

    type InNode = IParsedNode<{
        type: "in"
        value: string
        not?: boolean
        subquery?: string
        expressions?: string[]
    }>

    type OpNode__Between = IParsedNode<{
        type: "between"
        value: string
        lower: string
        upper: string
        not: boolean
    }>

    type OpNode_Like = IParsedNode<{
        type: "like"
        value: string
        comparison: string
        not: boolean
    }>

    type ExistsNode = IParsedNode<{
        type: "exists"
        /**
         * @check if is string when parse but is object when to object
         */
        query: string
    }>

    type ValueNode_Null = IParsedNode<{
        type: "null"
    }>
    type ValueNode_True = IParsedNode<{
        type: "true"
    }>
    type ValueNode_False = IParsedNode<{
        type: "false"
    }>

    type Statement_If = IParsedNode<{
        type: "if"
        condition: string
        then: string
        else: string
    }>

    type Statement_When = {
        type: "when"
        condition: string
        then: string
    }

    type Statement_Case = IParsedNode<{
        type: "case"
        op_left: string
        op_right: string
        when_statements: Statement_When[]
        else: string
    }>

    type ConvertNode = IParsedNode<{
        type: "convert"
        value: string
        using: string
    }>

    type IntervalNode = IParsedNode<{
        type: "interval"
        value: string
        unit: string
    }>
    type CastNode = IParsedNode<{
        type: "cast"
        value: string
        data_type: string
    }>
    // ?
    type DataTypeNode = IParsedNode<{
        type: "data_type"
        data_type: string
        size: string
        size1: string
        size2: string
    }>
    type DateUintNode = IParsedNode<{
        type: "date_unit"
        date_unit: string
    }>
    type FunctionCallNode = IParsedNode<{
        type: "function_call"
        name: { value: string }
        select_all: boolean
        parameters: string[]
        distinct: boolean
        all: boolean
    }>
    type ValueTypeStringNode = IParsedNode<{
        type: "string"
        string: string
    }>
    type IdentifierNode = IParsedNode<{
        type: "identifier"
        value: string
    }>
    type ValueTypeDecimal = IParsedNode<{
        type: "decimal"
        value: string
    }>

    type ActionNode__CreateView = IParsedNode<{
        type: "create_view"
        table: {
            table: string
        }
        definition: string
        replace: boolean
    }>
}
