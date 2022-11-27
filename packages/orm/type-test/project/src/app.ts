import { expectType } from 'ts-expect';

import * as ORM from '@src';

import { UserDef } from './defs';

const orm = ORM.connect('sqlite://:memory:');

UserDef(orm);

expectType<ReturnType<typeof UserDef>['User']>(orm.models.users);
expectType<ReturnType<typeof UserDef>['Role']>(orm.models.role);

const user = new orm.models.users();

expectType<string>(user.name);
expectType<string>(user.getName());
expectType<number>(user.age);
expectType<number>(user.getAge());

const role = new orm.models.role();
expectType<'admin' | 'visitor'>(role.permissions);
expectType<'admin' | 'visitor'>(role.getPermission());