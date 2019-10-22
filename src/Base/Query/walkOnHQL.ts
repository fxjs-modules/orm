import { gnrWalkWhere, gnrWalkJoinOn, parseOperatorFunctionAsValue, mapComparisonOperatorToSymbol, normalizeWhereInput, normalizeInInput, mapConjunctionOpSymbolToText } from "./onWalkConditions";
import { isOperatorFunction } from "./Operator";
import { preDestruct, arraify } from "../../Utils/array";
import { mapObjectToTupleList } from "../../Utils/object";

function findFirstOpRightColumnNodeInConditionResult(
    cond_result: ReturnType<typeof dfltWalkWhere>
): FxHQLParser.ColumnRefNode {
    let result: ReturnType<typeof findFirstOpRightColumnNodeInConditionResult>
    if (cond_result.type !== 'operator') return

    switch (cond_result.operator) {
        case 'and':
        case 'or':
        case 'xor':
            return (
                findFirstOpRightColumnNodeInConditionResult(<any>cond_result.op_right)
                || findFirstOpRightColumnNodeInConditionResult(<any>cond_result.op_left)
            )
        case '=':
        case '<>':
        case '>':
        case '>=':
        case '<':
        case '<=':
            switch (cond_result.op_right.type) {
                case 'column':
                    return cond_result.op_right
                case 'column_expr':
                    return findFirstOpRightColumnNodeInConditionResult(<any>cond_result.op_right.expression)
            }
    }

    return result
}

function mapVTypeToHQLNodeType(value: any): FxHQLParser.ValueTypeRawNode['type'] | 'identifier' | 'column' {
    switch (typeof value) {
        default:
            if (isOperatorFunction(value) && value.$op_name === 'colref') return 'identifier'
            else if (isOperatorFunction(value) && value.$op_name === 'refTableCol') return 'column'
        case 'string':
            return 'string'
        case 'number':
            return 'decimal'
    }
}

function getComparisionNodeByValueNodeType(
    vtype: FxOrmTypeHelpers.ReturnType<typeof mapVTypeToHQLNodeType>,
    value: any
) {
    switch (vtype) {
        case 'identifier': return { type: 'identifier' as 'identifier', value: value }
        case 'decimal': return { type: 'decimal' as 'decimal', value: value }
        case 'string': return { type: 'string' as 'string', string: value }
        case 'column': return { type: 'column' as 'column', table: value.table, name: value.column }
    }
}


/**
 * default use preorder-strategy to build where condition
 */
export const dfltWalkWhere = gnrWalkWhere({
    onNode: (nodeInfo) => {
        const { scene, walk_fn, input, walk_fn_context, nodeFrame } = nodeInfo;

        switch (scene) {
            case 'inputIs:opfn:bracketRound':
                return {
                    isReturn: true,
                    result: {
                        type: 'expr_comma_list',
                        exprs: [walk_fn(input().value, walk_fn_context)]
                    }
                }
            case 'walkWhere:opfn:bracketRound':
                return {
                    isReturn: false,
                    result: {
                        type: 'expr_comma_list',
                        exprs: [walk_fn(nodeFrame.cmpr_opfn_result, walk_fn_context)]
                    }
                }
            case 'walkWhere:opfn:refTableCol':
                return {
                    isReturn: false,
                    result: {
                        type: 'column',
                        table: nodeFrame.ref_opfn_result.value.table,
                        column: nodeFrame.ref_opfn_result.value.column,
                    }
                }
            case 'walkWhere:opfn:colref':
                return {
                    isReturn: false,
                    result: {
                        type: 'identifier',
                        value: nodeFrame.cmpr_opfn_result.value
                    }
                }
            case 'walkWhere:opfn:comparator':
            case 'walkWhere:opfn:like':
            case 'walkWhere:opfn:between':
            case 'walkWhere:opfn:in': {
                let value = nodeFrame.cmpr_opfn_result.value

                const { source_collection } = walk_fn_context;
                const varNode = !!source_collection ? {
                    type: 'column',
                    table: source_collection,
                    name: nodeFrame.field_name,
                } : {
                        type: 'identifier',
                        value: nodeFrame.field_name
                    }

                switch (scene) {
                    case 'walkWhere:opfn:comparator': {
                        const vtype = mapVTypeToHQLNodeType(value)
                        if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)

                        return {
                            isReturn: false,
                            result: {
                                type: 'operator',
                                operator: mapComparisonOperatorToSymbol(nodeFrame.cmpr_opfn_result.op_name),
                                op_left: varNode,
                                op_right: getComparisionNodeByValueNodeType(vtype, value)
                            }
                        }
                    }
                    case 'walkWhere:opfn:like': {
                        const vtype = mapVTypeToHQLNodeType(value)
                        if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
                        /**
                         * @shouldit alert when value has no any '%' char ?
                         */

                        return {
                            isReturn: false,
                            result: {
                                type: "like",
                                not: nodeFrame.not,
                                value: varNode,
                                comparison: getComparisionNodeByValueNodeType(vtype, value)
                            }
                        }
                    }
                    case 'walkWhere:opfn:between': {
                        if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
                        else value = normalizeWhereInput(value)

                        return {
                            isReturn: false,
                            result: {
                                type: "between",
                                value: varNode,
                                not: nodeFrame.not,
                                lower: getComparisionNodeByValueNodeType(mapVTypeToHQLNodeType(value.lower), value.lower),
                                upper: getComparisionNodeByValueNodeType(mapVTypeToHQLNodeType(value.higher), value.higher),
                            }
                        }
                    }
                    case 'walkWhere:opfn:in': {
                        if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
                        else value = normalizeInInput(value)

                        return {
                            isReturn: false,
                            result: {
                                type: 'in',
                                value: varNode,
                                not: nodeFrame.not,
                                expressions: value.map((x: any) =>
                                    getComparisionNodeByValueNodeType(mapVTypeToHQLNodeType(x), x)
                                )
                            }
                        }
                    }
                }
            }
            case 'walkJoinOn:opsymbol:bracketRound': {
                return {
                    isReturn: false,
                    result: {
                        type: 'expr_comma_list',
                        exprs: [walk_fn((<any>input)[nodeFrame.symbol], walk_fn_context)]
                    }
                }
            }
            case 'walkJoinOn:opsymbol:conjunction': {
                const [pres, last] = preDestruct(mapObjectToTupleList((<any>input)[nodeFrame.symbol]))
                const op_name = mapConjunctionOpSymbolToText(nodeFrame.symbol)

                return {
                    isReturn: false,
                    result: {
                        type: 'operator',
                        operator: op_name,
                        op_left: walk_fn(pres, { ...walk_fn_context, parent_conjunction_op: op_name }),
                        op_right: walk_fn(last, { ...walk_fn_context, parent_conjunction_op: op_name }),
                    }
                }
            }
            case 'inputAs:conjunctionAsAnd':
                const {
                    // when input is array with length >= 2, 'and' is valid
                    parent_conjunction_op = 'and'
                } = walk_fn_context || {}

                const [pres, last] = preDestruct(input)
                return {
                    isReturn: true,
                    result: {
                        type: 'operator',
                        operator: parent_conjunction_op,
                        op_left: walk_fn(pres, walk_fn_context),
                        op_right: walk_fn(last, walk_fn_context)
                    }
                }
            default:
                return { isReturn: false, result: null }
        }
    }
});

export const dfltWalkOn = gnrWalkJoinOn({
    onJoinNode: ({ scene, walk_fn, input, walk_fn_context, nodeFrame }) => {
        switch (scene) {
            case 'inputIs:opfn:joinVerb': {
                const condInput = input().value
                const conditions = walk_fn.walkerWhereConditions(condInput.on, { source_collection: walk_fn_context.source_collection });
                if (!conditions || conditions.type !== 'operator')
                    throw new Error(`[dfltWalkOn::onNode] conditions result of join verb must be (type: 'operator'`)

                let targetCollection = condInput.collection
                if (!targetCollection) {
                    const refNode = findFirstOpRightColumnNodeInConditionResult(conditions)
                    if (refNode) targetCollection = refNode.table
                }

                const jonNode = {
                    side: nodeFrame.side || undefined,
                    specific_outer: nodeFrame.specific_outer === true,
                    inner: !nodeFrame.specific_outer && nodeFrame.inner === true,
                    conditions: arraify(conditions),
                    ref_right: {
                        type: 'table',
                        table: targetCollection
                    }
                }
                return {
                    isReturn: true,
                    result: nodeFrame.use_list ? arraify(jonNode) : jonNode
                }
            }
            case 'inputIs:joinList':
                return {
                    isReturn: true,
                    result: input.map((x: any) => walk_fn(x, walk_fn_context))
                }
        }
    },
    walkerWhereConditions: dfltWalkWhere,
})