import{_ as n,y as a,x as s,X as t}from"./plugin-vue_export-helper.72096a39.js";const m='{"title":"Adapters","description":"","frontmatter":{},"headers":[],"relativePath":"orm/Adapters.md","lastUpdated":1664563107222}',e={},p=t(`<h1 id="adapters" tabindex="-1">Adapters <a class="header-anchor" href="#adapters" aria-hidden="true">#</a></h1><p>ORM \u5185\u7F6E\u4E86\u5BF9\u90E8\u5206\u6570\u636E\u5E93\u7684\u652F\u6301. \u800C\u901A\u8FC7\u63D0\u4F9B\u4E00\u4E2A\u9002\u914D\u5668, \u53EF\u4EE5\u8BA9 ORM \u5728\u4E0D\u540C\u7684\u6570\u636E\u5E93\u4E0A\u8FD0\u884C.</p><div class="language-js"><pre><code><span class="token function">require</span><span class="token punctuation">(</span><span class="token string">&#39;@fxjs/orm&#39;</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">addAdapter</span><span class="token punctuation">(</span><span class="token string">&#39;customdb&#39;</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  <span class="token comment">// ...</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre></div><p>\u9002\u914D\u5668\u7684\u63A5\u53E3\u5982\u4E0B:</p><div class="language-ts"><pre><code><span class="token keyword">interface</span> <span class="token class-name">IAdatper</span> <span class="token punctuation">{</span>
  <span class="token comment">/**
   * @description protocol when connecting to database, e.g. &#39;customdb&#39;
   */</span>
  protocol<span class="token operator">:</span> <span class="token builtin">string</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre></div>`,5),o=[p];function c(r,i,d,l,u,_){return s(),a("div",null,o)}var f=n(e,[["render",c]]);export{m as __pageData,f as default};
