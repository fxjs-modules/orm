# 虚拟视图 <Badge type="warning">WIP</Badge>

ORM 中的 model 可以是虚拟视图，也就是说，它不是真实的数据表，而是一个虚拟的数据表，它可以通过一个特定的方式来获取真实的数据表.

```js
var User = db.define('user', {
    name: String
});

var Role = db.define('role', {
    name: String
});

User.hasOne('role', Role, { autoFetch: true });

var VirutalView = db.defineVirtual('user_views', {
    user_name: String,
    role_id: Number,
    role_name: String,
}, {
    virtual: {
        onView: (models) => {
            const users = models.user.findSync();

            return users.map(user => {
                return {
                    user_name: user.name,
                    role_id: role.id,
                    role_name: role.name
                };
            });
        },
        // onUpdate: undefined,
        // onRemove: undefined,
        // onAdd: undefined,
    }
});

VirutalView.oneSync();
```

目前, ORM 视图仅支持定制「读取」操作, 在未来的迭代中, 我们会逐步开放更多的操作, 包括:

- 创建
- 更新
- 删除