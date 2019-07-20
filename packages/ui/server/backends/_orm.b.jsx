exports.defs = function defs (orm) {
    orm.define('person', {
        firstName: String,
        lastName: String,
        email: String,
        email2: String
    }, {
        methods: {
            fulleName () {
                return this.firstName + this.lastName
            }
        }
    });
}