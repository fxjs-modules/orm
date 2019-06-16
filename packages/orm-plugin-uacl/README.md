
## orm-plugin-uacl

### ACL - Grant

```javascript
const [ p, stage, task, member ] = chain

const chainName = unifyChain(chain)
/**
 * Grant.createSync({
 *      // unified access control id
 *      uaci: `uaci://project/1/stages/0/tasks/8/members/7`,
 *      action: 'read', // basic CRUD | wildcard | custom
 *      value: true, // field
 * })
 */
orm.$grant.set(chainName/* chain */, 'read', true)
orm.$grant.set(chainName/* chain */, 'write', false) // would never store, because defualtValue is just false
orm.$grant.set(chainName/* chain */, 'delete', false) // would never store, because defualtValue is just false
orm.$grant.set(chainName/* chain */, 'find', true)
orm.$grant.set(chainName/* chain */, '*', true)
orm.$grant.set(chainName/* chain */, 'custom', true)

orm.$grant.get(chainName/* chain */, 'read')
orm.$grant.get(chainName/* chain */, 'write')
orm.$grant.get(chainName/* chain */, 'delete')
orm.$grant.get(chainName/* chain */, 'find')
orm.$grant.get(chainName/* chain */, '*')
orm.$grant.get(chainName/* chain */, 'custom')

// delete all grant of this uaci
orm.$grant.delete(chainName)
orm.$grant.delete(chainName/* chain */, 'find')
```

```javascript
define('project', {}, {
    ievents: {
        'after:addStages' (this) {
            process.nextTick(() => {
                ORM.pool
            })
            coroutine.parallel(this.stages, (stage => {
                // this.$grant.set([ this, stage ], 'read', true)
                orm.$grant([this, stage, stage.getOwnerSync()], read, true);
            });
        }
    }
})

```