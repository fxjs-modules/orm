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
          type: "selection_columns" | "select_all"
          columns?: ColumnExprNode[]
        }>
        table_exp: FromTableExpNode
    }>

    type SelectionNode = StatementNode__Select['selection']

    type Statement_Binary = IParsedNode<{
        type: "binary_statement"
        expr: string
    }>

    type UnionNode = IParsedNode<{
        type: "union"
        op_left: ColumnExprNode
        op_right: ColumnExprNode
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
        columns: SelectionColumnList
        with_rollup?: boolean
    }>

    /**
     * @description means 'select all fields' from table
     * if `table` specified, maybe there are multiple tables
     */
    type SelectAllNode = IParsedNode<{
        type: "select_all"
        table?: IdentifierNode
    }>

    type ColumnRefNode = IParsedNode<{
      type: "column"
      table: string
      name: string
    }>

    /**
     * @description column ref information
     */
    type ColumnExprNode = IParsedNode<{
        type: "column_expr"
        expression: ColumnRefNode | IdentifierNode | OperatorExprNode | {
          type: SelectAllNode['type']
          table: SelectAllNode['table']
        }
        alias?: IdentifierNode
    }>

    type ExprCommaListNode = IParsedNode<{
        type: "expr_comma_list"
        exprs: OperatorExprNode[]
    }>

    type TableNode = IParsedNode<{
        type: "table"
        table: string
        alias?: string
    }>

    type TableRefNode = IParsedNode<{
        type: "table_ref"
        side: 'left' | 'right' | 'full' | undefined
        specific_outer: boolean
        inner: boolean
        /**
         * @description syntax ref left for on JOIN...ON statement, in most case, ref_left is useless
         * because you can determine what you wanna request by 'side', 'inner' and 'ref_right', it's
         * just field left in parsed tree-node, and ref_left wouldn't passed to item of ParsedResult['joins']
         */
        ref_left: OperatorExprNode
        ref_right: OperatorExprNode
        alias?: string
        using?: string
        on: IdentifierNode[] | OperatorExprNode | ColumnExprNode | ExprCommaListNode
    }>

    type ExprOperatorComparisonNode = IParsedNode<{
        type: "operator"
        operator: "="
          | "<=>"
          | "<>"
          | "<"
          | "<="
          | ">"
          | ">="
          | "!="
        op_left: ValueTypeRawNode | IdentifierNode | ColumnExprNode
        op_right: ValueTypeRawNode | IdentifierNode | ColumnExprNode
    }>

    type ExprOperatorNotNode = IParsedNode<{
        type: "operator"
        operator: "not"
        operand: IdentifierNode
    }>

    type ExprOperatorIsNullNode = IParsedNode<{
        type: "is_null"
        not: boolean
        value: IdentifierNode
    }>

    type ExprOperatorConjNode = IParsedNode<{
        type: "operator"
        operator: "and" | "xor" | "or"
        operand?: IdentifierNode
        op_left: ExprCommaListNode | OperatorExprNode | IdentifierNode | ValueTypeRawNode | ColumnExprNode
        op_right: ExprCommaListNode | OperatorExprNode | IdentifierNode | ValueTypeRawNode | ColumnExprNode
    }>

    type OperatorExprNode = IParsedNode<ExprOperatorConjNode | ExprOperatorComparisonNode | ExprOperatorNotNode | ExprOperatorIsNullNode>

    type WhereNode = IParsedNode<{
        type: "where"
        condition: OperatorExprNode
    }>

    type HavingNode = IParsedNode<{
        type: "having"
        condition: OperatorExprNode
    }>

    type SelectionColumnList = IParsedNode<{
        type: "selection_columns"
        columns: ColumnExprNode[]
    }>

    type OrderNode = IParsedNode<{
        type: "order"
        order: OrderStatementNode[]
    }>

    type LimitStatementNode = IParsedNode<{
        type: "limit_statement"
        limit: number
        offset: number
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
        condition: OperatorExprNode
        then: ValueTypeRawNode
        else: ValueTypeRawNode
    }>

    type Statement_When = {
        type: "when"
        condition: OperatorExprNode
        then: ValueTypeRawNode
        else: ValueTypeRawNode
    }

    type Statement_Case = IParsedNode<{
        type: "case"
        op_right: IdentifierNode
        when_statements: Statement_When[]
        else: ValueTypeRawNode
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
    /**
     * @description one single-quoted/double-quoted string
     * @node
     * @sample
     *  - "abc"
     *  - 'foo'
     */
    type ValueTypeStringNode = IParsedNode<{
        type: "string"
        string: string
    }>
    /**
     * @description one integer, float type value
     * @node
     * @sample
     *  - 1
     *  - -1
     *  - 1.11
     *  - 3.1415926
     */
    type ValueTypeDecimalNode = IParsedNode<{
        type: "decimal"
        value: string
    }>

    type ValueTypeRawNode = ValueTypeStringNode | ValueTypeDecimalNode
    /**
     * @description one raw string, one back-quoted string, or two back-quoted string concated by '.'
     * @node
     * @sample
     *  - db_val
     *  - table_val
     *  - colum_val
     *  - val
     *  - `db`.`table`
     *  - `table`.`column`
     */
    type IdentifierNode = IParsedNode<{
        type: "identifier"
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
