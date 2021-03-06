import util = require("util");
import tty  = require("tty");

import { FxOrmDMLDriver } from "./Typo/DMLDriver";

export function sql (driver: FxOrmDMLDriver.DMLDriver, sql: string) {
	var fmt: string;

	if (tty.isatty(process.stdout.fd)) {
		fmt = "\033[32;1m(orm/%s) \033[34m%s\033[0m\n";
		sql = sql.replace(/`(.+?)`/g, function (m) { return "\033[31m" + m + "\033[34m"; });
	} else {
		fmt = "[SQL/%s] %s\n";
	}

	process.stdout.write(
		util.format(fmt, driver, sql) as any
	);
};
