import util = require('util');

import Where = require("./Where");
import { ChainBuilderBase, get_table_alias } from './Helpers'

import { FxSqlQuery } from './Typo/Query';
import { FxSqlQueryChainBuilder } from './Typo/Query-ChainBuilder';
import { FxSqlQuerySql } from './Typo/Sql';
import { FxSqlQueryDialect } from './Typo/Dialect';
import { FxSqlQuerySubQuery } from './Typo/SubQuery';

export class RemoveQuery extends ChainBuilderBase implements FxSqlQueryChainBuilder.ChainBuilder__Remove {
	private sql: FxSqlQuerySql.SqlQueryChainDescriptor = {
		where : [],
		order : []
	};

	constructor(Dialect: FxSqlQueryDialect.Dialect, private opts: FxSqlQueryChainBuilder.ChainBuilderOptions) {
		super(Dialect);
	}

	from (table: string) {
		this.sql.table = table;
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
		var extraQuery: FxSqlQuerySql.SqlQueryStr[] = [];

		const sqlBuilder = this.Dialect.knex(this.sql.table)

		Where.build(sqlBuilder, this.Dialect, this.sql.where as FxSqlQuerySubQuery.SubQueryBuildDescriptor[], this.opts);

		sqlBuilder.del();

		const sqlList = [sqlBuilder.toQuery()];

		// order
		if (this.sql.order.length > 0) {
			// this.sql.order has been normalized
			const order = this.sql.order as FxSqlQuerySql.SqlOrderDescriptor[]
			const tmp: string[] = [];
			for (let i = 0; i < order.length; i++) {
				const col_desc = order[i].c;
				const zdir = order[i].d;

				if (Array.isArray(col_desc)) {
					tmp.push(this.Dialect.escapeId.apply(this.Dialect, col_desc) + " " + zdir);
				} else {
					tmp.push(this.Dialect.escapeId(col_desc) + " " + zdir);
				}
			}

			if (tmp.length > 0) {
				extraQuery.push("ORDER BY " + tmp.join(", "));
				sqlList.push(util.last(extraQuery));
			}
		}

		// limit for all Dialects but MSSQL
		if (!this.Dialect.limitAsTop) {
			if (this.sql.hasOwnProperty("limit")) {
				if (this.sql.hasOwnProperty("offset")) {
					extraQuery.push("LIMIT " + this.sql.limit + " OFFSET " + this.sql.offset);
				} else {
					extraQuery.push("LIMIT " + this.sql.limit);
				}

				sqlList.push(util.last(extraQuery))
			} else if (this.sql.hasOwnProperty("offset")) {
				extraQuery.push("OFFSET " + this.sql.offset);
				sqlBuilder.offset(this.sql.offset);

				sqlList.push(util.last(extraQuery))
			}
		// limit as: SELECT TOP n (MSSQL only)
		} else if (this.sql.hasOwnProperty("limit")) {
			sqlList[0].replace('delete from', `delete top ${this.sql.limit}`)
		}

		return sqlList.join(' ');
	}
	offset (offset: number) {
		this.sql.offset = offset;
		return this;
	}
	limit (limit: number) {
		this.sql.limit = limit;
		return this;
	}
	order (column: string | string[], dir: FxSqlQuery.QueryOrderDirection) {
		this.sql.order.push({
			c : Array.isArray(column) ? [ get_table_alias(this.sql, column[0]), column[1] ] : column,
			d : (dir == "Z" ? "DESC" : "ASC")
		});
		return this;
	}
}
