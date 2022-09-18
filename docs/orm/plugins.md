# ORM 插件

通过特定的钩子(hook), 插件可以对 orm 实例, model 对象, instance 进行定制.

## 定义一个简单的插件

```js
const { definePlugin } = require('@fxjs/orm');

const plugin = definePlugin((orm, options) => {
    return {
       beforeDefine (name, props, m_opts) {
        // process model definition before generate one model
       },
       define (model) {
        // process model defined
       }
    }
});
```