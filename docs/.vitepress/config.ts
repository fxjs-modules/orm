import markdownItTaskCheckbox from 'markdown-it-task-checkbox';
import { defineConfig } from 'vitepress';

var isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
    title: 'FxJS ORM',
    description: '最好用的 FibJS ORM 框架',
    lang: 'zh-CN',
    base: isDev ? '/' : '/orm/',

    markdown: {
        lineNumbers: false,
        toc: { includeLevel: [1, 2] },
        config: (md) => {
            // use more markdown-it plugins!
            md.use(markdownItTaskCheckbox, {
                disabled: true,
                divWrap: false,
                divClass: 'checkbox',
                idPrefix: 'cbx_',
                ulClass: 'task-list',
                liClass: 'task-list-item'
            });
        }
    },

    themeConfig: {
        repo: 'fxjs-modules/orm',
        docsDir: 'docs',
        docsBranch: 'master',
        editLinks: true,
        editLinkText: '在 Github 上编辑此页',
        lastUpdated: '最近更新',

        nav: [
            {
                text: 'ORM', link: '/orm/getting-started', activeMatch: '^/orm'
            },
            {
                text: 'CLI',
                link: '/clis/orm',
                activeMatch: '^/clis/',
                // children: [
                //     {
                //         text: 'ORM', link: '/clis/orm'
                //     }
                // ]
            },
            // {
            //     text: 'Github',
            //     link: 'https://g.hz.netease.com/fxjs-modules/orm/-/tree/master/orm-docs'
            // }
        ],

        sidebar: {
            '/clis/': getCliSidebars(),
            // '/rfcs': [],
            '/': getOrmSidebar()
        }
    },
});

function getOrmSidebar() {
    return [
        { text: '开始连接', link: '/orm/getting-started', children: [
            { text: 'Property', link: '/orm/property' },
            { text: '虚拟视图', link: '/orm/virtual-view' },
            { text: 'ORM 插件', link: '/orm/plugins' },
        ] },
        { text: 'Packages', link: '/orm-packages/', children: [
            { text: 'orm-core', link: '/orm-packages/orm-core' },
            { text: 'orm-property', link: '/orm-packages/orm-property' },
            { text: 'db-driver', link: '/orm-packages/db-driver' },
            { text: 'knex', link: '/orm-packages/knex' },
            { text: 'sql-query', link: '/orm-packages/sql-query' },
            { text: 'sql-ddl-sync', link: '/orm-packages/sql-ddl-sync' },
        ] },
    ]
}

function getCliSidebars() {
    return [
        {
            text: 'ORM-CLI',
            link: '/clis/orm'
        },
    ]
}