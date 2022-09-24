import { escapeValForKnex } from './Helpers';
import { FxSqlQueryDialect } from './Typo/Dialect';
import { FxSqlQueryChainBuilder } from './Typo/Query-ChainBuilder';
import { FxSqlQuerySql } from './Typo/Sql';

export function build (
	knexQueryBuilder: import("@fxjs/knex").Knex.QueryBuilder,
	Dialect: FxSqlQueryDialect.Dialect,
	set: FxSqlQuerySql.DataToSet,
	opts: FxSqlQueryChainBuilder.ChainBuilderOptions
): void {
	opts = opts || {};

	if (!set || set.length === 0) {
		return ;
	}

	const safeSet: typeof set = {};

	for (let k in set) {
		safeSet[k] = escapeValForKnex(set[k], Dialect, opts)
	}

	knexQueryBuilder.update(safeSet);
};
