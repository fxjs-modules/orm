var parsedNode: FxHQLParser.ParsedResult = {
    referencedTables: [],
    createdTables: undefined,
    sourceTables: [],
    aliases: {},
    operation: 'select',
    parsed: {
        type: 'select',
        all: undefined,
        top: undefined,
        all_distinct: undefined,
        selection: {
            type: 'selection_columns',
            columns: [
                {
                    "type": "column",
                    "expression": {
                        "type": "identifier",
                        "value": "a"
                    }
                },
                {
                    "type": "column",
                    "expression": {
                        "type": "column",
                        "table": "a",
                        "name": "x"
                    }
                }
            ]
        },
        table_exp: {
            type: "from_table",
            from: {
                type: "from",
                table_refs: [],
            },
            where: undefined,
            groupby: undefined,
            having: undefined,
            order: undefined,
            limit: undefined,
        }
    },
    joins: [],
    returnColumns: []
}

if (parsedNode.parsed.type === 'select') {
    parsedNode.parsed.table_exp.where = {
        "type": "where",
        "condition": {
            "type": "operator",
            "operator": "and",
            "op_left": {
                "type": "operator",
                "operator": "and",
                "op_left": {
                    "type": "expr_comma_list",
                    "exprs": [
                        {
                            "type": "operator",
                            "operator": "or",
                            "op_left": {
                                "type": "identifier",
                                "value": "c"
                            },
                            "op_right": {
                                "type": "operator",
                                "operator": "not",
                                "operand": {
                                    "type": "identifier",
                                    "value": "d"
                                }
                            }
                        }
                    ]
                },
                "op_right": {
                    "type": "is_null",
                    "not": [
                        null,
                        [
                            "n",
                            "o",
                            "t"
                        ]
                    ],
                    "value": {
                        "type": "identifier",
                        "value": "e"
                    }
                }
            },
            "op_right": {
                "type": "identifier",
                "value": "f"
            }
        }
    }
}
