import * as ORM from '@src';

const UserDef = ORM.defineModel((orm) => {
    const User = orm.define('users', {
        name: String,
        age: Number,
    }, {
        methods: {
            getAge() {
                return this.age;
            },
            getName() {
                return this.name;
            }
        }
    });
    
    const Role = orm.define('role', {
        name: String,
        permissions: [
            'admin' as const,
            'visitor' as const
        ],
    }, {
        methods: {
            getPermission() {
                return this.permissions;
            }
        }
    });

    return { User, Role };
});

export default UserDef;

type Defs = ReturnType<typeof UserDef>;

declare module '@fxjs/orm' {
    export namespace FxOrmNS {
        export interface GlobalModels {
            users: Defs['User'];
            role: Defs['Role'];
        }
    }
}