import{i as F,c as ot,e as rt,a as at,b as it,d as ct,f as Ne,h as Re,g as lt,j as ut,k as Te,l as dt,m as pt,n as ft,s as _t,o as _,p as Ie,r as Be,q as J,u as ht,w as mt,v,x as I,y as B,z as H,A as f,B as p,C as x,D as M,E as d,F as ne,G as se,H as u,I as k,J as z,_ as w,K as Me,L as A,M as Oe,N as V,O as oe,P as b,Q as $,R as D,S as vt,T as He,U as ee,V as gt,W as N,X as bt}from"./plugin-vue_export-helper.fe91f02a.js";const $t="modulepreload",ue={},kt="/orm/",De=function(t,n){return!n||n.length===0?t():Promise.all(n.map(s=>{if(s=`${kt}${s}`,s in ue)return;ue[s]=!0;const o=s.endsWith(".css"),a=o?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${s}"]${a}`))return;const r=document.createElement("link");if(r.rel=o?"stylesheet":$t,o||(r.as="script",r.crossOrigin=""),r.href=s,document.head.appendChild(r),o)return new Promise((i,l)=>{r.addEventListener("load",i),r.addEventListener("error",()=>l(new Error(`Unable to preload CSS for ${s}`)))})})).then(()=>t())};/**
* @vue/runtime-dom v3.4.31
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/const wt="http://www.w3.org/2000/svg",yt="http://www.w3.org/1998/Math/MathML",P=typeof document!="undefined"?document:null,de=P&&P.createElement("template"),St={insert:(e,t,n)=>{t.insertBefore(e,n||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,n,s)=>{const o=t==="svg"?P.createElementNS(wt,e):t==="mathml"?P.createElementNS(yt,e):n?P.createElement(e,{is:n}):P.createElement(e);return e==="select"&&s&&s.multiple!=null&&o.setAttribute("multiple",s.multiple),o},createText:e=>P.createTextNode(e),createComment:e=>P.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>P.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},insertStaticContent(e,t,n,s,o,a){const r=n?n.previousSibling:t.lastChild;if(o&&(o===a||o.nextSibling))for(;t.insertBefore(o.cloneNode(!0),n),!(o===a||!(o=o.nextSibling)););else{de.innerHTML=s==="svg"?`<svg>${e}</svg>`:s==="mathml"?`<math>${e}</math>`:e;const i=de.content;if(s==="svg"||s==="mathml"){const l=i.firstChild;for(;l.firstChild;)i.appendChild(l.firstChild);i.removeChild(l)}t.insertBefore(i,n)}return[r?r.nextSibling:t.firstChild,n?n.previousSibling:t.lastChild]}},Lt=Symbol("_vtc");function xt(e,t,n){const s=e[Lt];s&&(t=(t?[t,...s]:[...s]).join(" ")),t==null?e.removeAttribute("class"):n?e.setAttribute("class",t):e.className=t}const pe=Symbol("_vod"),Ct=Symbol("_vsh"),Et=Symbol(""),At=/(^|;)\s*display\s*:/;function Pt(e,t,n){const s=e.style,o=F(n);let a=!1;if(n&&!o){if(t)if(F(t))for(const r of t.split(";")){const i=r.slice(0,r.indexOf(":")).trim();n[i]==null&&q(s,i,"")}else for(const r in t)n[r]==null&&q(s,r,"");for(const r in n)r==="display"&&(a=!0),q(s,r,n[r])}else if(o){if(t!==n){const r=s[Et];r&&(n+=";"+r),s.cssText=n,a=At.test(n)}}else t&&e.removeAttribute("style");pe in e&&(e[pe]=a?s.display:"",e[Ct]&&(s.display="none"))}const fe=/\s*!important$/;function q(e,t,n){if(Ne(n))n.forEach(s=>q(e,t,s));else if(n==null&&(n=""),t.startsWith("--"))e.setProperty(t,n);else{const s=Nt(e,t);fe.test(n)?e.setProperty(Re(s),n.replace(fe,""),"important"):e[s]=n}}const _e=["Webkit","Moz","ms"],X={};function Nt(e,t){const n=X[t];if(n)return n;let s=lt(t);if(s!=="filter"&&s in e)return X[t]=s;s=ut(s);for(let o=0;o<_e.length;o++){const a=_e[o]+s;if(a in e)return X[t]=a}return t}const he="http://www.w3.org/1999/xlink";function me(e,t,n,s,o,a=pt(t)){s&&t.startsWith("xlink:")?n==null?e.removeAttributeNS(he,t.slice(6,t.length)):e.setAttributeNS(he,t,n):n==null||a&&!Te(n)?e.removeAttribute(t):e.setAttribute(t,a?"":dt(n)?String(n):n)}function Rt(e,t,n,s,o,a,r){if(t==="innerHTML"||t==="textContent"){s&&r(s,o,a),e[t]=n==null?"":n;return}const i=e.tagName;if(t==="value"&&i!=="PROGRESS"&&!i.includes("-")){const c=i==="OPTION"?e.getAttribute("value")||"":e.value,h=n==null?"":String(n);(c!==h||!("_value"in e))&&(e.value=h),n==null&&e.removeAttribute(t),e._value=n;return}let l=!1;if(n===""||n==null){const c=typeof e[t];c==="boolean"?n=Te(n):n==null&&c==="string"?(n="",l=!0):c==="number"&&(n=0,l=!0)}try{e[t]=n}catch{}l&&e.removeAttribute(t)}function Tt(e,t,n,s){e.addEventListener(t,n,s)}function It(e,t,n,s){e.removeEventListener(t,n,s)}const ve=Symbol("_vei");function Bt(e,t,n,s,o=null){const a=e[ve]||(e[ve]={}),r=a[t];if(s&&r)r.value=s;else{const[i,l]=Mt(t);if(s){const c=a[t]=Dt(s,o);Tt(e,i,c,l)}else r&&(It(e,i,r,l),a[t]=void 0)}}const ge=/(?:Once|Passive|Capture)$/;function Mt(e){let t;if(ge.test(e)){t={};let s;for(;s=e.match(ge);)e=e.slice(0,e.length-s[0].length),t[s[0].toLowerCase()]=!0}return[e[2]===":"?e.slice(3):Re(e.slice(2)),t]}let Y=0;const Ot=Promise.resolve(),Ht=()=>Y||(Ot.then(()=>Y=0),Y=Date.now());function Dt(e,t){const n=s=>{if(!s._vts)s._vts=Date.now();else if(s._vts<=n.attached)return;ft(Ut(s,n.value),t,5,[s])};return n.value=e,n.attached=Ht(),n}function Ut(e,t){if(Ne(t)){const n=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{n.call(e),e._stopped=!0},t.map(s=>o=>!o._stopped&&s&&s(o))}else return t}const be=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&e.charCodeAt(2)>96&&e.charCodeAt(2)<123,qt=(e,t,n,s,o,a,r,i,l)=>{const c=o==="svg";t==="class"?xt(e,s,c):t==="style"?Pt(e,n,s):at(t)?it(t)||Bt(e,t,n,s,r):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):Ft(e,t,s,c))?(Rt(e,t,s,a,r,i,l),!e.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&me(e,t,s,c,r,t!=="value")):(t==="true-value"?e._trueValue=s:t==="false-value"&&(e._falseValue=s),me(e,t,s,c))};function Ft(e,t,n,s){if(s)return!!(t==="innerHTML"||t==="textContent"||t in e&&be(t)&&ct(n));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="form"||t==="list"&&e.tagName==="INPUT"||t==="type"&&e.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const o=e.tagName;if(o==="IMG"||o==="VIDEO"||o==="CANVAS"||o==="SOURCE")return!1}return be(t)&&F(n)?!1:t in e}const jt=rt({patchProp:qt},St);let Q,$e=!1;function Wt(){return Q=$e?Q:ot(jt),$e=!0,Q}const zt=(...e)=>{const t=Wt().createApp(...e),{mount:n}=t;return t.mount=s=>{const o=Gt(s);if(o)return n(o,!0,Vt(o))},t};function Vt(e){if(e instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&e instanceof MathMLElement)return"mathml"}function Gt(e){return F(e)?document.querySelector(e):e}var Kt='{"lang":"zh-CN","title":"FxJS ORM","description":"\u6700\u597D\u7528\u7684 FibJS ORM \u6846\u67B6","base":"/orm/","head":[],"themeConfig":{"repo":"fxjs-modules/orm","docsDir":"docs","docsBranch":"master","editLinks":true,"editLinkText":"\u5728 Github \u4E0A\u7F16\u8F91\u6B64\u9875","lastUpdated":"\u6700\u8FD1\u66F4\u65B0","nav":[{"text":"ORM","link":"/orm/getting-started","activeMatch":"^/orm"},{"text":"CLI","link":"/clis/orm","activeMatch":"^/clis/"}],"sidebar":{"/clis/":[{"text":"ORM-CLI","link":"/clis/orm"}],"/":[{"text":"\u5F00\u59CB\u8FDE\u63A5","link":"/orm/getting-started","children":[{"text":"Property","link":"/orm/property"},{"text":"\u865A\u62DF\u89C6\u56FE","link":"/orm/virtual-view"},{"text":"ORM \u63D2\u4EF6","link":"/orm/plugins"}]},{"text":"Packages","link":"/orm-packages/","children":[{"text":"orm-core","link":"/orm-packages/orm-core"},{"text":"orm-property","link":"/orm-packages/orm-property"},{"text":"db-driver","link":"/orm-packages/db-driver"},{"text":"knex","link":"/orm-packages/knex"},{"text":"sql-query","link":"/orm-packages/sql-query"},{"text":"sql-ddl-sync","link":"/orm-packages/sql-ddl-sync"}]}]}},"locales":{},"langs":{},"scrollOffset":90}';const Ue=/^https?:/i,E=typeof window!="undefined";function Jt(e,t){t.sort((n,s)=>{const o=s.split("/").length-n.split("/").length;return o!==0?o:s.length-n.length});for(const n of t)if(e.startsWith(n))return n}function ke(e,t){const n=Jt(t,Object.keys(e));return n?e[n]:void 0}function Xt(e){const{locales:t}=e.themeConfig||{},n=e.locales;return t&&n?Object.keys(t).reduce((s,o)=>(s[o]={label:t[o].label,lang:n[o].lang},s),{}):{}}function Yt(e,t){t=Qt(e,t);const n=ke(e.locales||{},t),s=ke(e.themeConfig.locales||{},t);return Object.assign({},e,n,{themeConfig:Object.assign({},e.themeConfig,s,{locales:{}}),lang:(n||e).lang,locales:{},langs:Xt(e)})}function Qt(e,t){if(!E)return t;const n=e.base,s=n.endsWith("/")?n.slice(0,-1):n;return t.slice(s.length)}const qe=Symbol(),G=_t(Zt(Kt));function Zt(e){return JSON.parse(e)}function en(e){const t=_(()=>Yt(G.value,e.path));return{site:t,theme:_(()=>t.value.themeConfig),page:_(()=>e.data),frontmatter:_(()=>e.data.frontmatter),lang:_(()=>t.value.lang),localePath:_(()=>{const{langs:n,lang:s}=t.value,o=Object.keys(n).find(a=>n[a].lang===s);return O(o||"/")}),title:_(()=>e.data.title?e.data.title+" | "+t.value.title:t.value.title),description:_(()=>e.data.description||t.value.description)}}function L(){const e=Ie(qe);if(!e)throw new Error("vitepress data not properly injected in app");return e}function tn(e,t){return`${e}${t}`.replace(/\/+/g,"/")}function O(e){return Ue.test(e)?e:tn(G.value.base,e)}function Fe(e){let t=e.replace(/\.html$/,"");if(t=decodeURIComponent(t),t.endsWith("/")&&(t+="index"),E){const n="/orm/";t=t.slice(n.length).replace(/\//g,"_")+".md";const s=__VP_HASH_MAP__[t.toLowerCase()];t=`${n}assets/${t}.${s}.js`}else t=`./${t.slice(1).replace(/\//g,"_")}.md.js`;return t}const je=Symbol(),we="http://a.com",nn=()=>({path:"/",component:null,data:{frontmatter:{}}});function sn(e,t){const n=Be(nn());function s(r=E?location.href:"/"){const i=new URL(r,we);return!i.pathname.endsWith("/")&&!i.pathname.endsWith(".html")&&(i.pathname+=".html",r=i.pathname+i.search+i.hash),E&&(history.replaceState({scrollPosition:window.scrollY},document.title),history.pushState(null,"",r)),a(r)}let o=null;async function a(r,i=0){const l=new URL(r,we),c=o=l.pathname;try{let h=e(c);if("then"in h&&typeof h.then=="function"&&(h=await h),o===c){o=null;const{default:m,__pageData:S}=h;if(!m)throw new Error(`Invalid route component: ${m}`);n.path=c,n.component=J(m),n.data=J(JSON.parse(S)),E&&ht(()=>{if(l.hash&&!i){let y=null;try{y=document.querySelector(decodeURIComponent(l.hash))}catch(C){console.warn(C)}if(y){ye(y,l.hash);return}}window.scrollTo(0,i)})}}catch(h){h.message.match(/fetch/)||console.error(h),o===c&&(o=null,n.path=c,n.component=t?J(t):null)}}return E&&(window.addEventListener("click",r=>{const i=r.target.closest("a");if(i){const{href:l,protocol:c,hostname:h,pathname:m,hash:S,target:y}=i,C=window.location,T=m.match(/\.\w+$/);!r.ctrlKey&&!r.shiftKey&&!r.altKey&&!r.metaKey&&y!=="_blank"&&c===C.protocol&&h===C.hostname&&!(T&&T[0]!==".html")&&(r.preventDefault(),m===C.pathname?S&&S!==C.hash&&(history.pushState(null,"",S),window.dispatchEvent(new Event("hashchange")),ye(i,S,i.classList.contains("header-anchor"))):s(l))}},{capture:!0}),window.addEventListener("popstate",r=>{a(location.href,r.state&&r.state.scrollPosition||0)}),window.addEventListener("hashchange",r=>{r.preventDefault()})),{route:n,go:s}}function We(){const e=Ie(je);if(!e)throw new Error("useRouter() is called without provider.");return e}function R(){return We().route}function ye(e,t,n=!1){let s=null;try{s=e.classList.contains(".header-anchor")?e:document.querySelector(decodeURIComponent(t))}catch(o){console.warn(o)}if(s){let o=G.value.scrollOffset;typeof o=="string"&&(o=document.querySelector(o).getBoundingClientRect().bottom+24);const a=parseInt(window.getComputedStyle(s).paddingTop,10),r=window.scrollY+s.getBoundingClientRect().top-o+a;!n||Math.abs(r-window.scrollY)>window.innerHeight?window.scrollTo(0,r):window.scrollTo({left:0,top:r,behavior:"smooth"})}}function on(e,t){let n=[],s=!0;const o=a=>{if(s){s=!1;return}const r=[],i=Math.min(n.length,a.length);for(let l=0;l<i;l++){let c=n[l];const[h,m,S=""]=a[l];if(c.tagName.toLocaleLowerCase()===h){for(const y in m)c.getAttribute(y)!==m[y]&&c.setAttribute(y,m[y]);for(let y=0;y<c.attributes.length;y++){const C=c.attributes[y].name;C in m||c.removeAttribute(C)}c.innerHTML!==S&&(c.innerHTML=S)}else document.head.removeChild(c),c=Se(a[l]),document.head.append(c);r.push(c)}n.slice(i).forEach(l=>document.head.removeChild(l)),a.slice(i).forEach(l=>{const c=Se(l);document.head.appendChild(c),r.push(c)}),n=r};mt(()=>{const a=e.data,r=t.value,i=a&&a.title,l=a&&a.description,c=a&&a.frontmatter.head;document.title=(i?i+" | ":"")+r.title,document.querySelector("meta[name=description]").setAttribute("content",l||r.description),o([...c?an(c):[]])})}function Se([e,t,n]){const s=document.createElement(e);for(const o in t)s.setAttribute(o,t[o]);return n&&(s.innerHTML=n),s}function rn(e){return e[0]==="meta"&&e[1]&&e[1].name==="description"}function an(e){return e.filter(t=>!rn(t))}const cn=v({name:"VitePressContent",setup(){const e=R();return()=>I("div",{style:{position:"relative"}},[e.component?I(e.component):null])}});const ln=e=>(ne("data-v-765646fb"),e=e(),se(),e),un=ln(()=>p("p",{class:"title"},"Debug",-1)),dn={class:"block"};v({__name:"Debug",setup(e){const t=L(),n=B(null),s=B(!1),o=Be(t);return H(s,a=>{a||(n.value.scrollTop=0)}),(a,r)=>(d(),f("div",{class:M(["debug",{open:s.value}]),ref_key:"el",ref:n,onClick:r[0]||(r[0]=i=>s.value=!s.value)},[un,p("pre",dn,x(o),1)],2))}});const pn=/#.*$/,fn=/(index)?\.(md|html)$/,j=/\/$/,_n=/^[a-z]+:/i;function re(e){return Array.isArray(e)}function ae(e){return _n.test(e)}function hn(e,t){if(t===void 0)return!1;const n=Le(`/${e.data.relativePath}`),s=Le(t);return n===s}function Le(e){return decodeURI(e).replace(pn,"").replace(fn,"")}function mn(e,t){const n=e.endsWith("/"),s=t.startsWith("/");return n&&s?e.slice(0,-1)+t:!n&&!s?`${e}/${t}`:e+t}function te(e){return/^\//.test(e)?e:`/${e}`}function ze(e){return e.replace(/(index)?(\.(md|html))?$/,"")||"/"}function vn(e){return e===!1||e==="auto"||re(e)}function gn(e){return e.children!==void 0}function bn(e){return re(e)?e.length===0:!e}function ie(e,t){if(vn(e))return e;t=te(t);for(const n in e)if(t.startsWith(te(n)))return e[n];return"auto"}function Ve(e){return e.reduce((t,n)=>(n.link&&t.push({text:n.text,link:ze(n.link)}),gn(n)&&(t=[...t,...Ve(n.children)]),t),[])}const $n=["href","aria-label"],kn=["src"],wn=v({__name:"NavBarTitle",setup(e){const{site:t,theme:n,localePath:s}=L();return(o,a)=>(d(),f("a",{class:"nav-bar-title",href:u(s),"aria-label":`${u(t).title}, back to home`},[u(n).logo?(d(),f("img",{key:0,class:"logo",src:u(O)(u(n).logo),alt:"Logo"},null,8,kn)):k("",!0),z(" "+x(u(t).title),1)],8,$n))}});var yn=w(wn,[["__scopeId","data-v-016a8bd8"]]);function Sn(){const{site:e,localePath:t,theme:n}=L();return _(()=>{const s=e.value.langs,o=Object.keys(s);if(o.length<2)return null;const r=R().path.replace(t.value,""),i=o.map(c=>({text:s[c].label,link:`${c}${r}`}));return{text:n.value.selectText||"Languages",items:i}})}const Ln=["GitHub","GitLab","Bitbucket"].map(e=>[e,new RegExp(e,"i")]);function xn(){const{site:e}=L();return _(()=>{const t=e.value.themeConfig,n=t.docsRepo||t.repo;if(!n)return null;const s=Cn(n);return{text:En(s,t.repoLabel),link:s}})}function Cn(e){return Ue.test(e)?e:`https://github.com/${e}`}function En(e,t){if(t)return t;const n=e.match(/^https?:\/\/[^/]+/);if(!n)return"Source";const s=Ln.find(([o,a])=>a.test(n[0]));return s&&s[0]?s[0]:"Source"}function Ge(e){const t=R(),n=ae(e.value.link);return{props:_(()=>{const o=xe(`/${t.data.relativePath}`);let a=!1;if(e.value.activeMatch)a=new RegExp(e.value.activeMatch).test(o);else{const r=xe(e.value.link);a=r==="/"?r===o:o.startsWith(r)}return{class:{active:a,isExternal:n},href:n?e.value.link:O(e.value.link),target:e.value.target||(n?"_blank":null),rel:e.value.rel||(n?"noopener noreferrer":null),"aria-label":e.value.ariaLabel}}),isExternal:n}}function xe(e){return e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\.(html|md)$/,"").replace(/\/index$/,"/")}const An={},Pn={class:"icon outbound",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",x:"0px",y:"0px",viewBox:"0 0 100 100",width:"15",height:"15"},Nn=p("path",{fill:"currentColor",d:"M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"},null,-1),Rn=p("polygon",{fill:"currentColor",points:"45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"},null,-1),Tn=[Nn,Rn];function In(e,t){return d(),f("svg",Pn,Tn)}var ce=w(An,[["render",In]]);const Bn={class:"nav-link"},Mn=v({__name:"NavLink",props:{item:{}},setup(e){const n=Me(e),{props:s,isExternal:o}=Ge(n.item);return(a,r)=>(d(),f("div",Bn,[p("a",Oe({class:"item"},u(s)),[z(x(a.item.text)+" ",1),u(o)?(d(),A(ce,{key:0})):k("",!0)],16)]))}});var Ce=w(Mn,[["__scopeId","data-v-49fe041d"]]);const On=e=>(ne("data-v-07381bdb"),e=e(),se(),e),Hn={class:"nav-dropdown-link-item"},Dn=On(()=>p("span",{class:"arrow"},null,-1)),Un={class:"text"},qn={class:"icon"},Fn=v({__name:"NavDropdownLinkItem",props:{item:{}},setup(e){const n=Me(e),{props:s,isExternal:o}=Ge(n.item);return(a,r)=>(d(),f("div",Hn,[p("a",Oe({class:"item"},u(s)),[Dn,p("span",Un,x(a.item.text),1),p("span",qn,[u(o)?(d(),A(ce,{key:0})):k("",!0)])],16)]))}});var jn=w(Fn,[["__scopeId","data-v-07381bdb"]]);const Wn=["aria-label"],zn={class:"button-text"},Vn={class:"dialog"},Gn=v({__name:"NavDropdownLink",props:{item:{}},setup(e){const t=R(),n=B(!1);H(()=>t.path,()=>{n.value=!1});function s(){n.value=!n.value}return(o,a)=>(d(),f("div",{class:M(["nav-dropdown-link",{open:n.value}])},[p("button",{class:"button","aria-label":o.item.ariaLabel,onClick:s},[p("span",zn,x(o.item.text),1),p("span",{class:M(["button-arrow",n.value?"down":"right"])},null,2)],8,Wn),p("ul",Vn,[(d(!0),f(V,null,oe(o.item.items,r=>(d(),f("li",{key:r.text,class:"dialog-item"},[b(jn,{item:r},null,8,["item"])]))),128))])],2))}});var Ee=w(Gn,[["__scopeId","data-v-18d75f62"]]);const Kn={key:0,class:"nav-links"},Jn={key:1,class:"item"},Xn={key:2,class:"item"},Yn=v({__name:"NavLinks",setup(e){const{theme:t}=L(),n=Sn(),s=xn(),o=_(()=>t.value.nav||s.value||n.value);return(a,r)=>o.value?(d(),f("nav",Kn,[u(t).nav?(d(!0),f(V,{key:0},oe(u(t).nav,i=>(d(),f("div",{key:i.text,class:"item"},[i.items?(d(),A(Ee,{key:0,item:i},null,8,["item"])):(d(),A(Ce,{key:1,item:i},null,8,["item"]))]))),128)):k("",!0),u(n)?(d(),f("div",Jn,[b(Ee,{item:u(n)},null,8,["item"])])):k("",!0),u(s)?(d(),f("div",Xn,[b(Ce,{item:u(s)},null,8,["item"])])):k("",!0)])):k("",!0)}});var Ke=w(Yn,[["__scopeId","data-v-35b91e7e"]]);const Qn={emits:["toggle"]},Zn=p("svg",{class:"icon",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",role:"img",viewBox:"0 0 448 512"},[p("path",{fill:"currentColor",d:"M436 124H12c-6.627 0-12-5.373-12-12V80c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12zm0 160H12c-6.627 0-12-5.373-12-12v-32c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12zm0 160H12c-6.627 0-12-5.373-12-12v-32c0-6.627 5.373-12 12-12h424c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12z",class:""})],-1),es=[Zn];function ts(e,t,n,s,o,a){return d(),f("div",{class:"sidebar-button",onClick:t[0]||(t[0]=r=>e.$emit("toggle"))},es)}var ns=w(Qn,[["render",ts]]);const ss=e=>(ne("data-v-40587210"),e=e(),se(),e),os={class:"nav-bar"},rs=ss(()=>p("div",{class:"flex-grow"},null,-1)),as={class:"nav"},is=v({__name:"NavBar",emits:["toggle"],setup(e){return(t,n)=>(d(),f("header",os,[b(ns,{onToggle:n[0]||(n[0]=s=>t.$emit("toggle"))}),b(yn),rs,p("div",as,[b(Ke)]),$(t.$slots,"search",{},void 0,!0)]))}});var cs=w(is,[["__scopeId","data-v-40587210"]]);function ls(){let e=null,t=null;const n=_s(s,300);function s(){const r=us(),i=ds(r);for(let l=0;l<i.length;l++){const c=i[l],h=i[l+1],[m,S]=fs(l,c,h);if(m){history.replaceState(null,document.title,S||" "),o(S);return}}}function o(r){if(a(t),a(e),t=document.querySelector(`.sidebar a[href="${r}"]`),!t)return;t.classList.add("active");const i=t.closest(".sidebar-links > ul > li");i&&i!==t.parentElement?(e=i.querySelector("a"),e&&e.classList.add("active")):e=null}function a(r){r&&r.classList.remove("active")}D(()=>{s(),window.addEventListener("scroll",n)}),vt(()=>{o(decodeURIComponent(location.hash))}),He(()=>{window.removeEventListener("scroll",n)})}function us(){return[].slice.call(document.querySelectorAll(".sidebar a.sidebar-link-item"))}function ds(e){return[].slice.call(document.querySelectorAll(".header-anchor")).filter(t=>e.some(n=>n.hash===t.hash))}function ps(){return document.querySelector(".nav-bar").offsetHeight}function Ae(e){const t=ps();return e.parentElement.offsetTop-t-15}function fs(e,t,n){const s=window.scrollY;return e===0&&s===0?[!0,null]:s<Ae(t)?[!1,null]:!n||s<Ae(n)?[!0,decodeURIComponent(t.hash)]:[!1,null]}function _s(e,t){let n,s=!1;return()=>{n&&clearTimeout(n),s?n=setTimeout(e,t):(e(),s=!0,setTimeout(()=>{s=!1},t))}}function hs(){const e=R(),{site:t}=L();return ls(),_(()=>{const n=e.data.headers,s=e.data.frontmatter.sidebar,o=e.data.frontmatter.sidebarDepth;if(s===!1)return[];if(s==="auto")return Pe(n,o);const a=ie(t.value.themeConfig.sidebar,e.data.relativePath);return a===!1?[]:a==="auto"?Pe(n,o):a})}function Pe(e,t){const n=[];if(e===void 0)return[];let s;return e.forEach(({level:o,title:a,slug:r})=>{if(o-1>t)return;const i={text:a,link:`#${r}`};o===2?(s=i,n.push(i)):s&&(s.children||(s.children=[])).push(i)}),n}const Je=e=>{const t=R(),{site:n,frontmatter:s}=L(),o=e.depth||1,a=s.value.sidebarDepth||1/0,r=t.data.headers,i=e.item.text,l=ms(n.value.base,e.item.link),c=e.item.children,h=hn(t,e.item.link),m=o<a?Xe(h,c,r,o+1):null;return I("li",{class:"sidebar-link"},[I(l?"a":"p",{class:{"sidebar-link-item":!0,active:h},href:l},i),m])};function ms(e,t){return t===void 0||t.startsWith("#")?t:mn(e,t)}function Xe(e,t,n,s=1){return t&&t.length>0?I("ul",{class:"sidebar-links"},t.map(o=>I(Je,{item:o,depth:s}))):e&&n?Xe(!1,vs(n),void 0,s):null}function vs(e){return Ye(gs(e))}function gs(e){e=e.map(n=>Object.assign({},n));let t;return e.forEach(n=>{n.level===2?t=n:t&&(t.children||(t.children=[])).push(n)}),e.filter(n=>n.level===2)}function Ye(e){return e.map(t=>({text:t.title,link:`#${t.slug}`,children:t.children?Ye(t.children):void 0}))}const bs={key:0,class:"sidebar-links"},$s=v({__name:"SideBarLinks",setup(e){const t=hs();return(n,s)=>u(t).length>0?(d(),f("ul",bs,[(d(!0),f(V,null,oe(u(t),o=>(d(),A(u(Je),{item:o},null,8,["item"]))),256))])):k("",!0)}});const ks=v({__name:"SideBar",props:{open:{type:Boolean}},setup(e){return(t,n)=>(d(),f("aside",{class:M(["sidebar",{open:t.open}])},[b(Ke,{class:"nav"}),$(t.$slots,"sidebar-top",{},void 0,!0),b($s),$(t.$slots,"sidebar-bottom",{},void 0,!0)],2))}});var ws=w(ks,[["__scopeId","data-v-17c48e2f"]]);const ys=/bitbucket.org/;function Ss(){const{page:e,theme:t,frontmatter:n}=L(),s=_(()=>{const{repo:a,docsDir:r="",docsBranch:i="master",docsRepo:l=a,editLinks:c}=t.value,h=n.value.editLink!=null?n.value.editLink:c,{relativePath:m}=e.value;return!h||!m||!a?null:Ls(a,l,r,i,m)}),o=_(()=>t.value.editLinkText||"Edit this page");return{url:s,text:o}}function Ls(e,t,n,s,o){return ys.test(e)?Cs(e,t,n,s,o):xs(e,t,n,s,o)}function xs(e,t,n,s,o){return(ae(t)?t:`https://github.com/${t}`).replace(j,"")+`/edit/${s}/`+(n?n.replace(j,"")+"/":"")+o}function Cs(e,t,n,s,o){return(ae(t)?t:e).replace(j,"")+`/src/${s}/`+(n?n.replace(j,"")+"/":"")+o+`?mode=edit&spa=0&at=${s}&fileviewer=file-view-default`}const Es={class:"edit-link"},As=["href"],Ps=v({__name:"EditLink",setup(e){const{url:t,text:n}=Ss();return(s,o)=>(d(),f("div",Es,[u(t)?(d(),f("a",{key:0,class:"link",href:u(t),target:"_blank",rel:"noopener noreferrer"},[z(x(u(n))+" ",1),b(ce,{class:"icon"})],8,As)):k("",!0)]))}});var Ns=w(Ps,[["__scopeId","data-v-55695e90"]]);const Rs={key:0,class:"last-updated"},Ts={class:"prefix"},Is={class:"datetime"},Bs=v({__name:"LastUpdated",setup(e){const{theme:t,page:n}=L(),s=_(()=>{const r=t.value.lastUpdated;return r!==void 0&&r!==!1}),o=_(()=>{const r=t.value.lastUpdated;return r===!0?"Last Updated":r}),a=B("");return D(()=>{a.value=new Date(n.value.lastUpdated).toLocaleString("en-US")}),(r,i)=>s.value?(d(),f("p",Rs,[p("span",Ts,x(o.value)+":",1),p("span",Is,x(a.value),1)])):k("",!0)}});var Ms=w(Bs,[["__scopeId","data-v-30c3cbb4"]]);const Os={class:"page-footer"},Hs={class:"edit"},Ds={class:"updated"},Us=v({__name:"PageFooter",setup(e){return(t,n)=>(d(),f("footer",Os,[p("div",Hs,[b(Ns)]),p("div",Ds,[b(Ms)])]))}});var qs=w(Us,[["__scopeId","data-v-5c96fb00"]]);function Fs(){const{page:e,theme:t}=L(),n=_(()=>ze(te(e.value.relativePath))),s=_(()=>{const l=ie(t.value.sidebar,n.value);return re(l)?Ve(l):[]}),o=_(()=>s.value.findIndex(l=>l.link===n.value)),a=_(()=>{if(t.value.nextLinks!==!1&&o.value>-1&&o.value<s.value.length-1)return s.value[o.value+1]}),r=_(()=>{if(t.value.prevLinks!==!1&&o.value>0)return s.value[o.value-1]}),i=_(()=>!!a.value||!!r.value);return{next:a,prev:r,hasLinks:i}}const js={},Ws={xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24"},zs=p("path",{d:"M19,11H7.4l5.3-5.3c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-7,7c-0.1,0.1-0.2,0.2-0.2,0.3c-0.1,0.2-0.1,0.5,0,0.8c0.1,0.1,0.1,0.2,0.2,0.3l7,7c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L7.4,13H19c0.6,0,1-0.4,1-1S19.6,11,19,11z"},null,-1),Vs=[zs];function Gs(e,t){return d(),f("svg",Ws,Vs)}var Ks=w(js,[["render",Gs]]);const Js={},Xs={xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24"},Ys=p("path",{d:"M19.9,12.4c0.1-0.2,0.1-0.5,0-0.8c-0.1-0.1-0.1-0.2-0.2-0.3l-7-7c-0.4-0.4-1-0.4-1.4,0s-0.4,1,0,1.4l5.3,5.3H5c-0.6,0-1,0.4-1,1s0.4,1,1,1h11.6l-5.3,5.3c-0.4,0.4-0.4,1,0,1.4c0.2,0.2,0.5,0.3,0.7,0.3s0.5-0.1,0.7-0.3l7-7C19.8,12.6,19.9,12.5,19.9,12.4z"},null,-1),Qs=[Ys];function Zs(e,t){return d(),f("svg",Xs,Qs)}var eo=w(Js,[["render",Zs]]);const to={key:0,class:"next-and-prev-link"},no={class:"container"},so={class:"prev"},oo=["href"],ro={class:"text"},ao={class:"next"},io=["href"],co={class:"text"},lo=v({__name:"NextAndPrevLinks",setup(e){const{hasLinks:t,prev:n,next:s}=Fs();return(o,a)=>u(t)?(d(),f("div",to,[p("div",no,[p("div",so,[u(n)?(d(),f("a",{key:0,class:"link",href:u(O)(u(n).link)},[b(Ks,{class:"icon icon-prev"}),p("span",ro,x(u(n).text),1)],8,oo)):k("",!0)]),p("div",ao,[u(s)?(d(),f("a",{key:0,class:"link",href:u(O)(u(s).link)},[p("span",co,x(u(s).text),1),b(eo,{class:"icon icon-next"})],8,io)):k("",!0)])])])):k("",!0)}});var uo=w(lo,[["__scopeId","data-v-e65a9748"]]);const po={class:"page"},fo={class:"container"},_o=v({__name:"Page",setup(e){return(t,n)=>{const s=ee("Content");return d(),f("main",po,[p("div",fo,[$(t.$slots,"top",{},void 0,!0),b(s,{class:"content"}),b(qs),b(uo),$(t.$slots,"bottom",{},void 0,!0)])])}}});var ho=w(_o,[["__scopeId","data-v-8fcebc32"]]);const mo={key:0,id:"ads-container"},vo=v({__name:"Layout",setup(e){const t=gt(()=>De(()=>import("./Home.0f90b16e.js"),["assets/Home.0f90b16e.js","assets/plugin-vue_export-helper.fe91f02a.js"])),n=()=>null,s=n,o=n,a=n,r=R(),{site:i,page:l,theme:c,frontmatter:h}=L(),m=_(()=>!!h.value.customLayout),S=_(()=>!!h.value.home),y=_(()=>Object.keys(i.value.langs).length>1),C=_(()=>{const g=c.value;return h.value.navbar===!1||g.navbar===!1?!1:i.value.title||g.logo||g.repo||g.nav}),T=B(!1),Ze=_(()=>h.value.home||h.value.sidebar===!1?!1:!bn(ie(c.value.sidebar,r.data.relativePath))),K=g=>{T.value=typeof g=="boolean"?g:!T.value},et=K.bind(null,!1);H(r,et);const tt=_(()=>[{"no-navbar":!C.value,"sidebar-open":T.value,"no-sidebar":!Ze.value}]);return(g,le)=>{const nt=ee("Content"),st=ee("Debug");return d(),f(V,null,[p("div",{class:M(["theme",tt.value])},[C.value?(d(),A(cs,{key:0,onToggle:K},{search:N(()=>[$(g.$slots,"navbar-search",{},()=>[u(c).algolia?(d(),A(u(a),{key:0,options:u(c).algolia,multilang:y.value},null,8,["options","multilang"])):k("",!0)])]),_:3})):k("",!0),b(ws,{open:T.value},{"sidebar-top":N(()=>[$(g.$slots,"sidebar-top")]),"sidebar-bottom":N(()=>[$(g.$slots,"sidebar-bottom")]),_:3},8,["open"]),p("div",{class:"sidebar-mask",onClick:le[0]||(le[0]=Do=>K(!1))}),m.value?(d(),A(nt,{key:1})):S.value?$(g.$slots,"home",{key:2},()=>[b(u(t),null,{hero:N(()=>[$(g.$slots,"home-hero")]),features:N(()=>[$(g.$slots,"home-features")]),footer:N(()=>[$(g.$slots,"home-footer")]),_:3})]):(d(),A(ho,{key:3},{top:N(()=>[$(g.$slots,"page-top-ads",{},()=>[u(c).carbonAds&&u(c).carbonAds.carbon?(d(),f("div",mo,[(d(),A(u(s),{key:"carbon"+u(l).relativePath,code:u(c).carbonAds.carbon,placement:u(c).carbonAds.placement},null,8,["code","placement"]))])):k("",!0)]),$(g.$slots,"page-top")]),bottom:N(()=>[$(g.$slots,"page-bottom"),$(g.$slots,"page-bottom-ads",{},()=>[u(c).carbonAds&&u(c).carbonAds.custom?(d(),A(u(o),{key:"custom"+u(l).relativePath,code:u(c).carbonAds.custom,placement:u(c).carbonAds.placement},null,8,["code","placement"])):k("",!0)])]),_:3}))],2),b(st)],64)}}}),go={class:"theme"},bo=p("h1",null,"404",-1),$o=["href"],ko=v({__name:"NotFound",setup(e){const{site:t}=L(),n=["There's nothing here.","How did we get here?","That's a Four-Oh-Four.","Looks like we've got some broken links."];function s(){return n[Math.floor(Math.random()*n.length)]}return(o,a)=>(d(),f("div",go,[bo,p("blockquote",null,x(s()),1),p("a",{href:u(t).base,"aria-label":"go to home"},"Take me home.",8,$o)]))}}),wo={Layout:vo,NotFound:ko};const yo=v({__name:"Badge",props:{text:{default:""},type:{default:"tip"},vertical:{default:"top"}},setup(e){const t=e;return(n,s)=>(d(),f("span",{class:M(["badge",[`badge-type-${t.type}`]]),style:bt({"vertical-align":t.vertical})},[$(n.$slots,"default",{},()=>[z(x(t.text),1)],!0)],6))}});var So=w(yo,[["__scopeId","data-v-cae86cf0"]]);const Lo={class:"theme"},xo=p("h1",null,"404",-1),Co=["href"],Eo=v({__name:"NotFound",setup(e){const{site:t}=L(),n=We(),s=["There's nothing here.","How did we get here?","That's a Four-Oh-Four.","Looks like we've got some broken links."];function o(){return s[Math.floor(Math.random()*s.length)]}const a=(t.value.base||"/").replace(/\/$/,"");return n.route.path===`${a}.html`&&(window.location.href=`${a}/`),(r,i)=>(d(),f("div",Lo,[xo,p("blockquote",null,x(o()),1),p("a",{href:u(t).base,"aria-label":"go to home"},"Take me home.",8,Co)]))}});var W={...wo,NotFound:Eo,enhanceApp({app:e}){e.component("Badge",So)}};const Z=new Set,Qe=()=>document.createElement("link"),Ao=e=>{const t=Qe();t.rel="prefetch",t.href=e,document.head.appendChild(t)},Po=e=>{const t=new XMLHttpRequest;t.open("GET",e,t.withCredentials=!0),t.send()};let U;const No=E&&(U=Qe())&&U.relList&&U.relList.supports&&U.relList.supports("prefetch")?Ao:Po;function Ro(){if(!E||!window.IntersectionObserver)return;let e;if((e=navigator.connection)&&(e.saveData||/2g/.test(e.effectiveType)))return;const t=window.requestIdleCallback||setTimeout;let n=null;const s=()=>{n&&n.disconnect(),n=new IntersectionObserver(a=>{a.forEach(r=>{if(r.isIntersecting){const i=r.target;n.unobserve(i);const{pathname:l}=i;if(!Z.has(l)){Z.add(l);const c=Fe(l);No(c)}}})}),t(()=>{document.querySelectorAll("#app a").forEach(a=>{const{target:r,hostname:i,pathname:l}=a,c=l.match(/\.\w+$/);c&&c[0]!==".html"||r!=="_blank"&&i===location.hostname&&(l!==location.pathname?n.observe(a):Z.add(l))})})};D(s);const o=R();H(()=>o.path,s),He(()=>{n&&n.disconnect()})}const To=v({setup(e,{slots:t}){const n=B(!1);return D(()=>{n.value=!0}),()=>n.value&&t.default?t.default():null}}),Io=W.NotFound||(()=>"404 Not Found"),Bo={name:"VitePressApp",setup(){const{site:e}=L();return D(()=>{H(()=>e.value.lang,t=>{document.documentElement.lang=t},{immediate:!0})}),Ro(),()=>I(W.Layout)}};function Mo(){const e=Ho(),t=Oo();t.provide(je,e);const n=en(e.route);return t.provide(qe,n),E&&on(e.route,n.site),t.component("Content",cn),t.component("ClientOnly",To),t.component("Debug",()=>null),Object.defineProperty(t.config.globalProperties,"$frontmatter",{get(){return n.frontmatter.value}}),W.enhanceApp&&W.enhanceApp({app:t,router:e,siteData:G}),{app:t,router:e}}function Oo(){return zt(Bo)}function Ho(){let e=E,t;return sn(n=>{let s=Fe(n);return e&&(t=s),(e||t===s)&&(s=s.replace(/\.js$/,".lean.js")),E?(e=!1,De(()=>import(s),[])):require(s)},Io)}if(E){const{app:e,router:t}=Mo();t.go().then(()=>{e.mount("#app")})}export{Ce as N,Mo as createApp,L as u,O as w};
