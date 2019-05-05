/// <reference path="../@types/index.d.ts" />

import { Queue } from './Queue';
import util  = require('util')
import { syncObject, syncifyFunc, logJson } from './Utils';
import Dialects = require('./Dialects')

const noOp: Function = () => {};

export const dialect: FxOrmSqlDDLSync.ExportModule['dialect'] = function (name) {
	if (!Dialects[name])
		throw `no dialect with name '${name}'`
	return Dialects[name];
}

export class Sync<
	DRIVER_QUERY_TYPE extends FxOrmSqlDDLSync__Query.BasicDriverQueryObject = any
> implements FxOrmSqlDDLSync.Sync {
	constructor (
		options: FxOrmSqlDDLSync.SyncOptions,
		private debug: Function = options.debug || noOp,
		private driver: FxOrmSqlDDLSync__Driver.Driver<DRIVER_QUERY_TYPE> = options.driver,
		private Dialect: FxOrmSqlDDLSync__Dialect.Dialect = dialect(driver.dialect),
		private suppressColumnDrop = options.suppressColumnDrop,
		private collections: FxOrmSqlDDLSync__Collection.Collection[] = [],
		/**
		 * @description customTypes
		 */
		private types = <FxOrmSqlDDLSync__Driver.CustomPropertyTypeHash>{},
		/**
		 * @description total changes count in this time `Sync`
		 * @deprecated
		 */
		private total_changes: number
	) {
		syncObject(this, ['sync'])
	}

	[sync_method: string]: any
	
	defineCollection (collection_name: string, properties: FxOrmSqlDDLSync__Collection.Collection['properties']): FxOrmSqlDDLSync.Sync {
		this.collections.push({
			name       : collection_name,
			properties : properties
		});
		return this;
	}
	defineType (type: string, proto: FxOrmSqlDDLSync__Driver.CustomPropertyType): FxOrmSqlDDLSync.Sync {
		this.types[type] = proto;
		return this;
	}

	sync (cb?: FxOrmSqlDDLSync.ExecutionCallback<FxOrmSqlDDLSync.SyncResult>): void {
		this.makeSyncIteration(false, cb)
	}
	forceSync (cb?: FxOrmSqlDDLSync.ExecutionCallback<FxOrmSqlDDLSync.SyncResult>): void {
		this.makeSyncIteration(true, cb)
	}

	private makeSyncIteration (force_sync: boolean = false, cb?: FxOrmSqlDDLSync.ExecutionCallback<FxOrmSqlDDLSync.SyncResult>): void {
		let i = 0;
		const processNext = () => {
			if (i >= this.collections.length) {
				return cb(null, {
					changes: this.total_changes
				});
			}

			const collection = this.collections[i++];

			try {
				syncifyFunc(
					this.processCollection,
					this
				)(collection, force_sync)
			} catch (err) {
				return cb(err)
			}

			processNext()
		};

		this.total_changes = 0;

		return processNext();
	}

	private processCollection (
		collection: FxOrmSqlDDLSync__Collection.Collection,
		force_sync: boolean,
		cb: FxOrmSqlDDLSync.ExecutionCallback<boolean>
	) {
		let has: boolean;
		let is_processed: boolean = false;
		try {
			has = syncifyFunc(
				this.Dialect.hasCollection,
				this.Dialect
			)(this.driver, collection.name)
		} catch (err) {
			return cb(err)
		}

		if (!has) {
			try {
				syncifyFunc(
					this.createCollection,
					this
				)(collection)

				is_processed = true;
			} catch (err) {
				return cb(err)
			}
		}

		if (!force_sync)
			// not process, callback `false`
			return cb(null, is_processed)

		let columns: FxOrmSqlDDLSync__Column.ColumnInfo[] = null
		try {
			columns = syncifyFunc(
				this.Dialect.getCollectionProperties,
				this.Dialect
			)(this.driver, collection.name)
		} catch (err) {
			return cb(err)
		}

		try {
			syncifyFunc(
				this.syncCollection,
				this
			)(collection, columns)
		} catch (err) {
			return cb(err)
		}

		// processed, callback `true`
		cb(null, true);

		// this.Dialect.hasCollection(this.driver, collection.name, (err, has) => {
		// 	if (err)
		// 		return cb(err);

		// 	if (!has)
		// 		return this.createCollection(collection, (err) => {
		// 			if (err) return cb(err);
		// 			return cb(null, true);
		// 		});
		// 	else
		// 		return cb(null, false);

		// 	// // I have concerns about the data integrity of the automatic sync process.
		// 	// // There has been lots of bugs and issues associated with it.
		// 	// this.Dialect.getCollectionProperties(
		// 	// 	this.driver,
		// 	// 	collection.name,
		// 	// 	(err, columns) => {
		// 	// 		if (err) {
		// 	// 			return cb(err);
		// 	// 		}

		// 	// 		return this.syncCollection(collection, columns, cb);
		// 	// 	}
		// 	// );
		// });
	}

	/**
	 * 
	 * @param collection collection relation to create 
	 * @callback cb 
	 */
	private createCollection (
		collection: FxOrmSqlDDLSync__Collection.Collection,
		cb: FxOrmSqlDDLSync.ExecutionCallback<void>
	) {
		const columns: string[] = [];
		const before: Function[]  = [];

		let keys: string[] = [];

		/**
		 * process all before-function before dao(createCollection),
		 * this make it hookable to col's creation 
		 */
		const nextBefore = () => {
			/* 1. dao(createCollection) */
			if (before.length === 0)
				return this.Dialect.createCollection(
					this.driver,
					collection.name, columns, keys,
					(err) => {
						if (err) return cb(err);
						return this.syncIndexes(collection.name, this.getCollectionIndexes(collection), cb);
					}
				);

			/* 2. or, do pre-process before dao(createCollection) */
			const next = before.shift();

			next(this.driver, (err: Error) => {
				if (err) {
					return cb(err);
				}

				return nextBefore();
			});
		};

		for (let k in collection.properties) {
			let prop: FxOrmSqlDDLSync__Column.Property,
				col: false | FxOrmSqlDDLSync__Column.OpResult__CreateColumn;

			prop = collection.properties[k];
			prop.mapsTo = prop.mapsTo || k;

			col = this.createColumn(collection.name, prop);

			if (col === false) {
				logJson('createCollection', prop);
				return cb(new Error(`Invalid type definition for property '${k}'.`));
			}

			if (prop.key) {
				keys.push(prop.mapsTo);
			}

			columns.push(col.value);

			if (col.before) {
				before.push(col.before);
			}
		}

		this.debug("Creating " + collection.name);

		if (typeof this.Dialect.processKeys == "function") {
			keys = this.Dialect.processKeys(keys);
		}

		this.total_changes += 1;

		return nextBefore();
	}

	/**
	 * @param collection table where column created
	 * @param prop column's property
	 */
	private createColumn (
		collection_name: FxOrmSqlDDLSync.TableName,
		prop: FxOrmSqlDDLSync__Column.Property
	): false | FxOrmSqlDDLSync__Column.OpResult__CreateColumn {
		let type: false | string | FxOrmSqlDDLSync__Column.OpResult__CreateColumn;

		/**
		 * get type, customTypes first
		 */
		if (this.types.hasOwnProperty(prop.type)) {
			type = this.types[prop.type].datastoreType(prop);
		} else { // fallback to driver's types
			type = this.Dialect.getType(collection_name, prop, this.driver);
		}

		if (!type)
			return false;
			
		if (typeof type == "string") {
			type = <FxOrmSqlDDLSync__Column.OpResult__CreateColumn>{ value : type };
		}

		if (prop.mapsTo === undefined) {
			console.log("undefined prop.mapsTo", prop, (new Error()).stack)
		}

		return {
			value  : this.driver.query.escapeId(prop.mapsTo) + " " + type.value,
			before : type.before
		};
	}

	private syncCollection (
		collection: FxOrmSqlDDLSync__Collection.Collection,
		// columns: FxOrmSqlDDLSync__Column.ColumnInfo[] | FxOrmSqlDDLSync__Column.ColumnInfoHash,
		columns: FxOrmSqlDDLSync__Column.ColumnInfoHash,
		cb: FxOrmSqlDDLSync.ExecutionCallback<void>
	) {
		const queue   = new Queue(cb);
		let last_k: string  = null;

		this.debug("Synchronizing " + collection.name);
		
		for (let k in collection.properties) {
			const prop = collection.properties[k];
			if (!columns.hasOwnProperty(k)) {
				const col = this.createColumn(collection.name, prop);

				if (col === false) {
					logJson('syncCollection', prop);
					return cb(new Error(`Invalid type definition for property '${k}'.`));
				}

				this.debug("Adding column " + collection.name + "." + k + ": " + col.value);

				this.total_changes += 1;

				if (col.before) {
					const _before = col.before.bind(col);
					queue.add(col, (col: FxOrmSqlDDLSync__Column.OpResult__CreateColumn, next) => {
						_before(this.driver, (err: Error) => {
							if (err) {
								return next(err);
							}
							return this.Dialect.addCollectionColumn(this.driver, collection.name, col.value, last_k, next);
						});
					});
				} else {
					queue.add((next) => {
						return this.Dialect.addCollectionColumn(this.driver, collection.name, (col as FxOrmSqlDDLSync__Column.OpResult__CreateColumn).value, last_k, next);
					});
				}
			} else if (this.driver.dialect !== 'sqlite' && this.needToSync(prop, columns[k])) {
				// var col = this.createColumn(collection.name, k/* prop */);
				const col = this.createColumn(collection.name, prop);

				if (col === false) {
					logJson('syncCollection', prop);
					return cb(new Error(`Invalid type definition for property '${k}'.`));
				}

				this.debug("Modifying column " + collection.name + "." + k + ": " + col.value);

				this.total_changes += 1;

				if (col.before) {
					const _before = col.before.bind(col);
					queue.add(col, (col: FxOrmSqlDDLSync__Column.OpResult__CreateColumn, next) => {
						_before(this.driver, (err: Error) => {
							if (err) {
								return next(err);
							}
							return this.Dialect.modifyCollectionColumn(this.driver, collection.name, col.value, next);
						});
					});
				} else {
					queue.add((next) => {
						return this.Dialect.modifyCollectionColumn(this.driver, collection.name, (col as FxOrmSqlDDLSync__Column.OpResult__CreateColumn).value, next);
					});
				}
			}

			last_k = k;
		}

        if ( !this.suppressColumnDrop ) {
            for (let k in columns) {
                if (!collection.properties.hasOwnProperty(k)) {
                    queue.add((next: FxOrmSqlDDLSync.ExecutionCallback<FxOrmSqlDDLSync.SyncResult>) => {
                        this.debug("Dropping column " + collection.name + "." + k);

                        this.total_changes += 1;

                        return this.Dialect.dropCollectionColumn(this.driver, collection.name, k, next);
                    });
                }
            }
        }

		var indexes = this.getCollectionIndexes(collection);

		if (indexes.length) {
			queue.add((next: FxOrmSqlDDLSync.ExecutionCallback<void>) => {
				return this.syncIndexes(collection.name, indexes, next);
			});
		}

		return queue.check();
	}

	/**
	 * @description compute system's index name by dialect type
	 * 
	 * @param collection collection to indexed
	 * @param prop column's property
	 */
	private getIndexName (
		collection: FxOrmSqlDDLSync__Collection.Collection, prop: FxOrmSqlDDLSync__Column.Property
	) {
		var post = prop.unique ? 'unique' : 'index';

		if (this.driver.dialect == 'sqlite') {
			return collection.name + '_' + prop.name + '_' + post;
		} else {
			return prop.name + '_' + post;
		}
	}

	/**
	 * 
	 * @param collection collection relation to find its indexes
	 */
	private getCollectionIndexes (
		collection: FxOrmSqlDDLSync__Collection.Collection
	): FxOrmSqlDDLSync__DbIndex.DbIndexInfo[] {
		let indexes: FxOrmSqlDDLSync__DbIndex.DbIndexInfo[] = [];
		let found: boolean,
			prop: FxOrmSqlDDLSync__Column.Property;

		for (let k in collection.properties) {
			prop = collection.properties[k];

			if (prop.unique) {
				let mixed_arr_unique: (string | true)[] = prop.unique as string[]
				if (!Array.isArray(prop.unique)) {
					mixed_arr_unique = [ prop.unique ];
				}

				for (let i = 0; i < mixed_arr_unique.length; i++) {
					if (mixed_arr_unique[i] === true) {
						indexes.push({
							name    : this.getIndexName(collection, prop),
							unique  : true,
							columns : [ k ]
						});
					} else {
						found = false;

						for (let j = 0; j < indexes.length; j++) {
							if (indexes[j].name == mixed_arr_unique[i]) {
								found = true;
								indexes[j].columns.push(k);
								break;
							}
						}

						if (!found) {
							indexes.push({
								name    : mixed_arr_unique[i] as string,
								unique  : true,
								columns : [ k ]
							});
						}
					}
				}
			}
			
			if (prop.index) {
				let mixed_arr_index: (string | true)[] = prop.index as string[]
				if (!Array.isArray(prop.index)) {
					mixed_arr_index = [ prop.index ];
				}

				for (let i = 0; i < mixed_arr_index.length; i++) {
					if (mixed_arr_index[i] === true) {
						indexes.push({
							name    : this.getIndexName(collection, prop),
							columns : [ k ]
						});
					} else {
						found = false;

						for (var j = 0; j < indexes.length; j++) {
							if (indexes[j].name == mixed_arr_index[i]) {
								found = true;
								indexes[j].columns.push(k);
								break;
							}
						}
						if (!found) {
							indexes.push({
								name    : mixed_arr_index[i] as string,
								columns : [ k ]
							});
						}
					}
				}
			}
		}

		if (typeof this.Dialect.convertIndexes == "function") {
			indexes = this.Dialect.convertIndexes(collection, indexes);
		}

		return indexes;
	}

	private syncIndexes (
		collection_name: string, indexes: FxOrmSqlDDLSync__DbIndex.DbIndexInfo[], cb: FxOrmSqlDDLSync.ExecutionCallback<void>
	) {
		if (indexes.length == 0) return cb(null);

		this.Dialect.getCollectionIndexes(this.driver, collection_name, (err: Error, db_indexes) => {
			if (err) return cb(err);

			var queue = new Queue<string|FxOrmSqlDDLSync__DbIndex.DbIndexInfo>(cb);

			for (let i = 0; i < indexes.length; i++) {
				if (!db_indexes.hasOwnProperty(indexes[i].name)) {
					this.debug("Adding index " + collection_name + "." + indexes[i].name + " (" + indexes[i].columns.join(", ") + ")");

					this.total_changes += 1;

					queue.add(indexes[i], (index: FxOrmSqlDDLSync__DbIndex.DbIndexInfo, next) => {
						return this.Dialect.addIndex(this.driver, index.name, index.unique, collection_name, index.columns, next);
					});
					continue;
				} else if (!db_indexes[indexes[i].name].unique != !indexes[i].unique) {
					this.debug("Replacing index " + collection_name + "." + indexes[i].name);

					this.total_changes += 1;

					queue.add(indexes[i], (index: FxOrmSqlDDLSync__DbIndex.DbIndexInfo, next) => {
						return this.Dialect.removeIndex(this.driver, index.name, collection_name, next);
					});
					queue.add(indexes[i], (index: FxOrmSqlDDLSync__DbIndex.DbIndexInfo, next) => {
						return this.Dialect.addIndex(this.driver, index.name, index.unique, collection_name, index.columns, next);
					});
				}
				delete db_indexes[indexes[i].name];
			}

			for (let idx in db_indexes) {
				this.debug("Removing index " + collection_name + "." + idx);

				this.total_changes += 1;

				queue.add(idx, (index_k: string, next) => {
					return this.Dialect.removeIndex(this.driver, collection_name, index_k, next);
				});
			}

			return queue.check();
		});
	}

	private needToSync (
		property: FxOrmSqlDDLSync__Column.Property,
		column: FxOrmSqlDDLSync__Column.ColumnInfo
	): boolean {
		if (property.serial && property.type == "number") {
			property.type = "serial";
		}
		if (property.type != column.type) {
			if (typeof this.Dialect.supportsType != "function") {
				return true;
			}
			if (this.Dialect.supportsType(property.type) != column.type) {
				return true;
			}
		}
		if (property.type == "serial") {
			return false; // serial columns have a fixed form, nothing more to check
		}
		if (property.required != column.required && !property.key) {
			return true;
		}
		if (property.hasOwnProperty("defaultValue") && property.defaultValue != column.defaultValue) {
			return true;
		}
		if (property.type == "number" || property.type == "integer") {
			if (column.hasOwnProperty("size") && (property.size || 4) != column.size) {
				return true;
			}
		}
		if (property.type == "enum" && column.type == "enum") {
			if (util.difference(property.values, column.values).length > 0
			|| util.difference(column.values, property.values).length > 0) {
				return true;
			}
		}

		return false;
	}
}
