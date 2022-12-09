import UpdateSet   	= require("./Set");
import Where 		= require("./Where");

import { FxSqlQuerySql } from "./Typo/Sql";
import { FxSqlQuery } from "./Typo/Query";
import { FxSqlQueryDialect } from "./Typo/Dialect";
import { FxSqlQuerySubQuery } from "./Typo/SubQuery";
import { FxSqlQueryChainBuilder } from "./Typo/Query-ChainBuilder";
import { ChainBuilderBase } from "./Helpers";

export class UpdateQuery extends ChainBuilderBase implements FxSqlQueryChainBuilder.ChainBuilder__Update {
	private sql: FxSqlQuerySql.SqlQueryChainDescriptor = {
		where : []
	};

	constructor(Dialect: FxSqlQueryDialect.Dialect, private opts: FxSqlQuery.QueryOptions) {
		super(Dialect)
	}

	into(table: string) {
		this.sql.table = table;
		return this;
	}
	set (values: FxSqlQuerySql.DataToSet) {
		this.sql.set = values;
		return this;
	}
	where (...whereConditions: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'][]) {
		for (let i = 0; i < whereConditions.length; i++) {
			this.sql.where.push({
				table: null,
				wheres: whereConditions[i]
			});
		}
		return this;
	}
	build () {
		const sqlBuilder = this.Dialect.knex(this.sql.table)

		UpdateSet.build(sqlBuilder, this.Dialect, this.sql.set, this.opts)
		Where.build(sqlBuilder, this.Dialect, this.sql.where, this.opts)

		return sqlBuilder.toQuery();
	}
}
