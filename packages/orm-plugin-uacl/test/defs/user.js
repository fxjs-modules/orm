module.exports = (orm) => {
    orm.define('user', {
        name: String
    }, {
        uaclHooks: {
            beforeQuery () {
                
            }
        }
    })
}