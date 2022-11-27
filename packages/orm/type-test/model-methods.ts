import { expectType } from 'ts-expect';

import * as ORM from '../src';

const orm = ORM.connect('sqlite://:memory:');

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

const user = new User();

expectType<number>(user.getAge());
expectType<string>(user.getName());