import{_ as t,y as p,D as s,O as o,V as e,B as n,X as c,T as l,x as u}from"./plugin-vue_export-helper.b4fda088.js";const b='{"title":"\u865A\u62DF\u89C6\u56FE","description":"","frontmatter":{},"headers":[],"relativePath":"orm/virtual-view.md","lastUpdated":1664028974501}',r={},i={id:"\u865A\u62DF\u89C6\u56FE-wip",tabindex:"-1"},k=n("\u865A\u62DF\u89C6\u56FE "),d=n("WIP"),_=n(),m=s("a",{class:"header-anchor",href:"#\u865A\u62DF\u89C6\u56FE-wip","aria-hidden":"true"},"#",-1),y=c(`<p>ORM \u4E2D\u7684 model \u53EF\u4EE5\u662F\u865A\u62DF\u89C6\u56FE\uFF0C\u4E5F\u5C31\u662F\u8BF4\uFF0C\u5B83\u4E0D\u662F\u771F\u5B9E\u7684\u6570\u636E\u8868\uFF0C\u800C\u662F\u4E00\u4E2A\u865A\u62DF\u7684\u6570\u636E\u8868\uFF0C\u5B83\u53EF\u4EE5\u901A\u8FC7\u4E00\u4E2A\u7279\u5B9A\u7684\u65B9\u5F0F\u6765\u83B7\u53D6\u771F\u5B9E\u7684\u6570\u636E\u8868.</p><div class="language-js"><pre><code><span class="token keyword">var</span> User <span class="token operator">=</span> db<span class="token punctuation">.</span><span class="token function">define</span><span class="token punctuation">(</span><span class="token string">&#39;user&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
    <span class="token literal-property property">name</span><span class="token operator">:</span> String
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> Role <span class="token operator">=</span> db<span class="token punctuation">.</span><span class="token function">define</span><span class="token punctuation">(</span><span class="token string">&#39;role&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
    <span class="token literal-property property">name</span><span class="token operator">:</span> String
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

User<span class="token punctuation">.</span><span class="token function">hasOne</span><span class="token punctuation">(</span><span class="token string">&#39;role&#39;</span><span class="token punctuation">,</span> Role<span class="token punctuation">,</span> <span class="token punctuation">{</span> <span class="token literal-property property">autoFetch</span><span class="token operator">:</span> <span class="token boolean">true</span> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> VirutalView <span class="token operator">=</span> db<span class="token punctuation">.</span><span class="token function">defineVirtual</span><span class="token punctuation">(</span><span class="token string">&#39;user_views&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
    <span class="token literal-property property">user_name</span><span class="token operator">:</span> String<span class="token punctuation">,</span>
    <span class="token literal-property property">role_id</span><span class="token operator">:</span> Number<span class="token punctuation">,</span>
    <span class="token literal-property property">role_name</span><span class="token operator">:</span> String<span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
    <span class="token literal-property property">virtual</span><span class="token operator">:</span> <span class="token punctuation">{</span>
        <span class="token function-variable function">onView</span><span class="token operator">:</span> <span class="token punctuation">(</span><span class="token parameter">models</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">const</span> users <span class="token operator">=</span> models<span class="token punctuation">.</span>user<span class="token punctuation">.</span><span class="token function">findSync</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

            <span class="token keyword">return</span> users<span class="token punctuation">.</span><span class="token function">map</span><span class="token punctuation">(</span><span class="token parameter">user</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
                <span class="token keyword">return</span> <span class="token punctuation">{</span>
                    <span class="token literal-property property">user_name</span><span class="token operator">:</span> user<span class="token punctuation">.</span>name<span class="token punctuation">,</span>
                    <span class="token literal-property property">role_id</span><span class="token operator">:</span> role<span class="token punctuation">.</span>id<span class="token punctuation">,</span>
                    <span class="token literal-property property">role_name</span><span class="token operator">:</span> role<span class="token punctuation">.</span>name
                <span class="token punctuation">}</span><span class="token punctuation">;</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">,</span>
        <span class="token comment">// onUpdate: undefined,</span>
        <span class="token comment">// onRemove: undefined,</span>
        <span class="token comment">// onAdd: undefined,</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

VirutalView<span class="token punctuation">.</span><span class="token function">oneSync</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre></div><p>\u76EE\u524D, ORM \u89C6\u56FE\u4EC5\u652F\u6301\u5B9A\u5236\u300C\u8BFB\u53D6\u300D\u64CD\u4F5C, \u5728\u672A\u6765\u7684\u8FED\u4EE3\u4E2D, \u6211\u4EEC\u4F1A\u9010\u6B65\u5F00\u653E\u66F4\u591A\u7684\u64CD\u4F5C, \u5305\u62EC:</p><ul><li>\u521B\u5EFA</li><li>\u66F4\u65B0</li><li>\u5220\u9664</li></ul>`,4);function f(h,g,v,w,V,S){const a=l("Badge");return u(),p("div",null,[s("h1",i,[k,o(a,{type:"warning"},{default:e(()=>[d]),_:1}),_,m]),y])}var x=t(r,[["render",f]]);export{b as __pageData,x as default};
