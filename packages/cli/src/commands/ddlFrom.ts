import fs = require('fs');
import path = require('path');
import coroutine = require('coroutine');
import { wrapSubcommand } from '@fibcli/make-cli';

import { Driver } from '@fxjs/db-driver';
import { Sync } from '@fxjs/sql-ddl-sync';
import { getAllTableNames, getTableDDLs } from '../helpers/ddl';

export default wrapSubcommand({
    name: 'ddlFrom',

    aliases: [
        'ddlfrom'
    ],

    inputs: {
        required: '<connection>',
        optional: [
            '[tableName]'
        ]
    },

    examples: [
        'orm ddlFrom mysql://root:@localhost:3306/test',
    ],

    options: {
        '-P, --pool [pool]': 'whether use connection pool or not',
        '-O, --out [outPath]': 'path to output json file',
    },

    description: `read columns information from database, and generate ddl file`,

    onAction: ([connection, [tableName]], options) => {
        const driver = Driver.create(connection);
        const sync = new Sync({ dbdriver: driver });

        let outJson: string = '';
        if (options.out) {
            if ((options.out as any) === true) {
                outJson = `./${driver.type}-${
                    driver.config.database.replace(/[\.|\/]/g, '_')
                }.json`;
            } else if (typeof options.out === 'string') {
                outJson = options.out;
            }
            
            if (outJson) {
                outJson = path.resolve(process.cwd(), outJson);
            }
        }

        let tableNames = [] as string[];
        if (tableName) {
            if (!sync.Dialect.hasCollectionSync(driver, tableName))
                throw new Error(`[ddlFrom] table ${tableName} doen't exist!`);

            tableNames = [tableName];
        } else {
            switch (driver.type) {
                case 'psql':
                case 'mysql':
                case 'sqlite':
                    tableNames = getAllTableNames(driver);
                    break;
                default:
                    if (!tableName) {
                        throw new Error('[ddlFrom] tableName is required!')
                    }
                    tableNames = [tableName];
            }
        }

        const tableDDLs = getTableDDLs(sync, { tableNames });

        if (outJson) {
            console.notice(`[ddlFrom] try to write to ${outJson}...`);
            fs.mkdir(path.dirname(outJson), { recursive: true });
            fs.writeFile(outJson, JSON.stringify(tableDDLs, null, 2) as any);
            console.notice(`[ddlFrom] write json to ${outJson} success!`);
        } else {
            console.log('[ddlFrom] tableDDLs:');
            console.log(JSON.stringify(tableDDLs, null, 2));
        }
    }
});