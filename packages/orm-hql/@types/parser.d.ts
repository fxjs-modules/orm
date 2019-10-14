declare namespace FxHQLParser {
    type Undefineable<T> = T | undefined
    interface ParsedNodeBase {}

    type IParsedNode<EXT extends Fibjs.AnyObject> = EXT & ParsedNodeBase

    type StatementNode__Select = IParsedNode<{
        type: "select"
        all: Undefineable<boolean>
        top: Undefineable<boolean>
        all_distinct: Undefineable<boolean>
        selection: IParsedNode<{
            type: "selection_columns"
            columns: ColumnNode[]
        }>
        table_exp: FromTableExpNode
    }>

    type SelectionNode = StatementNode__Select['selection']

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

    type FromTableExpNode = IParsedNode<{
        type: "from_table"
        from: {
            type: "from"
            table_refs: TableRefNode[]
        }
        where: Undefineable<WhereNode>
        groupby: Undefineable<GroupByNode>
        having: Undefineable<HavingNode>
        order: Undefineable<OrderNode>
        limit: Undefineable<LimitStatementNode>
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
        type: "column"
        expression: {
            type: "column"
            table: string
            name: string
            value?: string
        } | {
            type: "identifier"
            value: "a"
        }
        name?: string
        table?: string
        alias?: {
            value: string
        }
    }>

    type ExprCommaListNode = IParsedNode<{
        type: "expr_comma_list"
        exprs: ConditionExprNode[]
    }>

    interface JoinInfoItem {
        side: 'left' | 'right' | undefined
        specific_outer: boolean
        inner: boolean
        columns: ColumnNode[]
        op_left: ConditionExprNode
        op_right: ConditionExprNode
    }

    type TableNode = IParsedNode<{
        type: "table"
        table: string
        alias?: string
    }>

    type TableRefNode = IParsedNode<{
        type: "table_ref"
        side: JoinInfoItem['side']
        inner: JoinInfoItem['inner']
        specific_outer: JoinInfoItem['specific_outer']
        op_left: JoinInfoItem['op_left']
        op_right: JoinInfoItem['op_right']
        alias?: string
        using?: string
        on: IdentifierNode[] | ConditionExprNode | ExprCommaListNode
    }>

    type ConditionExprNode = IParsedNode<{
        type: "operator"
        operator: "and" | "xor" | "or"
        operand: Undefineable<IdentifierNode>
        op_left: ConditionExprNode | IdentifierNode | ColumnNode
        op_right: ConditionExprNode | IdentifierNode | ColumnNode
    } | {
        type: "operator"
        operator: "="
        op_left: ColumnNode
        op_right: ColumnNode
    } | {
        type: "operator"
        operator: "not"
        operand: IdentifierNode
    } | {
        type: "is_null"
        not: any
        value: IdentifierNode
    }>

    type WhereNode = IParsedNode<{
        type: "where"
        condition: ConditionExprNode
    }>

    type HavingNode = IParsedNode<{
        type: "having"
        condition: ConditionExprNode
    }>

    type SelectionColumnNode = IParsedNode<{
        type: "selection_columns"
        columns: string[]
    }>

    type OrderNode = IParsedNode<{
        type: "order"
        order: OrderStatementNode[]
    }>

    type LimitStatementNode = IParsedNode<{
        type: "limit_statement"
        limit: number
    }>

    type OrderStatementNode = IParsedNode<{
        type: "order_statement"
        value: string
        direction: 'asc' | 'desc'
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
        condition: ConditionExprNode
        then: string
        else: string
    }>

    type Statement_When = {
        type: "when"
        condition: ConditionExprNode
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
        all: Undefineable<boolean>
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
