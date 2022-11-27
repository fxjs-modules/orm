/// <reference lib="es2017" />
import { FxOrmModel } from './Typo/model';
import { FxOrmInstance } from './Typo/instance';
import { FxOrmCommon } from './Typo/_common';
import { FxOrmQuery } from './Typo/query';
export declare const Model: new (opts: FxOrmModel.ModelDefineOptions) => FxOrmModel.Model;
export declare function listFindByChainOrRunSync<T = any>(model: FxOrmModel.Model, self_conditions: FxOrmModel.ModelQueryConditions__Find, by_list: FxOrmModel.ModelFindByDescriptorItem[], self_options: FxOrmModel.ModelOptions__Find, opts: FxOrmCommon.SyncCallbackInputArags): FxOrmQuery.IChainFind | (FxOrmInstance.Instance[]);
