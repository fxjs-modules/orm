import{u as y,w as F,N as g}from"./app.55edfddd.js";import{u as m,n as i,D as o,z as a,G as s,A as _,H as n,B as l,K as x,_ as v,M as I,N as L,T as b,O as d,P as k}from"./plugin-vue_export-helper.7e16fb6c.js";const A={key:0,class:"home-hero"},B={key:0,class:"figure"},N=["src","alt"],C={key:1,id:"main-title",class:"title"},w={key:2,class:"tagline"},D=m({__name:"HomeHero",setup(h){const{site:t,frontmatter:e}=y(),c=i(()=>{const{heroImage:r,heroText:u,tagline:H,actionLink:$,actionText:T}=e.value;return r||u||H||$&&T}),p=i(()=>e.value.heroText||t.value.title),f=i(()=>e.value.tagline||t.value.description);return(r,u)=>c.value?(o(),a("header",A,[s(e).heroImage?(o(),a("figure",B,[_("img",{class:"image",src:s(F)(s(e).heroImage),alt:s(e).heroAlt},null,8,N)])):n("",!0),p.value?(o(),a("h1",C,l(p.value),1)):n("",!0),f.value?(o(),a("p",w,l(f.value),1)):n("",!0),s(e).actionLink&&s(e).actionText?(o(),x(g,{key:3,item:{link:s(e).actionLink,text:s(e).actionText},class:"action"},null,8,["item"])):n("",!0),s(e).altActionLink&&s(e).altActionText?(o(),x(g,{key:4,item:{link:s(e).altActionLink,text:s(e).altActionText},class:"action alt"},null,8,["item"])):n("",!0)])):n("",!0)}});var V=v(D,[["__scopeId","data-v-5d8b683d"]]);const S={key:0,class:"home-features"},z={class:"wrapper"},E={class:"container"},G={class:"features"},K={key:0,class:"title"},M={key:1,class:"details"},O=m({__name:"HomeFeatures",setup(h){const{frontmatter:t}=y(),e=i(()=>t.value.features&&t.value.features.length>0),c=i(()=>t.value.features?t.value.features:[]);return(p,f)=>e.value?(o(),a("div",S,[_("div",z,[_("div",E,[_("div",G,[(o(!0),a(I,null,L(c.value,(r,u)=>(o(),a("section",{key:u,class:"feature"},[r.title?(o(),a("h2",K,l(r.title),1)):n("",!0),r.details?(o(),a("p",M,l(r.details),1)):n("",!0)]))),128))])])])])):n("",!0)}});var P=v(O,[["__scopeId","data-v-245bde66"]]);const j={key:0,class:"footer"},q={class:"container"},J={class:"text"},Q=m({__name:"HomeFooter",setup(h){const{frontmatter:t}=y();return(e,c)=>s(t).footer?(o(),a("footer",j,[_("div",q,[_("p",J,l(s(t).footer),1)])])):n("",!0)}});var R=v(Q,[["__scopeId","data-v-bff49316"]]);const U={class:"home","aria-labelledby":"main-title"},W={class:"home-content"},X=m({__name:"Home",setup(h){return(t,e)=>{const c=b("Content");return o(),a("main",U,[d(V),k(t.$slots,"hero",{},void 0,!0),d(P),_("div",W,[d(c)]),k(t.$slots,"features",{},void 0,!0),d(R),k(t.$slots,"footer",{},void 0,!0)])}}});var ee=v(X,[["__scopeId","data-v-8382b818"]]);export{ee as default};