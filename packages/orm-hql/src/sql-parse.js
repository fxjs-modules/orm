// Generated automatically by nearley, version 2.19.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

  function drill(o) {
    //if(o && o.length==1 && o[0]) return drill(o[0]);
    return o;
  }

  const reserved=require('./reserved.json');
  const valid_function_identifiers=['LEFT','RIGHT','REPLACE','MOD']


  function tableRef(d, onOffset, alias, using) {
		if(!onOffset) onOffset = 0;
    const inner = d[2] && d[2].indexOf('inner') === 1

    const ref = {
      type: 'table_ref',
      side: ((d[1]||[])[1]),
      op_left: d[0],
      op_right: d[5],
      on: d[onOffset+9],
      outer: !inner,
			using
    };
		if(alias) ref.alias = d[7];
		return ref;
  }


function opExpr(operator) {
  return d => ({
    type: 'operator',
    operator: operator,
    op_left: d[0],
    op_right: d[2]
  });
}

function opExprWs(operator) {
  return d => ({
    type: 'operator',
    operator: operator,
    op_left: d[0],
    op_right: d[4]
  });
}


function notOp(d) {
  return {
    type: 'operator',
    operator: 'not',
    operand: d[1]
  };
}


function dataType(data_type, size) {
  return {
    type: 'data_type',
    data_type: data_type,
    size: size && size[1]
  }
}
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "unsigned_int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_int$ebnf$1", "symbols": ["unsigned_int$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_int", "symbols": ["unsigned_int$ebnf$1"], "postprocess": 
        function(d) {
            return parseInt(d[0].join(""));
        }
        },
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "int$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "int$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess": 
        function(d) {
            if (d[0]) {
                return parseInt(d[0][0]+d[1].join(""));
            } else {
                return parseInt(d[1].join(""));
            }
        }
        },
    {"name": "unsigned_decimal$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$1", "symbols": ["unsigned_decimal$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "unsigned_decimal$ebnf$2", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "unsigned_decimal$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "unsigned_decimal", "symbols": ["unsigned_decimal$ebnf$1", "unsigned_decimal$ebnf$2"], "postprocess": 
        function(d) {
            return parseFloat(
                d[0].join("") +
                (d[1] ? "."+d[1][1].join("") : "")
            );
        }
        },
    {"name": "decimal$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "decimal$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$2", "symbols": ["decimal$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": ["decimal$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "decimal$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "decimal$ebnf$3", "symbols": ["decimal$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "decimal$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal", "symbols": ["decimal$ebnf$1", "decimal$ebnf$2", "decimal$ebnf$3"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "")
            );
        }
        },
    {"name": "percentage", "symbols": ["decimal", {"literal":"%"}], "postprocess": 
        function(d) {
            return d[0]/100;
        }
        },
    {"name": "jsonfloat$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "jsonfloat$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$2", "symbols": ["jsonfloat$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": ["jsonfloat$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "jsonfloat$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "jsonfloat$ebnf$3", "symbols": ["jsonfloat$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": ["jsonfloat$ebnf$4$subexpression$1$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$4$subexpression$1", "symbols": [/[eE]/, "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "jsonfloat$ebnf$4$subexpression$1$ebnf$2"]},
    {"name": "jsonfloat$ebnf$4", "symbols": ["jsonfloat$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat", "symbols": ["jsonfloat$ebnf$1", "jsonfloat$ebnf$2", "jsonfloat$ebnf$3", "jsonfloat$ebnf$4"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "") +
                (d[3] ? "e" + (d[3][1] || "+") + d[3][2].join("") : "")
            );
        }
        },
    {"name": "main$subexpression$1", "symbols": ["_", {"literal":";"}, "_"]},
    {"name": "main$subexpression$1", "symbols": ["_"]},
    {"name": "main", "symbols": ["sql", "main$subexpression$1"], "postprocess": id},
    {"name": "sql", "symbols": ["manipulative_statement"], "postprocess": id},
    {"name": "sql", "symbols": ["create_view"], "postprocess": id},
    {"name": "create_view$subexpression$1", "symbols": ["__", "OR", "__", "REPLACE", "__"]},
    {"name": "create_view$subexpression$1", "symbols": ["__"]},
    {"name": "create_view", "symbols": ["CREATE", "create_view$subexpression$1", "VIEW", "__", "table", "__", "AS", "__", "query_spec"], "postprocess": 
        d => ({
          type: 'create_view',
          table: d[4],
          definition: d[8],
          replace: !!d[1][1]
        })
            },
    {"name": "manipulative_statement", "symbols": ["select_statement"], "postprocess": id},
    {"name": "select_statement", "symbols": ["query_spec"], "postprocess": id},
    {"name": "top_spec", "symbols": ["TOP", "__", "int"], "postprocess": d => d[2]},
    {"name": "query_spec", "symbols": [{"literal":"("}, "_", "query_spec", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "query_spec$subexpression$1", "symbols": ["__", "top_spec"]},
    {"name": "query_spec$subexpression$1", "symbols": []},
    {"name": "query_spec$subexpression$2", "symbols": ["__", "all_distinct", "__"]},
    {"name": "query_spec$subexpression$2", "symbols": ["__"]},
    {"name": "query_spec", "symbols": ["SELECT", "query_spec$subexpression$1", "query_spec$subexpression$2", "selection"], "postprocess": 
        d => ({
          type: 'select',
          top: (d[1]||[])[1],
          all_distinct: (d[2]||[])[1],
          selection: d[3]
        })
            },
    {"name": "query_spec$subexpression$3", "symbols": ["__", "top_spec"]},
    {"name": "query_spec$subexpression$3", "symbols": []},
    {"name": "query_spec$subexpression$4", "symbols": ["__", "all_distinct", "__"]},
    {"name": "query_spec$subexpression$4", "symbols": ["__"]},
    {"name": "query_spec", "symbols": ["SELECT", "query_spec$subexpression$3", "query_spec$subexpression$4", "selection", "__", "table_exp"], "postprocess": 
        d => ({
          type: 'select',
          top: (d[1]||[])[1],
          all_distinct: (d[2]||[])[1],
          selection: d[3],
          table_exp: d[5]
        })
            },
    {"name": "query_spec", "symbols": ["query_spec", "__", "UNION", "__", "query_spec"], "postprocess": 
        d => ({
          type: 'union',
          op_left: d[0],
          op_right: d[4]
        })
            },
    {"name": "table_exp$subexpression$1", "symbols": ["__", "where_clause"]},
    {"name": "table_exp$subexpression$1", "symbols": []},
    {"name": "table_exp$subexpression$2", "symbols": ["__", "group_by_clause"]},
    {"name": "table_exp$subexpression$2", "symbols": []},
    {"name": "table_exp$subexpression$3", "symbols": ["__", "having_clause"]},
    {"name": "table_exp$subexpression$3", "symbols": []},
    {"name": "table_exp$subexpression$4", "symbols": ["__", "order_clause"]},
    {"name": "table_exp$subexpression$4", "symbols": []},
    {"name": "table_exp$subexpression$5", "symbols": ["__", "limit_clause"]},
    {"name": "table_exp$subexpression$5", "symbols": []},
    {"name": "table_exp", "symbols": ["from_clause", "table_exp$subexpression$1", "table_exp$subexpression$2", "table_exp$subexpression$3", "table_exp$subexpression$4", "table_exp$subexpression$5"], "postprocess": 
              d => ({
                type: 'from_table',
                from: d[0],
                where: (d[1] || [])[1],
                groupby: (d[2] || [])[1],
                having: (d[3] || [])[1],
                order: (d[4] || [])[1],
        limit: (d[5] || [])[1]
              })
            },
    {"name": "all_distinct", "symbols": ["ALL"], "postprocess": d => ({type: 'all'})},
    {"name": "all_distinct", "symbols": ["DISTINCT"], "postprocess": d => ({type: 'distinct'})},
    {"name": "from_clause", "symbols": ["FROM", "__", "table_ref_commalist"], "postprocess": d => ({type: 'from', table_refs: d[2].table_refs})},
    {"name": "from_clause", "symbols": ["FROM", "__", "subquery"], "postprocess": d => ({type: 'from', subquery: d[2]})},
    {"name": "group_by_clause", "symbols": ["group_by_clause_inner"], "postprocess": id},
    {"name": "group_by_clause", "symbols": ["group_by_clause_inner", "__", "WITH", "__", "ROLLUP"], "postprocess": d => Object.assign({}, d[0], {with_rollup:true})},
    {"name": "group_by_clause_inner", "symbols": ["GROUP", "__", "BY", "__", "selection_column_comma_list"], "postprocess": d => ({ type: 'group_by', columns: d[4] })},
    {"name": "group_by_clause_inner", "symbols": ["GROUP", "__", "BY", {"literal":"("}, "_", "selection_column_comma_list", "_", {"literal":")"}], "postprocess": d => ({ type: 'group_by', columns: d[6] })},
    {"name": "selection", "symbols": [{"literal":"*"}], "postprocess": d => ({type:'select_all'})},
    {"name": "selection", "symbols": ["selection_column_comma_list"], "postprocess": id},
    {"name": "selection_column_comma_list", "symbols": ["selection_column"], "postprocess": d => ({type: 'selection_columns', columns: [d[0]]})},
    {"name": "selection_column_comma_list", "symbols": ["selection_column_comma_list", "_", {"literal":","}, "_", "selection_column"], "postprocess": 
        d => ({
          type: 'selection_columns',
          columns: (d[0].columns||[]).concat([d[4]])
        })
            },
    {"name": "selection_column", "symbols": ["expr"], "postprocess": d => ({type: 'column', expression: drill(d[0])})},
    {"name": "selection_column", "symbols": ["expr", "__", "AS", "__", "identifier"], "postprocess": d => ({type: 'column', expression: drill(d[0]), alias: d[4]})},
    {"name": "table_ref_commalist", "symbols": ["table_ref"], "postprocess": d => ({table_refs: [d[0]]})},
    {"name": "table_ref_commalist", "symbols": ["table_ref_commalist", "_", {"literal":","}, "_", "table_ref"], "postprocess": d => ({ table_refs: (d[0].table_refs||[]).concat(d[4]) })},
    {"name": "table_ref", "symbols": [{"literal":"("}, "_", "table_ref", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "table_ref", "symbols": ["table"], "postprocess": id},
    {"name": "table_ref$subexpression$1", "symbols": ["__", "LEFT", "__"]},
    {"name": "table_ref$subexpression$1", "symbols": ["__", "RIGHT", "__"]},
    {"name": "table_ref$subexpression$1", "symbols": ["_"]},
    {"name": "table_ref$subexpression$2", "symbols": ["__", "OUTER", "__"]},
    {"name": "table_ref$subexpression$2", "symbols": ["__", "INNER", "__"]},
    {"name": "table_ref$subexpression$2", "symbols": ["_"]},
    {"name": "table_ref", "symbols": ["table_ref", "table_ref$subexpression$1", "table_ref$subexpression$2", "JOIN", "__", "table", "__", "ON", "__", "expr"], "postprocess": x=>tableRef(x,0)},
    {"name": "table_ref$subexpression$3", "symbols": ["__", "LEFT", "__"]},
    {"name": "table_ref$subexpression$3", "symbols": ["__", "RIGHT", "__"]},
    {"name": "table_ref$subexpression$3", "symbols": ["_"]},
    {"name": "table_ref$subexpression$4", "symbols": ["__", "OUTER", "__"]},
    {"name": "table_ref$subexpression$4", "symbols": ["__", "INNER", "__"]},
    {"name": "table_ref$subexpression$4", "symbols": ["_"]},
    {"name": "table_ref$subexpression$5", "symbols": [{"literal":"("}, "_", "expr", "_", {"literal":")"}]},
    {"name": "table_ref", "symbols": ["table_ref", "table_ref$subexpression$3", "table_ref$subexpression$4", "JOIN", "__", "table", "__", "ON", "table_ref$subexpression$5"], "postprocess": x=>tableRef(x,0)},
    {"name": "table_ref$subexpression$6", "symbols": ["__", "LEFT", "__"]},
    {"name": "table_ref$subexpression$6", "symbols": ["__", "RIGHT", "__"]},
    {"name": "table_ref$subexpression$6", "symbols": ["_"]},
    {"name": "table_ref$subexpression$7", "symbols": ["__", "OUTER", "__"]},
    {"name": "table_ref$subexpression$7", "symbols": ["__", "INNER", "__"]},
    {"name": "table_ref$subexpression$7", "symbols": ["_"]},
    {"name": "table_ref$subexpression$8", "symbols": ["AS", "__"]},
    {"name": "table_ref$subexpression$8", "symbols": ["__"]},
    {"name": "table_ref", "symbols": ["table_ref", "table_ref$subexpression$6", "table_ref$subexpression$7", "JOIN", "__", "query_spec", "table_ref$subexpression$8", "identifier", "__", "ON", "__", "expr"], "postprocess": x=>tableRef(x,2,true)},
    {"name": "table_ref$subexpression$9", "symbols": ["__", "LEFT", "__"]},
    {"name": "table_ref$subexpression$9", "symbols": ["__", "RIGHT", "__"]},
    {"name": "table_ref$subexpression$9", "symbols": ["_"]},
    {"name": "table_ref$subexpression$10", "symbols": ["__", "OUTER", "__"]},
    {"name": "table_ref$subexpression$10", "symbols": ["__", "INNER", "__"]},
    {"name": "table_ref$subexpression$10", "symbols": ["_"]},
    {"name": "table_ref$subexpression$11", "symbols": ["AS", "__"]},
    {"name": "table_ref$subexpression$11", "symbols": ["__"]},
    {"name": "table_ref$subexpression$12", "symbols": [{"literal":"("}, "_", "expr", "_", {"literal":")"}]},
    {"name": "table_ref", "symbols": ["table_ref", "table_ref$subexpression$9", "table_ref$subexpression$10", "JOIN", "__", "query_spec", "table_ref$subexpression$11", "identifier", "__", "ON", "table_ref$subexpression$12"], "postprocess": x=>tableRef(x,2,true)},
    {"name": "table_ref$subexpression$13", "symbols": ["__", "LEFT", "__"]},
    {"name": "table_ref$subexpression$13", "symbols": ["__", "RIGHT", "__"]},
    {"name": "table_ref$subexpression$13", "symbols": ["_"]},
    {"name": "table_ref$subexpression$14", "symbols": ["__", "OUTER", "__"]},
    {"name": "table_ref$subexpression$14", "symbols": ["__", "INNER", "__"]},
    {"name": "table_ref$subexpression$14", "symbols": ["_"]},
    {"name": "table_ref", "symbols": ["table_ref", "table_ref$subexpression$13", "table_ref$subexpression$14", "JOIN", "__", "table", "__", "USING", "_", {"literal":"("}, "_", "identifier_comma_list", "_", {"literal":")"}], "postprocess": x=>tableRef(x,2, false,true)},
    {"name": "table_ref$subexpression$15", "symbols": ["__", "LEFT", "__"]},
    {"name": "table_ref$subexpression$15", "symbols": ["__", "RIGHT", "__"]},
    {"name": "table_ref$subexpression$15", "symbols": ["_"]},
    {"name": "table_ref$subexpression$16", "symbols": ["__", "OUTER", "__"]},
    {"name": "table_ref$subexpression$16", "symbols": ["__", "INNER", "__"]},
    {"name": "table_ref$subexpression$16", "symbols": ["_"]},
    {"name": "table_ref$subexpression$17", "symbols": ["AS", "__"]},
    {"name": "table_ref$subexpression$17", "symbols": ["__"]},
    {"name": "table_ref", "symbols": ["table_ref", "table_ref$subexpression$15", "table_ref$subexpression$16", "JOIN", "__", "query_spec", "table_ref$subexpression$17", "identifier", "__", "USING", "_", {"literal":"("}, "_", "identifier_comma_list", "_", {"literal":")"}], "postprocess": x=>tableRef(x,4, true,true)},
    {"name": "identifier_comma_list", "symbols": ["identifier"], "postprocess": d => [d[0]]},
    {"name": "identifier_comma_list", "symbols": ["identifier_comma_list", "_", {"literal":","}, "_", "identifier"], "postprocess": d => d[0].concat(d[2])},
    {"name": "table", "symbols": ["identifier"], "postprocess": d => ({type: 'table', table: d[0].value})},
    {"name": "table", "symbols": ["identifier", {"literal":"."}, "identifier"], "postprocess": d => ({type: 'table', table: d[0].value +'.'+ d[2].value })},
    {"name": "table$subexpression$1", "symbols": ["__", "AS", "__"]},
    {"name": "table$subexpression$1", "symbols": ["__"]},
    {"name": "table", "symbols": ["identifier", "table$subexpression$1", "identifier"], "postprocess": d => ({type: 'table', table: d[0].value, alias: d[2].value})},
    {"name": "where_clause", "symbols": ["WHERE", "__", "expr"], "postprocess": d => ({type:'where', condition: d[2]})},
    {"name": "where_clause", "symbols": ["WHERE", {"literal":"("}, "_", "expr", "_", {"literal":")"}], "postprocess": d => ({type:'where', condition: d[3]})},
    {"name": "having_clause", "symbols": ["HAVING", "__", "expr"], "postprocess": d => ({type: 'having', condition: d[2]})},
    {"name": "having_clause", "symbols": ["HAVING", {"literal":"("}, "_", "expr", "_", {"literal":")"}], "postprocess": d => ({type: 'having', condition: d[3]})},
    {"name": "order_clause", "symbols": ["ORDER", "__", "BY", "__", "order_statement_comma_list"], "postprocess": d => ({type: 'order', order: d[4].order})},
    {"name": "order_clause", "symbols": ["ORDER", "__", "BY", {"literal":"("}, "_", "order_statement_comma_list", "_", {"literal":")"}], "postprocess": d => ({type: 'order', order: d[5].order})},
    {"name": "order_statement_comma_list", "symbols": ["order_statement"], "postprocess": d => ({order: [d[0]]})},
    {"name": "order_statement_comma_list", "symbols": ["order_statement_comma_list", "_", {"literal":","}, "_", "order_statement"], "postprocess": 
        d => ({order: (d[0].order||[]).concat(d[4])})
            },
    {"name": "order_statement", "symbols": ["expr"], "postprocess": d => ({type:'order_statement', value:d[0]})},
    {"name": "order_statement", "symbols": ["expr", "__", "ASC"], "postprocess": d => ({type: 'order_statement', value: d[0], direction: 'asc'})},
    {"name": "order_statement", "symbols": ["expr", "__", "DESC"], "postprocess": d => ({type: 'order_statement', value: d[0], direction: 'desc'})},
    {"name": "limit_clause", "symbols": ["LIMIT", "__", "decimal"], "postprocess": d => ({type: 'limit_statement', limit: d[2]})},
    {"name": "column_ref", "symbols": ["expr"], "postprocess": d => ({type: 'column', expression: d[0]})},
    {"name": "column_ref", "symbols": ["expr", "__", "AS", "__", "identifier"], "postprocess": d => ({type: 'column', expression: d[0], alias: d[4].value})},
    {"name": "expr", "symbols": ["two_op_expr"], "postprocess": id},
    {"name": "two_op_expr", "symbols": ["pre_two_op_expr", "OR", "post_one_op_expr"], "postprocess": opExpr('or')},
    {"name": "two_op_expr$string$1", "symbols": [{"literal":"|"}, {"literal":"|"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "two_op_expr", "symbols": ["pre_two_op_expr", "two_op_expr$string$1", "post_one_op_expr"], "postprocess": opExpr('or')},
    {"name": "two_op_expr", "symbols": ["pre_two_op_expr", "XOR", "post_one_op_expr"], "postprocess": opExpr('xor')},
    {"name": "two_op_expr", "symbols": ["pre_two_op_expr", "AND", "post_one_op_expr"], "postprocess": opExpr('and')},
    {"name": "two_op_expr$string$2", "symbols": [{"literal":"&"}, {"literal":"&"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "two_op_expr", "symbols": ["pre_two_op_expr", "two_op_expr$string$2", "post_one_op_expr"], "postprocess": opExpr('and')},
    {"name": "two_op_expr", "symbols": ["one_op_expr"], "postprocess": id},
    {"name": "pre_two_op_expr", "symbols": ["two_op_expr", "__"], "postprocess": id},
    {"name": "pre_two_op_expr", "symbols": [{"literal":"("}, "_", "two_op_expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "one_op_expr", "symbols": ["NOT", "post_boolean_primary"], "postprocess": notOp},
    {"name": "one_op_expr", "symbols": [{"literal":"!"}, "post_boolean_primary"], "postprocess": notOp},
    {"name": "one_op_expr$subexpression$1", "symbols": ["__", "NOT"]},
    {"name": "one_op_expr$subexpression$1", "symbols": []},
    {"name": "one_op_expr$subexpression$2", "symbols": ["TRUE"]},
    {"name": "one_op_expr$subexpression$2", "symbols": ["FALSE"]},
    {"name": "one_op_expr$subexpression$2", "symbols": ["UNKNOWN"]},
    {"name": "one_op_expr", "symbols": ["pre_boolean_primary", "IS", "one_op_expr$subexpression$1", "__", "one_op_expr$subexpression$2"]},
    {"name": "one_op_expr", "symbols": ["boolean_primary"], "postprocess": id},
    {"name": "post_one_op_expr", "symbols": ["__", "one_op_expr"], "postprocess": d => d[1]},
    {"name": "post_one_op_expr", "symbols": [{"literal":"("}, "_", "one_op_expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "pre_expr", "symbols": ["expr", "__"], "postprocess": id},
    {"name": "pre_expr", "symbols": [{"literal":"("}, "_", "expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "post_expr", "symbols": ["__", "expr"], "postprocess": d => d[1]},
    {"name": "post_expr", "symbols": [{"literal":"("}, "_", "expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "mid_expr", "symbols": [{"literal":"("}, "_", "expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "mid_expr", "symbols": ["__", {"literal":"("}, "_", "expr", "_", {"literal":")"}], "postprocess": d => d[3]},
    {"name": "mid_expr", "symbols": [{"literal":"("}, "_", "expr", "_", {"literal":")"}, "__"], "postprocess": d => d[2]},
    {"name": "mid_expr", "symbols": ["__", "expr", "__"], "postprocess": d => d[1]},
    {"name": "boolean_primary$subexpression$1", "symbols": ["__", "NOT"]},
    {"name": "boolean_primary$subexpression$1", "symbols": []},
    {"name": "boolean_primary", "symbols": ["pre_boolean_primary", "IS", "boolean_primary$subexpression$1", "__", "NULLX"], "postprocess": d => ({type: 'is_null', not: d[2], value:d[0]})},
    {"name": "boolean_primary", "symbols": ["boolean_primary", "_", "comparison_type", "_", "predicate"], "postprocess": d => (opExpr(d[2]))([d[0], null, d[4]])},
    {"name": "boolean_primary$subexpression$2", "symbols": ["ANY"]},
    {"name": "boolean_primary$subexpression$2", "symbols": ["ALL"]},
    {"name": "boolean_primary", "symbols": ["boolean_primary", "_", "comparison_type", "_", "boolean_primary$subexpression$2", "subquery"]},
    {"name": "boolean_primary", "symbols": ["predicate"], "postprocess": id},
    {"name": "pre_boolean_primary", "symbols": [{"literal":"("}, "_", "boolean_primary", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "pre_boolean_primary", "symbols": ["boolean_primary", "__"], "postprocess": id},
    {"name": "post_boolean_primary", "symbols": [{"literal":"("}, "_", "boolean_primary", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "post_boolean_primary", "symbols": ["__", "boolean_primary"], "postprocess": d => d[1]},
    {"name": "comparison_type", "symbols": [{"literal":"="}], "postprocess": id},
    {"name": "comparison_type$string$1", "symbols": [{"literal":"<"}, {"literal":"="}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "comparison_type", "symbols": ["comparison_type$string$1"], "postprocess": id},
    {"name": "comparison_type$string$2", "symbols": [{"literal":"<"}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "comparison_type", "symbols": ["comparison_type$string$2"], "postprocess": id},
    {"name": "comparison_type", "symbols": [{"literal":"<"}], "postprocess": id},
    {"name": "comparison_type$string$3", "symbols": [{"literal":"<"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "comparison_type", "symbols": ["comparison_type$string$3"], "postprocess": id},
    {"name": "comparison_type", "symbols": [{"literal":">"}], "postprocess": id},
    {"name": "comparison_type$string$4", "symbols": [{"literal":">"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "comparison_type", "symbols": ["comparison_type$string$4"], "postprocess": id},
    {"name": "comparison_type$string$5", "symbols": [{"literal":"!"}, {"literal":"="}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "comparison_type", "symbols": ["comparison_type$string$5"], "postprocess": id},
    {"name": "predicate", "symbols": ["in_predicate"], "postprocess": id},
    {"name": "predicate", "symbols": ["between_predicate"], "postprocess": id},
    {"name": "predicate", "symbols": ["like_predicate"], "postprocess": id},
    {"name": "predicate", "symbols": ["bit_expr"], "postprocess": id},
    {"name": "in_predicate$subexpression$1", "symbols": ["NOT", "__"]},
    {"name": "in_predicate$subexpression$1", "symbols": []},
    {"name": "in_predicate", "symbols": ["pre_bit_expr", "in_predicate$subexpression$1", "IN", "_", "subquery"], "postprocess":  d => ({
          type:'in',
          value: d[0],
          not: d[1],
          subquery: d[4]
        }) },
    {"name": "in_predicate$subexpression$2", "symbols": ["NOT", "__"]},
    {"name": "in_predicate$subexpression$2", "symbols": []},
    {"name": "in_predicate", "symbols": ["pre_bit_expr", "in_predicate$subexpression$2", "IN", "_", {"literal":"("}, "_", "expr_comma_list", "_", {"literal":")"}], "postprocess":  d => ({
          type: 'in',
          value: d[0],
          not: d[1],
          expressions: (d[6].expressions || [])
        }) },
    {"name": "between_predicate$subexpression$1", "symbols": ["NOT", "__"]},
    {"name": "between_predicate$subexpression$1", "symbols": []},
    {"name": "between_predicate", "symbols": ["pre_bit_expr", "between_predicate$subexpression$1", "BETWEEN", "mid_bit_expr", "AND", "post_bit_expr"], "postprocess": 
        d => ({
          type: 'between',
          value: d[0],
          not: d[1],
          lower: d[3],
          upper: d[5]
        })
            },
    {"name": "mid_bit_expr", "symbols": [{"literal":"("}, "_", "bit_expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "mid_bit_expr", "symbols": ["__", {"literal":"("}, "_", "bit_expr", "_", {"literal":")"}], "postprocess": d => d[3]},
    {"name": "mid_bit_expr", "symbols": [{"literal":"("}, "_", "bit_expr", "_", {"literal":")"}, "__"], "postprocess": d => d[2]},
    {"name": "mid_bit_expr", "symbols": ["__", "bit_expr", "__"], "postprocess": d => d[1]},
    {"name": "like_predicate$subexpression$1", "symbols": ["NOT", "__"]},
    {"name": "like_predicate$subexpression$1", "symbols": []},
    {"name": "like_predicate", "symbols": ["pre_bit_expr", "like_predicate$subexpression$1", "LIKE", "post_bit_expr"], "postprocess": 
        d => ({
          type: 'like',
          not: d[1],
          value: d[0],
          comparison: d[3]
        })
            },
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"|"}, "_", "simple_expr"], "postprocess": opExprWs('|')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"&"}, "_", "simple_expr"], "postprocess": opExprWs('&')},
    {"name": "bit_expr$string$1", "symbols": [{"literal":"<"}, {"literal":"<"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", "bit_expr$string$1", "_", "simple_expr"], "postprocess": opExprWs('<<')},
    {"name": "bit_expr$string$2", "symbols": [{"literal":">"}, {"literal":">"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", "bit_expr$string$2", "_", "simple_expr"], "postprocess": opExprWs('>>')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"+"}, "_", "simple_expr"], "postprocess": opExprWs('+')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"-"}, "_", "simple_expr"], "postprocess": opExprWs('-')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"*"}, "_", "simple_expr"], "postprocess": opExprWs('*')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"/"}, "_", "simple_expr"], "postprocess": opExprWs('/')},
    {"name": "bit_expr", "symbols": ["pre_bit_expr", "DIV", "post_simple_expr"], "postprocess": opExpr('DIV')},
    {"name": "bit_expr", "symbols": ["pre_bit_expr", "MOD", "post_simple_expr"], "postprocess": opExpr('MOD')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"%"}, "_", "simple_expr"], "postprocess": opExprWs('%')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"^"}, "_", "simple_expr"], "postprocess": opExprWs('^')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"+"}, "_", "interval_expr"], "postprocess": opExprWs('+')},
    {"name": "bit_expr", "symbols": ["bit_expr", "_", {"literal":"-"}, "_", "interval_expr"], "postprocess": opExprWs('-')},
    {"name": "bit_expr", "symbols": ["interval_expr"], "postprocess": id},
    {"name": "bit_expr", "symbols": ["simple_expr"], "postprocess": id},
    {"name": "pre_bit_expr", "symbols": ["bit_expr", "__"], "postprocess": id},
    {"name": "pre_bit_expr", "symbols": [{"literal":"("}, "_", "bit_expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "post_bit_expr", "symbols": ["__", "bit_expr"], "postprocess": d => d[1]},
    {"name": "post_bit_expr", "symbols": [{"literal":"("}, "_", "bit_expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "simple_expr", "symbols": ["literal"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["identifier"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["function_call"], "postprocess": id},
    {"name": "simple_expr", "symbols": [{"literal":"("}, "_", "expr_comma_list", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "simple_expr", "symbols": ["subquery"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["EXISTS", "_", "subquery"], "postprocess": d => ({type: 'exists', query: d[2]})},
    {"name": "simple_expr", "symbols": ["case_statement"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["BINARY", "__", "simple_expr"], "postprocess": d => ({type: 'binary_statement', expr: d[2]})},
    {"name": "simple_expr", "symbols": ["if_statement"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["cast_statement"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["convert_statement"], "postprocess": id},
    {"name": "simple_expr", "symbols": ["identifier", {"literal":"."}, "identifier"], "postprocess": d => ({type: 'column', table: d[0].value, name: d[2].value})},
    {"name": "post_simple_expr", "symbols": ["__", "simple_expr"], "postprocess": d => d[1]},
    {"name": "post_simple_expr", "symbols": [{"literal":"("}, "_", "simple_expr", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "literal", "symbols": ["string"], "postprocess": id},
    {"name": "literal", "symbols": ["decimal"], "postprocess": d => ({type: 'decimal', value: d[0]})},
    {"name": "literal", "symbols": ["NULLX"], "postprocess": d => ({type: 'null'})},
    {"name": "literal", "symbols": ["TRUE"], "postprocess": d => ({type: 'true'})},
    {"name": "literal", "symbols": ["FALSE"], "postprocess": d => ({type: 'false'})},
    {"name": "expr_comma_list", "symbols": ["expr"], "postprocess": d => ({type:'expr_comma_list', exprs: [d[0]]})},
    {"name": "expr_comma_list", "symbols": ["expr_comma_list", "_", {"literal":","}, "_", "expr"], "postprocess": d => ({type:'expr_comma_list', exprs: (d[0].exprs||[]).concat(d[4])})},
    {"name": "if_statement", "symbols": ["IF", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        d => ({
          type: 'if',
          condition: d[4],
          then: d[8],
          'else': d[12]
        })
            },
    {"name": "case_statement$subexpression$1", "symbols": ["__"]},
    {"name": "case_statement$subexpression$1", "symbols": ["mid_expr"]},
    {"name": "case_statement$subexpression$2", "symbols": ["__", "ELSE", "__", "expr", "__"]},
    {"name": "case_statement$subexpression$2", "symbols": ["__"]},
    {"name": "case_statement", "symbols": ["CASE", "case_statement$subexpression$1", "when_statement_list", "case_statement$subexpression$2", "END"], "postprocess": 
        d => ({
          type: 'case',
          op_right: d[1][0],
          when_statements: d[2].statements,
          'else': (d[3]||[])[3]
        })
            },
    {"name": "when_statement_list", "symbols": ["when_statement"], "postprocess": d => ({statements: [d[0]]})},
    {"name": "when_statement_list", "symbols": ["when_statement_list", "__", "when_statement"], "postprocess":  d => ({
          statements: (d[0].statements||[]).concat([d[2]])
        })
          },
    {"name": "when_statement", "symbols": ["WHEN", "__", "expr", "__", "THEN", "__", "expr"], "postprocess": 
        d => ({
          type: 'when',
          condition: d[2],
          then: d[6]
        })
            },
    {"name": "subquery", "symbols": [{"literal":"("}, "_", "query_spec", "_", {"literal":")"}], "postprocess": d => d[2]},
    {"name": "convert_statement", "symbols": ["CONVERT", "_", {"literal":"("}, "expr", "__", "USING", "__", "identifier", {"literal":")"}], "postprocess": 
        d => ({
          type: 'convert',
          value: d[2],
          using: d[4]
        })
            },
    {"name": "interval_expr", "symbols": ["INTERVAL", "__", "expr", "__", "date_unit"], "postprocess": 
        d => ({
          type: 'interval',
          value: d[2],
          unit: d[4]
        })
            },
    {"name": "cast_statement", "symbols": ["CAST", "_", {"literal":"("}, "_", "expr", "__", "AS", "__", "data_type", "_", {"literal":")"}], "postprocess": 
        d => ({
          type: 'cast',
          value: d[4],
          data_type: d[8]
        })
            },
    {"name": "DECIMAL", "symbols": ["D", "E", "C", "I", "M", "A", "L"]},
    {"name": "data_type$subexpression$1", "symbols": [{"literal":"("}, "int", {"literal":")"}]},
    {"name": "data_type$subexpression$1", "symbols": []},
    {"name": "data_type", "symbols": ["B", "I", "N", "A", "R", "Y", "data_type$subexpression$1"], "postprocess": d => dataType('binary', d[6])},
    {"name": "data_type$subexpression$2", "symbols": [{"literal":"("}, "int", {"literal":")"}]},
    {"name": "data_type$subexpression$2", "symbols": []},
    {"name": "data_type", "symbols": ["C", "H", "A", "R", "data_type$subexpression$2"], "postprocess": d => dataType('char', d[4])},
    {"name": "data_type", "symbols": ["D", "A", "T", "E"], "postprocess": d => dataType('date')},
    {"name": "data_type", "symbols": ["DECIMAL"], "postprocess": d => dataType('decimal')},
    {"name": "data_type$subexpression$3", "symbols": ["__"]},
    {"name": "data_type$subexpression$3", "symbols": []},
    {"name": "data_type$subexpression$4", "symbols": ["__"]},
    {"name": "data_type$subexpression$4", "symbols": []},
    {"name": "data_type", "symbols": ["DECIMAL", {"literal":"("}, "data_type$subexpression$3", "int", "data_type$subexpression$4", {"literal":")"}], "postprocess": d => dataType('decimal', [0,d[3]])},
    {"name": "data_type$subexpression$5", "symbols": ["__"]},
    {"name": "data_type$subexpression$5", "symbols": []},
    {"name": "data_type$subexpression$6", "symbols": ["__"]},
    {"name": "data_type$subexpression$6", "symbols": []},
    {"name": "data_type$subexpression$7", "symbols": ["__"]},
    {"name": "data_type$subexpression$7", "symbols": []},
    {"name": "data_type", "symbols": ["DECIMAL", {"literal":"("}, "data_type$subexpression$5", "int", "data_type$subexpression$6", {"literal":","}, "data_type$subexpression$7", "int", {"literal":")"}], "postprocess":  d => ({
          type: 'data_type',
          data_type: 'decimal',
          size1: d[3],
          size2: d[7]
        }) },
    {"name": "data_type", "symbols": ["F", "L", "O", "A", "T"], "postprocess": d => dataType('float')},
    {"name": "data_type", "symbols": ["N", "C", "H", "A", "R"], "postprocess": d => dataType('nchar')},
    {"name": "data_type", "symbols": ["S", "I", "G", "N", "E", "D"], "postprocess": d => dataType('signed')},
    {"name": "data_type", "symbols": ["T", "I", "M", "E"], "postprocess": d => dataType('time')},
    {"name": "data_type", "symbols": ["U", "N", "S", "I", "G", "N", "E", "D"], "postprocess": d => dataType('unsigned')},
    {"name": "date_unit", "symbols": ["date_unit_internal"], "postprocess": d => ({type: 'date_unit', date_unit: d[0].join('')})},
    {"name": "date_unit_internal", "symbols": ["M", "I", "C", "R", "O", "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["M", "I", "N", "U", "T", "E"]},
    {"name": "date_unit_internal", "symbols": ["H", "O", "U", "R"]},
    {"name": "date_unit_internal", "symbols": ["D", "A", "Y"]},
    {"name": "date_unit_internal", "symbols": ["W", "E", "E", "K"]},
    {"name": "date_unit_internal", "symbols": ["M", "O", "N", "T", "H"]},
    {"name": "date_unit_internal", "symbols": ["Q", "U", "A", "R", "T", "E", "R"]},
    {"name": "date_unit_internal", "symbols": ["Y", "E", "A", "R"]},
    {"name": "date_unit_internal", "symbols": ["S", "E", "C", "O", "N", "D", {"literal":"_"}, "M", "I", "C", "R", "O", "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["M", "I", "N", "U", "T", "E", {"literal":"_"}, "M", "I", "C", "R", "O", "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["M", "I", "N", "U", "T", "E", {"literal":"_"}, "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["H", "O", "U", "R", {"literal":"_"}, "M", "I", "C", "R", "O", "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["H", "O", "U", "R", {"literal":"_"}, "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["H", "O", "U", "R", {"literal":"_"}, "M", "I", "N", "U", "T", "E"]},
    {"name": "date_unit_internal", "symbols": ["D", "A", "Y", {"literal":"_"}, "M", "I", "C", "R", "O", "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["D", "A", "Y", {"literal":"_"}, "S", "E", "C", "O", "N", "D"]},
    {"name": "date_unit_internal", "symbols": ["D", "A", "Y", {"literal":"_"}, "M", "I", "N", "U", "T", "E"]},
    {"name": "date_unit_internal", "symbols": ["D", "A", "Y", {"literal":"_"}, "H", "O", "U", "R"]},
    {"name": "date_unit_internal", "symbols": ["Y", "E", "A", "R", {"literal":"_"}, "M", "O", "N", "T", "H"]},
    {"name": "function_call", "symbols": ["function_identifier", "_", {"literal":"("}, "_", {"literal":"*"}, "_", {"literal":")"}], "postprocess":  d => ({
          type:'function_call',
          name: d[0],
          select_all: true
        }) },
    {"name": "function_call", "symbols": ["function_identifier", "_", {"literal":"("}, "_", "DISTINCT", "__", "column", "_", {"literal":")"}], "postprocess":  d => ({
          type: 'function_call',
          name: d[0],
          distinct: true,
          parameters: [d[6]]
        })},
    {"name": "function_call", "symbols": ["function_identifier", "_", {"literal":"("}, "_", "ALL", "post_expr", "_", {"literal":")"}], "postprocess":  d => ({
          type: 'function_call',
          name: d[0],
          all: true,
          parameters: [d[5]]
        })},
    {"name": "function_call$string$1", "symbols": [{"literal":"("}, {"literal":")"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "function_call", "symbols": ["function_identifier", "_", "function_call$string$1"], "postprocess":  d => ({
          type: 'function_call',
          name: d[0],
          parameters: []
        })},
    {"name": "function_call", "symbols": ["function_identifier", "_", {"literal":"("}, "_", "expr_comma_list", "_", {"literal":")"}], "postprocess":  d => ({
          type: 'function_call',
          name: d[0],
          parameters: (d[4].exprs)
        })},
    {"name": "string", "symbols": ["dqstring"], "postprocess": d => ({type: 'string', string: d[0]})},
    {"name": "string", "symbols": ["sqstring"], "postprocess": d => ({type: 'string', string: d[0]})},
    {"name": "column", "symbols": ["identifier"], "postprocess": d => ({type: 'column', name: d[0].value})},
    {"name": "column", "symbols": ["identifier", "__", "AS", "__", "identifier"], "postprocess": d => ({type: 'column', name: d[0].value, alias: d[2].value})},
    {"name": "identifier", "symbols": ["btstring"], "postprocess": d => ({type: 'identifier', value:d[0]})},
    {"name": "identifier$ebnf$1$subexpression$1", "symbols": [/[^\]]/]},
    {"name": "identifier$ebnf$1$subexpression$1$string$1", "symbols": [{"literal":"\\"}, {"literal":"]"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "identifier$ebnf$1$subexpression$1", "symbols": ["identifier$ebnf$1$subexpression$1$string$1"]},
    {"name": "identifier$ebnf$1", "symbols": ["identifier$ebnf$1$subexpression$1"]},
    {"name": "identifier$ebnf$1$subexpression$2", "symbols": [/[^\]]/]},
    {"name": "identifier$ebnf$1$subexpression$2$string$1", "symbols": [{"literal":"\\"}, {"literal":"]"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "identifier$ebnf$1$subexpression$2", "symbols": ["identifier$ebnf$1$subexpression$2$string$1"]},
    {"name": "identifier$ebnf$1", "symbols": ["identifier$ebnf$1", "identifier$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "identifier", "symbols": [{"literal":"["}, "identifier$ebnf$1", {"literal":"]"}], "postprocess": d => ({type: 'identifier', value: d[1].map(x => x[0]).join('')})},
    {"name": "identifier$ebnf$2", "symbols": []},
    {"name": "identifier$ebnf$2", "symbols": ["identifier$ebnf$2", /[a-zA-Z0-9_]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "identifier", "symbols": [/[a-zA-Z_]/, "identifier$ebnf$2"], "postprocess":  (d,l,reject) => {
          const value = d[0] + d[1].join('');
          if(reserved.indexOf(value.toUpperCase()) != -1) return reject;
          return {type: 'identifier', value: value};
        } },
    {"name": "function_identifier", "symbols": ["btstring"], "postprocess": d => ({value:d[0]})},
    {"name": "function_identifier$ebnf$1", "symbols": []},
    {"name": "function_identifier$ebnf$1", "symbols": ["function_identifier$ebnf$1", /[a-zA-Z0-9_]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "function_identifier", "symbols": [/[a-zA-Z_]/, "function_identifier$ebnf$1"], "postprocess":  (d,l,reject) => {
          const value = d[0] + d[1].join('');
          if(reserved.indexOf(value.toUpperCase()) != -1 && valid_function_identifiers.indexOf(value.toUpperCase()) == -1) return reject;
          return {value: value};
        } },
    {"name": "dqstring$ebnf$1", "symbols": []},
    {"name": "dqstring$ebnf$1", "symbols": ["dqstring$ebnf$1", "dstrchar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "dqstring", "symbols": [{"literal":"\""}, "dqstring$ebnf$1", {"literal":"\""}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "sqstring$ebnf$1", "symbols": []},
    {"name": "sqstring$ebnf$1", "symbols": ["sqstring$ebnf$1", "sstrchar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "sqstring", "symbols": [{"literal":"'"}, "sqstring$ebnf$1", {"literal":"'"}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "btstring$ebnf$1", "symbols": []},
    {"name": "btstring$ebnf$1", "symbols": ["btstring$ebnf$1", /[^`]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "btstring", "symbols": [{"literal":"`"}, "btstring$ebnf$1", {"literal":"`"}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "dstrchar", "symbols": [/[^\\"\n]/], "postprocess": id},
    {"name": "dstrchar", "symbols": [{"literal":"\\"}, "strescape"], "postprocess": 
        function(d) {
          return JSON.parse("\""+d.join("")+"\"");
        }
        },
    {"name": "sstrchar", "symbols": [/[^\\'\n]/], "postprocess": id},
    {"name": "sstrchar", "symbols": [{"literal":"\\"}, "strescape"], "postprocess": 
        function(d) {
          return JSON.parse("\""+d.join("")+"\"");
        } },
    {"name": "sstrchar$string$1", "symbols": [{"literal":"\\"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "sstrchar", "symbols": ["sstrchar$string$1"], "postprocess": function(d) {return "'"; }},
    {"name": "strescape", "symbols": [/["\\\/bfnrt]/], "postprocess": id},
    {"name": "strescape", "symbols": [{"literal":"u"}, /[a-fA-F0-9]/, /[a-fA-F0-9]/, /[a-fA-F0-9]/, /[a-fA-F0-9]/], "postprocess": 
        function(d) {
            return d.join("");
        }
        },
    {"name": "ROLLUP", "symbols": ["R", "O", "L", "L", "U", "P"]},
    {"name": "WITH", "symbols": ["W", "I", "T", "H"]},
    {"name": "AND", "symbols": [/[Aa]/, /[Nn]/, /[Dd]/]},
    {"name": "ANY", "symbols": [/[Aa]/, /[Nn]/, /[Yy]/]},
    {"name": "ALL", "symbols": [/[Aa]/, /[Ll]/, /[Ll]/]},
    {"name": "AS", "symbols": [/[Aa]/, /[Ss]/]},
    {"name": "ASC", "symbols": [/[Aa]/, /[Ss]/, /[Cc]/]},
    {"name": "BETWEEN", "symbols": [/[Bb]/, /[Ee]/, /[Tt]/, /[Ww]/, /[Ee]/, /[Ee]/, /[Nn]/]},
    {"name": "BINARY", "symbols": ["B", "I", "N", "A", "R", "Y"]},
    {"name": "BY", "symbols": [/[Bb]/, /[Yy]/]},
    {"name": "CASE", "symbols": [/[Cc]/, /[Aa]/, /[Ss]/, /[Ee]/]},
    {"name": "CAST", "symbols": [/[Cc]/, /[Aa]/, /[Ss]/, /[Tt]/]},
    {"name": "CONVERT", "symbols": [/[Cc]/, /[Oo]/, /[Nn]/, /[Vv]/, /[Ee]/, /[Rr]/, /[Tt]/]},
    {"name": "CREATE", "symbols": [/[Cc]/, /[Rr]/, /[Ee]/, /[Aa]/, /[Tt]/, /[Ee]/]},
    {"name": "DESC", "symbols": [/[Dd]/, /[Ee]/, /[Ss]/, /[Cc]/]},
    {"name": "DISTINCT", "symbols": [/[Dd]/, /[Ii]/, /[Ss]/, /[Tt]/, /[Ii]/, /[Nn]/, /[Cc]/, /[Tt]/]},
    {"name": "DIV", "symbols": [/[Dd]/, /[Ii]/, /[Vv]/]},
    {"name": "ELSE", "symbols": [/[Ee]/, /[Ll]/, /[Ss]/, /[Ee]/]},
    {"name": "END", "symbols": [/[Ee]/, /[Nn]/, /[Dd]/]},
    {"name": "EXISTS", "symbols": [/[Ee]/, /[Xx]/, /[Ii]/, /[Ss]/, /[Tt]/, /[Ss]/]},
    {"name": "FALSE", "symbols": [/[Ff]/, /[Aa]/, /[Ll]/, /[Ss]/, /[Ee]/]},
    {"name": "FROM", "symbols": [/[Ff]/, /[Rr]/, /[Oo]/, /[Mm]/]},
    {"name": "GROUP", "symbols": [/[Gg]/, /[Rr]/, /[Oo]/, /[Uu]/, /[Pp]/]},
    {"name": "HAVING", "symbols": [/[Hh]/, /[Aa]/, /[Vv]/, /[Ii]/, /[Nn]/, /[Gg]/]},
    {"name": "IF", "symbols": [/[Ii]/, /[Ff]/]},
    {"name": "IN", "symbols": [/[Ii]/, /[Nn]/]},
    {"name": "INNER", "symbols": [/[Ii]/, /[Nn]/, /[Nn]/, /[Ee]/, /[Rr]/], "postprocess": d => 'inner'},
    {"name": "OUTER", "symbols": [/[Oo]/, /[Uu]/, /[Tt]/, /[Ee]/, /[Rr]/], "postprocess": d => 'outer'},
    {"name": "INTERVAL", "symbols": [/[Ii]/, /[Nn]/, /[Tt]/, /[Ee]/, /[Rr]/, /[Vv]/, /[Aa]/, /[Ll]/]},
    {"name": "IS", "symbols": [/[Ii]/, /[Ss]/]},
    {"name": "JOIN", "symbols": [/[Jj]/, /[Oo]/, /[Ii]/, /[Nn]/]},
    {"name": "LEFT", "symbols": [/[Ll]/, /[Ee]/, /[Ff]/, /[Tt]/], "postprocess": d => 'left'},
    {"name": "LIKE", "symbols": [/[Ll]/, /[Ii]/, /[Kk]/, /[Ee]/]},
    {"name": "LIMIT", "symbols": ["L", "I", "M", "I", "T"]},
    {"name": "MOD", "symbols": [/[Mm]/, /[Oo]/, /[Dd]/]},
    {"name": "NOT", "symbols": [/[Nn]/, /[Oo]/, /[Tt]/]},
    {"name": "NULLX", "symbols": [/[Nn]/, /[Uu]/, /[Ll]/, /[Ll]/, /[Xx]/]},
    {"name": "NULLX", "symbols": [/[Nn]/, /[Uu]/, /[Ll]/, /[Ll]/]},
    {"name": "ON", "symbols": [/[Oo]/, /[Nn]/]},
    {"name": "OR", "symbols": [/[Oo]/, /[Rr]/]},
    {"name": "ORDER", "symbols": [/[Oo]/, /[Rr]/, /[Dd]/, /[Ee]/, /[Rr]/]},
    {"name": "REPLACE", "symbols": [/[Rr]/, /[Ee]/, /[Pp]/, /[Ll]/, /[Aa]/, /[Cc]/, /[Ee]/]},
    {"name": "RIGHT", "symbols": [/[Rr]/, /[Ii]/, /[Gg]/, /[Hh]/, /[Tt]/], "postprocess": d => 'right'},
    {"name": "SELECT", "symbols": [/[Ss]/, /[Ee]/, /[Ll]/, /[Ee]/, /[Cc]/, /[Tt]/]},
    {"name": "SOME", "symbols": [/[Ss]/, /[Oo]/, /[Mm]/, /[Ee]/]},
    {"name": "THEN", "symbols": [/[Tt]/, /[Hh]/, /[Ee]/, /[Nn]/]},
    {"name": "TOP", "symbols": ["T", "O", "P"]},
    {"name": "TRUE", "symbols": [/[Tt]/, /[Rr]/, /[Uu]/, /[Ee]/]},
    {"name": "UNION", "symbols": [/[Uu]/, /[Nn]/, /[Ii]/, /[Oo]/, /[Nn]/]},
    {"name": "UNKNOWN", "symbols": [/[Uu]/, /[Kk]/, /[Oo]/, /[Ww]/, /[Nn]/]},
    {"name": "USING", "symbols": [/[Uu]/, /[Ss]/, /[Ii]/, /[Nn]/, /[Gg]/]},
    {"name": "VIEW", "symbols": [/[Vv]/, /[Ii]/, /[Ee]/, /[Ww]/]},
    {"name": "WHEN", "symbols": [/[Ww]/, /[Hh]/, /[Ee]/, /[Nn]/]},
    {"name": "WHERE", "symbols": [/[Ww]/, /[Hh]/, /[Ee]/, /[Rr]/, /[Ee]/]},
    {"name": "XOR", "symbols": [/[Xx]/, /[Oo]/, /[Rr]/]},
    {"name": "A", "symbols": [{"literal":"A"}]},
    {"name": "A", "symbols": [{"literal":"a"}]},
    {"name": "B", "symbols": [{"literal":"B"}]},
    {"name": "B", "symbols": [{"literal":"b"}]},
    {"name": "C", "symbols": [{"literal":"C"}]},
    {"name": "C", "symbols": [{"literal":"c"}]},
    {"name": "D", "symbols": [{"literal":"D"}]},
    {"name": "D", "symbols": [{"literal":"d"}]},
    {"name": "E", "symbols": [{"literal":"E"}]},
    {"name": "E", "symbols": [{"literal":"e"}]},
    {"name": "F", "symbols": [{"literal":"F"}]},
    {"name": "F", "symbols": [{"literal":"f"}]},
    {"name": "G", "symbols": [{"literal":"G"}]},
    {"name": "G", "symbols": [{"literal":"g"}]},
    {"name": "H", "symbols": [{"literal":"H"}]},
    {"name": "H", "symbols": [{"literal":"h"}]},
    {"name": "I", "symbols": [{"literal":"I"}]},
    {"name": "I", "symbols": [{"literal":"i"}]},
    {"name": "J", "symbols": [{"literal":"J"}]},
    {"name": "J", "symbols": [{"literal":"j"}]},
    {"name": "K", "symbols": [{"literal":"K"}]},
    {"name": "K", "symbols": [{"literal":"k"}]},
    {"name": "L", "symbols": [{"literal":"L"}]},
    {"name": "L", "symbols": [{"literal":"l"}]},
    {"name": "M", "symbols": [{"literal":"M"}]},
    {"name": "M", "symbols": [{"literal":"m"}]},
    {"name": "N", "symbols": [{"literal":"N"}]},
    {"name": "N", "symbols": [{"literal":"n"}]},
    {"name": "O", "symbols": [{"literal":"O"}]},
    {"name": "O", "symbols": [{"literal":"o"}]},
    {"name": "P", "symbols": [{"literal":"P"}]},
    {"name": "P", "symbols": [{"literal":"p"}]},
    {"name": "Q", "symbols": [{"literal":"Q"}]},
    {"name": "Q", "symbols": [{"literal":"q"}]},
    {"name": "R", "symbols": [{"literal":"R"}]},
    {"name": "R", "symbols": [{"literal":"r"}]},
    {"name": "S", "symbols": [{"literal":"S"}]},
    {"name": "S", "symbols": [{"literal":"s"}]},
    {"name": "T", "symbols": [{"literal":"T"}]},
    {"name": "T", "symbols": [{"literal":"t"}]},
    {"name": "U", "symbols": [{"literal":"U"}]},
    {"name": "U", "symbols": [{"literal":"u"}]},
    {"name": "V", "symbols": [{"literal":"V"}]},
    {"name": "V", "symbols": [{"literal":"v"}]},
    {"name": "W", "symbols": [{"literal":"W"}]},
    {"name": "W", "symbols": [{"literal":"w"}]},
    {"name": "X", "symbols": [{"literal":"X"}]},
    {"name": "X", "symbols": [{"literal":"x"}]},
    {"name": "Y", "symbols": [{"literal":"Y"}]},
    {"name": "Y", "symbols": [{"literal":"y"}]},
    {"name": "Z", "symbols": [{"literal":"Z"}]},
    {"name": "Z", "symbols": [{"literal":"z"}]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "_$ebnf$2", "symbols": []},
    {"name": "_$ebnf$2", "symbols": ["_$ebnf$2", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_$ebnf$3", "symbols": []},
    {"name": "_$ebnf$3", "symbols": ["_$ebnf$3", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$2", "comment", "_$ebnf$3"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$2", "symbols": ["wschar"]},
    {"name": "__$ebnf$2", "symbols": ["__$ebnf$2", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__$ebnf$3", "symbols": []},
    {"name": "__$ebnf$3", "symbols": ["__$ebnf$3", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$2", "comment", "__$ebnf$3"], "postprocess": function(d) {return null;}},
    {"name": "comment$subexpression$1", "symbols": [{"literal":"#"}]},
    {"name": "comment$subexpression$1$string$1", "symbols": [{"literal":"-"}, {"literal":"-"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "comment$subexpression$1", "symbols": ["comment$subexpression$1$string$1", "wschar"]},
    {"name": "comment$ebnf$1", "symbols": [/[^\n]/]},
    {"name": "comment$ebnf$1", "symbols": ["comment$ebnf$1", /[^\n]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "comment$subexpression$2", "symbols": [/[\n]/]},
    {"name": "comment", "symbols": ["comment$subexpression$1", "comment$ebnf$1", "comment$subexpression$2"], "postprocess": x => null},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
