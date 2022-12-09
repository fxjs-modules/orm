import { ChainBuilderBase, escapeValForKnex } from "./Helpers";
import { FxSqlQueryDialect } from "./Typo/Dialect";
import { FxSqlQuerySql } from "./Typo/Sql";
import { FxSqlQueryChainBuilder } from "./Typo/Query-ChainBuilder";

export class InsertQuery extends ChainBuilderBase implements FxSqlQueryChainBuilder.ChainBuilder__Insert {
	private sql: FxSqlQuerySql.SqlQueryChainDescriptor = {};

	constructor(Dialect: FxSqlQueryDialect.Dialect, private opts: FxSqlQueryChainBuilder.ChainBuilderOptions) {
		super(Dialect);
	}

	into (table: string) {
		this.sql.table = table;
		return this;
	}
	set (values: FxSqlQuerySql.DataToSet) {
		this.sql.set = values;
		return this;
	}
	build () {
		const sqlBuilder = this.Dialect.knex(this.sql.table);
		const col_vals = <{[k: string]: any}>{};

		if (this.sql.hasOwnProperty("set")) {
			let val = null;
			for (let k in this.sql.set) {
				val = escapeValForKnex(this.sql.set[k], this.Dialect, this.opts);;

				col_vals[k] = val;
			}

			sqlBuilder.insert(col_vals)
		}

		return sqlBuilder.toQuery();
	}
}
