import { FxOrmInstance } from '../Typo/instance';
import { FxOrmModel } from '../Typo/model';
/**
 * filter the Date-Type SelectQuery Property corresponding item when call find-like executor ('find', 'get', 'where')
 * @TODO add test about i
 *
 * @param conds
 */
export declare function filterDate(conds: FxOrmInstance.InstanceDataPayload, m: {
    properties: FxOrmModel.Model['allProperties'];
}): void;
