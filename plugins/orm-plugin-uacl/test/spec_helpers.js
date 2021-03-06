exports.check_handler = ([ [user, action, entity, fields, prefix = ''], result ]) => {
    /**
     * when `.can` called, only local data would be used to judge if child could access entity
     */
    assert.equal(
        entity.$uacl({ uid: user.id })
            .can(action, entity.$getUacis({ prefix }).object, fields),
        result
    )
}

exports.check_handler2 = ([ [entity_tree, action, entity, fields, prefix = ''], result ]) => {
    /**
     * when `.can` called, only local data would be used to judge if child could access entity
     */
    assert.equal(
        entity_tree
            .can(action, entity.$getUacis({ prefix }).object, fields),
        result
    )
}