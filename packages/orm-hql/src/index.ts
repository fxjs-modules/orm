import nearley = require("nearley");
const grammar: nearley.CompiledRules & nearley.Grammar = require("./sql-parse");

function walk(
  obj: (Fibjs.AnyObject | any[]) | FxHQLTypeHelpers.ItemInArrayOrValueInObject<Fibjs.AnyObject | any[]>,
  fn: (
    input: typeof obj
  ) => false | any
): void {
  if (!obj) return;
  const result = fn(obj);
  if (result === false) return;
  if (typeof obj === "object") {
    for (let i in obj) {
      walk(obj[i], fn);
    }
  }
}

function parserDefinition(
  options: FxHQLTypeHelpers.ConstructorParams<typeof FxHQL.Parser>[0]
) {
  options = options || {};
  options.stringEscape = options.stringEscape || (x => '"' + x + '"');
  options.identifierEscape = options.identifierEscape || (x => "`" + x + "`");

  return {
    toSql(parsed: FxHQLParser.ParsedNode) {
      if (!parsed) return "";
      if (!parsed.type) return "";

      // const spacing = options.spacing || "";
      // console.notice('parsed', parsed)

      options = options || {};
      switch (parsed.type) {
        case "create_view": {
          const table = this.toSql(parsed.table, options);
          const definition = this.toSql(parsed.definition, options);
          let sql = "create ";
          if (parsed.replace) sql += "or replace ";
          sql += "view " + table + " as " + definition;
          return sql;
        }
        case "select": {
          let sql = "(select ";
          if (parsed.top) sql += "top " + parsed.top + " ";
          if (parsed.all_distinct) sql += this.toSql(parsed.all) + " ";
          let selection;
          if (parsed.selection.columns)
            selection = parsed.selection.columns
              .map(x => this.toSql(x))
              .join(", ");
          else selection = this.toSql(parsed.selection);
          sql += selection;
          if (parsed.table_exp) sql += " " + this.toSql(parsed.table_exp);
          return sql + ")";
        }
        case "binary_statement": {
          return "binary (" + this.toSql(parsed.expr) + ")";
        }
        case "union": {
          const op_left = this.toSql(parsed.op_left);
          const op_right = this.toSql(parsed.op_right);
          return "((" + op_left + ") union (" + op_right + "))";
        }
        case "from": {
          let sql = "from (";
          if (parsed.table_refs)
            sql += parsed.table_refs.map(x => this.toSql(x)).join(", ");
          else if (parsed.subquery) sql += this.toSql(parsed.subquery);
          return sql + ")";
        }
        case "from_table": {
          let sql = this.toSql(parsed.from);
          if (parsed.where) sql += " " + this.toSql(parsed.where);
          if (parsed.groupby) sql += " " + this.toSql(parsed.groupby);
          if (parsed.having) sql += " " + this.toSql(parsed.having);
          if (parsed.order) sql += " " + this.toSql(parsed.order);
          if (parsed.limit) sql += " " + this.toSql(parsed.limit);
          return sql;
        }
        case "all":
          return "all";
        case "distinct":
          return "distinct";
        case "group_by": {
          let sql = "group by (" + this.toSql(parsed.columns) + ")";
          if (parsed.with_rollup) sql += " with rollup";
          return sql;
        }
        case "select_all":
          return "*";
        case "column": {
          let sql = "";
          if (parsed.expression) {
            sql += this.toSql(parsed.expression);
          } else if (parsed.name) {
            if (parsed.table)
              sql += options.identifierEscape(parsed.table) + ".";
            sql += options.identifierEscape(parsed.name);
          }
          if (parsed.alias) sql += " as " + this.toSql(parsed.alias);
          return sql;
        }
        case "expr_comma_list": {
          return parsed.exprs.map(x => this.toSql(x)).join(", ");
        }
        case "table_ref": {
          let sql = "(" + this.toSql(parsed.ref_left);
          if (!parsed.inner) {
            if (parsed.side) sql += " " + parsed.side + (parsed.specific_outer ? " outer" : "") + " ";
            else sql += " ";
          } else {
            sql += " inner ";
          }
          sql += "join " + this.toSql(parsed.ref_right);

          if (parsed.alias) sql += " as " + this.toSql(parsed.alias);

          if (parsed.using)
            sql +=
              " using (" + (<FxHQLParser.IdentifierNode[]>parsed.on).map(x => this.toSql(x)).join(",") + ")";
          else if (parsed.on) sql += " on " + this.toSql(parsed.on);

          sql += ")";
          return sql;
        }
        case "table": {
          let sql = options.identifierEscape(parsed.table);
          if (parsed.alias)
            sql += "as " + options.identifierEscape(parsed.alias);
          return sql;
        }
        case "where": {
          let sql = "where (";
          const condition = this.toSql(parsed.condition);
          sql += condition + ")";
          return sql;
        }
        case "having": {
          let sql = "having (";
          const condition = this.toSql(parsed.condition);
          sql += condition + ")";
          return sql;
        }
        case "selection_columns": {
          return parsed.columns.map(x => this.toSql(x)).join(", ");
        }
        case "order": {
          let sql = "order by ";
          sql += parsed.order.map(x => this.toSql(x)).join(", ") + "";
          return sql;
        }
        case "limit_statement": {
          return "limit " + parsed.limit;
        }
        case "order_statement": {
          const value = this.toSql(parsed.value);
          let sql = value;
          if (parsed.direction) sql += " " + parsed.direction;
          return sql;
        }
        case "operator": {
          let sql = "(";
          if (parsed.operator === "not") {
            const operand = this.toSql(parsed.operand);
            sql += "not " + operand;
          } else {
            const op_left = this.toSql(parsed.op_left);
            const op_right = this.toSql(parsed.op_right);
            sql += op_left + " " + parsed.operator + " " + op_right;
          }
          return sql + ")";
        }
        case "is_null": {
          const value = this.toSql(parsed.value);
          let sql = "(" + value + " is ";
          if (parsed.not) sql += "not ";
          sql += "null)";
          return sql;
        }
        case "in": {
          const value = this.toSql(parsed.value);
          let sql = "(" + value + " ";
          if (parsed.not) sql += "not";
          sql += "in ";
          if (parsed.subquery) sql += "(" + this.toSql(parsed.subquery) + ")";
          else if (parsed.expressions) // TODO: check it
            sql +=
              "(" + parsed.expressions.map(x => this.toSql(x)).join(", ") + ")";
          return sql + ")";
        }
        case "between": {
          const value = this.toSql(parsed.value);
          const lower = this.toSql(parsed.lower);
          const upper = this.toSql(parsed.upper);
          let sql = "(" + value + " ";
          if (parsed.not) sql += "not ";
          sql += "between " + lower + " and " + upper + ")";
          return sql;
        }
        case "like": {
          const value = this.toSql(parsed.value);
          const comparison = this.toSql(parsed.comparison);
          let sql = "(" + value + " ";
          if (parsed.not) sql += "not ";
          sql += "like " + comparison + ")";
          return sql;
        }
        case "exists": {
          const query = this.toSql(parsed.query);
          return "(exists " + query + ")";
        }
        case "null":
          return "null";
        case "true":
          return "true";
        case "false":
          return "false";
        case "if": {
          const condition = this.toSql(parsed.condition);
          const then = this.toSql(parsed.then);
          const elseExpr = this.toSql(parsed['else']);
          return "if(" + condition + ", " + then + ", " + elseExpr + ")";
        }
        case "case": {
          let sql = "(case ";
          if (parsed.op_right) sql += this.toSql(parsed.op_right) + " ";
          sql += parsed.when_statements.map(when => this.toSql(when)).join(" ");
          if (parsed["else"]) {
            sql += " else " + this.toSql(parsed["else"]);
          }
          sql += " end)";
          return sql;
        }
        case "when": {
          const condition = this.toSql(parsed.condition);
          const then = this.toSql(parsed.then);
          return "when " + condition + " then " + then;
        }
        case "convert": {
          const value = this.toSql(parsed.value);
          const using = this.toSql(parsed.using);
          return "conver(" + value + " using " + using + ")";
        }
        case "interval": {
          const value = this.toSql(parsed.value);
          const unit = this.toSql(parsed.unit);
          return "interval " + value + " " + unit;
        }
        case "cast": {
          const value = this.toSql(parsed.value);
          const type = this.toSql(parsed.data_type);
          return "cast(" + value + " as " + type + ")";
        }
        case "data_type": {
          let sql = parsed.data_type;
          if (parsed.size) sql += "(" + parsed.size + ")";
          else if (parsed.size1)
            sql += "(" + parsed.size1 + ", " + parsed.size2 + ")";
          return sql;
        }
        case "date_unit": {
          return parsed.date_unit;
        }
        case "function_call": {
          let sql = parsed.name.value + "(";
          if (parsed.select_all) return sql + "*)";
          if (!parsed.parameters.length) return sql + ")";
          if (parsed.distinct) sql += "distinct ";
          if (parsed.all) sql += "all ";
          sql += parsed.parameters.map(p => this.toSql(p)).join(", ");
          return sql + ")";
        }
        case "string": {
          return options.stringEscape(parsed.string);
        }
        case "identifier": {
          return options.identifierEscape(parsed.value);
        }
        case "decimal": {
          return parsed.value;
        }
      }
      return "-- Invalid sql.type: " + (<any>parsed).type + "\n";
    },
    parse(sql: string) {
      sql += "\n";

      const parser = new nearley.Parser(
        grammar.ParserRules as any,
        grammar.ParserStart as any
      );
      const parsed = parser.feed(sql);

      const parsedResult: FxHQLParser.ParsedNode[] = parsed.results;
      if (!parsedResult.length) throw "Invalid sql: " + sql;
      if (parsedResult.length > 1) {
        // console.error(JSON.stringify(parsedResult, null, 2));
        throw "SQL ambiguous: Report to developers " + sql;
      }

      const result = parsedResult[0];

      const referencedTables = <{[k: string]: FxHQLParser.TableNode}>{};
      const joins = <FxHQLParser.ParsedResult['joins']>[];
      const allTableReferences = <(FxHQLParser.TableNode)[]>[];
      walk(result, (node: FxHQLParser.ParsedNode) => {
        if (node.type === "table") {
          referencedTables[node.table] = node;
          allTableReferences.push(node);
        }
        if (node.type === "table_ref" && node.on) {
          const columns = <FxHQLParser.ColumnNode[]>[];
          walk(node.on, (n: FxHQLTypeHelpers.ItemInArrayOrValueInObject<FxHQLParser.TableRefNode['on']>) => {
            if (n.type === "table_ref") return false;
            if (n.type === "column") {
              columns.push(n);
              return false;
            }
          });

          joins.push({
            side: node.side,
            specific_outer: node.specific_outer,
            inner: node.inner,
            columns: columns,
            // ref_left: node.ref_left,
            ref_right: node.ref_right,
          });
        }
      });

      const operation = result.type;

      let createdTables, sourceTables;
      if (result.type === "create_view") {
        createdTables = [result.table.table];
        sourceTables = Object.keys(referencedTables).filter(
          x => x != result.table.table
        );
      } else {
        sourceTables = Object.keys(referencedTables);
      }

      const returnColumns = <FxHQLParser.ParsedResult['returnColumns']>[];
      if (result.type === "select") {
        if (result.selection && result.selection.columns) {
          result.selection.columns.forEach(column => {
            const sourceColumns = <FxHQLParser.ParsedResult['returnColumns'][any]['sourceColumns']>[];
            walk(column.expression, n => {
              if (n.type === "column") {
                sourceColumns.push(n);
                return false;
              }
              if (n.type === "identifier") {
                sourceColumns.push(n);
                return false;
              }
            });
            let name;
            if (column.alias) name = column.alias.value;
            else if (column.expression.type === "identifier")
              name = column.expression.value;
            else if (column.expression.type === "column")
              name = column.expression.name;
            else name = this.toSql(column.expression);

            let mappedTo;
            if (column.expression.type === "identifier") {
              mappedTo = { column: column.expression.value };
            } else if (column.expression.type === "column") {
              mappedTo = {
                column: column.expression.name,
                table: column.expression.table
              };
            }

            returnColumns.push({
              name: name,
              expression: column.expression,
              sourceColumns: sourceColumns,
              mappedTo
            });
          });
        }
      }

      const aliases = <{[k: string]: string}>{};
      allTableReferences.forEach(x => {
        if (x.alias) aliases[x.alias] = x.table;
        else aliases[x.table] = x.table;
      });

      return {
        referencedTables: Object.keys(referencedTables),
        aliases,
        createdTables: createdTables,
        sourceTables: sourceTables,
        operation: operation,
        parsed: result,
        joins: joins,
        returnColumns: returnColumns
      };
    }
  };
}

class HQLParser implements FxHQL.Parser {
  static singleton: HQLParser;
  _parser: FxHQL.Parser['_parser'] = null

  constructor (options = {}) {
    this._parser = parserDefinition(options);
  }

  get HQLParser () { return HQLParser }

  parse (sql: FxHQLTypeHelpers.FirstParameter<FxHQL.Parser['parse']>) {
    return this._parser.parse(sql);
  };

  toSql (parsed: FxHQLTypeHelpers.FirstParameter<FxHQL.Parser['toSql']>) {
    return this._parser.toSql(parsed);
  };
}

Object.defineProperty(HQLParser, 'singleton', {
  value: new HQLParser(),
  writable: false,
  configurable: false,
  enumerable: false
})

export = HQLParser.singleton;
