(()=>{"use strict";const t={events:{},addEventListener(t,e){this.events.hasOwnProperty(t)?this.events[t].push(e):(console.warn(`${this.constructor.name} added event listener for ${t} despite not being pre-defined.`),this.events[t]=[e])},addEventListeners(t){for(const e in t)this.addEventListener(e,t[e])},on(t,e){return this.addEventListener(t,e),this},triggerEvent(t,...e){if(this.events.hasOwnProperty(t))for(let i of this.events[t])i(...e);else console.warn(`${this.constructor.name} triggered unknown event ${t} with args ${e}`)}};class e{constructor(t){if(this.constructor===e)throw new Error("Cannot instantiate base Usetype class.");t.hasNoval&&(this.hasNoval=!0,this.novalVal=t.novalVal),t.isConstant&&(this.isConstant=t.isConstant,this.constantVal=t.constantVal),t.potentialIds&&(this.potentialIds=!0),t.ambiguousSets&&(this.ambiguousSets=t.ambiguousSets),t.limitExceeded&&(this.ignored=!0)}format(t){throw new Error("Abstract baseclass Usetype.format() called.")}deformat(t){throw new Error("Abstract base class Usetype.deformat() called.")}toString(){return"U{undefined}"}toFormatString(){return""}toDebugString(){return"Usetype::Base()"}isSubsetOf(t){throw new Error("Abstract base class Usetype.isSubsetOf() called.")}isSupersetOf(t){throw new Error("Abstract base class Usetype.isSupersetOf() called.")}isEqualTo(t){throw new Error("Abstract base class Usetype.isEqualTo() called.")}isSimilarTo(t){throw new Error("Abstract base class Usetype.isSimilarTo() called.")}compatibleTypes=[];type="undefined";domainType="none";priority=-1}const i={countries:{url:"https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-abbreviation.json",extract:t=>{i.countries.names=t.map((t=>t.country)),i.countries.codes=t.map((t=>t.abbreviation))}},currencies:{url:"https://gist.githubusercontent.com/Fluidbyte/2973986/raw/8bb35718d0c90fdacb388961c98b8d56abc392c9/Common-Currency.json",extract:t=>{let e=Object.keys(t);i.currencies.codes=e,i.currencies.symbols=e.map((e=>t[e].symbol)),i.currencies.nativeSymbols=e.map((e=>t[e].symbol_native))}},cities:{url:"https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json",extract:t=>{i.cities.names=t.map((t=>t.name)),i.cities.codes=t.map((t=>t.country))}}};let s=!1;!function(){if(!s){for(let t in i){let e;fetch(i[t].url).then((t=>t.json())).then((e=>i[t].extract(e))).catch((i=>(console.error("parse.constants.js fetch item",t,"failed with err",i),e.text())))}s=!0}}();const n=function(){let t=i.currencies;return t&&t.symbols?t.symbols:[]},r=function(){let t=i.currencies;return t&&t.abbreviations?t.abbreviations:[]},a=function(t){return["yotta","zetta","exa","peta","tera","giga","mega","kilo","hecto","deca","","deci","centi","milli","micro","nano","pico","femto","atto","zepto","yocto"]},l=function(t){return["Y","Z","E","P","T","G","M","k","h","da","","d","c","m","μ","n","p","f","a","z","y"]},o=function(t){return["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","Dc","Ud","Dd","Td"]};function h(t){return new Set(t).size!==t.length}function u(t,e){return t.every((t=>e.includes(t)))}function c(t,e){return t.filter((t=>e.includes(t)))}function d(t,e,i=!1,s=!1){let n=t.map((t=>[t,e])).flat(1);return i&&n.splice(0,0,e),s||n.splice(-1,1),n}function p(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function m(t,e){const i=[".",","," "," "],s=[".",","],n=(r=i.concat(s),[...new Set(r)]);var r;const a=new RegExp("^["+n.join("")+"\\d]+$");let l=[],o=[],h=!1,u=!1,c=!1,d=!1,p=!1,m=[];for(let e=0,r=t.length;e<r;e++){let r=t[e],y="",x=r.match(/^[^0-9]*[^0-9+-]/);x&&(y=x[0],r=r.replace(x[0],""));let S="",b=r.match(/[^.0-9][^0-9]*$/);b&&(S=b[0],r=r.replace(b[0],""));let _=!1,M=r.match(/[eE][0-9]+$/);M&&(_=!0,r=r.replace(M[0],""));let v=!1,T=!1,k=r.match(/^[-+]/);if(k&&("+"===k[0]&&(T=!0),v=!0,r=r.replace(k[0],"")),!r.match(a)){window.purePat=a;continue}let w=i.filter((t=>r.includes(t))),D=s.filter((t=>r.includes(t))),E=[],O=n.filter((t=>r.includes(t)));if(0!==r.length){if(0===O.length)E.push(["",""]);else if(1===O.length){let t=O[0];f(r,t)&&E.push([t,""]),g(r,t)&&E.push(["",t])}else{let t=!1;for(let e of w)for(let i of D){if(e===i)continue;if(!f(r,e))continue;if(!g(r,i))continue;let s=r.split(e).join("").split(i).join(".");isNaN(parseFloat(s))||(E.push([e,i]),t=!0)}if(!t)continue}y&&l.push(y),S&&o.push(S),h&=v,u&=T,c=!1,d=!1,p&=_,m=m.concat(E)}}let x=[];for(let t of m){let i=new y({prefixes:l,suffixes:o,separators:t,integral:!t[1],scientific:p,explicitSign:u},e);x.push(i)}let S=!0;for(;S;){S=!1;for(let t=0;t<x.length;t++){for(let e=0;e<x.length&&(t===e||(x[t].isEqualTo(x[e])||x[t].isSupersetOf(x[e])?(x.splice(e),S=!0):x[e].isSupersetOf(x[t])&&(x.splice(t),S=!0),!S));e++);if(S)break}}return x}function f(t,e){let i=t.split(e);return!(i[0].length>3)&&(3===i[i.length-1].length||!i[i.length-1].match(/^[0-9]+$/))&&i.slice(1,-1).every((t=>3===t.length||t.match(/\D/)))}function g(t,e){let i=t.match(new RegExp(p(e),"g"));return i&&1===i.length}class y extends e{constructor({separators:t=[],prefixes:e=[],suffixes:i=[],scientific:s=!1,strictlyPositive:n=!1,explicitSign:r=!1},a){super(a),t.length>0&&""!==t[0]&&(this.thousandSeparator=t[0]),t.length>1&&""!==t[1]?this.decimalSeparator=t[1]:this.integral=!0,t.length>2&&t[2]===t[0]&&(this.separateDecimalThousands=!0),s&&(this.scientific=!0),n&&(this.strictlyPositive=!0),r&&(this.explicit=!0),this.prefixes=e;let l=x(this.prefixes);"unknown"!==l.type&&(this.prefixes=l.domain,this.prefixPlaceholder=l.type),this.suffixes=i;let o=x(this.suffixes);"unknown"!==o.type&&(this.suffixes=o.domain,this.suffixPlaceholder=o.type),this.hasNoval&&null!==this.deformat(this.novalVal)&&(this.hasNoval=!1,delete this.novalVal)}prefixes=[];suffixes=[];decimalSeparator="";thousandSeparator="";separateDecimalThousands=!1;scientific=!1;explicit=!1;min=void 0;max=void 0;format(t){function e(t,e,i){return(i?t.match(/.{1,3}/g):t.match(/.{1,3}(?=(.{3})*$)/g)).join(e)}let i=this.prefixPlaceholder??this.prefixes,s=this.suffixPlaceholder??this.suffixes;if(this.scientific){let e=t.toFixed(1).indexOf(".")-1;t/=10**e,suffix="e"+e+suffix}this.explicit&&t>=0&&(prefix+="+");var n=(this.decimalPlaces?t.toFixed(this.decimalPlaces):t.toString()).split("."),r=n[0];if(this.integerPlaces>0&&n[0].length<this.integerPlaces&&(r="0".repeat(this.integerPlaces-r.length)+r),r=e(n[0],this.thousandSeparator,!1),this.integral)return i+r+s;var a="0";return n.length>1&&(a=n[1]),this.decimalPlaces>0&&n[1].length<this.decimalPlaces&&(a+="0".repeat(this.decimalPlaces-a.length)),this.separateDecimalThousands&&(a=e(n[1],this.thousandSeparator,!0)),i+r+this.decimalSeparator+a+s}deformat(t){let e=t;return this.prefixes.forEach((t=>e.startsWith(t)&&(e=e.slice(t.length)))),this.suffixes.forEach((t=>e.endsWith(t)&&(e=e.slice(0,e.length-t.length)))),this.decimalSeparator&&(e=e.split(this.decimalSeparator).join(".")),this.thousandSeparator&&(e=e.split(this.thousandSeparator).join("")),isNaN(e)?null:(this._checkDomain(+e),+e)}isSupersetOf(t){return t.prefixes.every((t=>this.prefixes.includes(t)))?t.suffixes.every((t=>this.suffixes.includes(t)))?!(t.decimalSeparator&&this.decimalSeparator!==t.decimalSeparator||t.thousandSeparator&&this.thousandSeparator!==t.thousandSeparator):(t.suffixes.filter((t=>!this.suffixes.includes(t))),!1):(t.prefixes.filter((t=>!this.prefixes.includes(t))),!1)}_checkDomain(t){(void 0===this.min||this.min>t)&&(this.min=t),(void 0===this.max||this.max<t)&&(this.max=t)}isSubsetOf(t){return t.isSupersetOf(this)}isEqualTo(t){return this.isSupersetOf(t)&&t.isSupersetOf(this)}isSimilarTo(t){if(!this.isEqualTo(t))return!1;let e=this.max-this.min,i=t.max-t.min,s=Math.min(this.max,t.max)-Math.max(this.min,t.min);return s>=(e+i-s)/10}toString(){return this.min?"N{"+this.format(this.min)+"-"+this.format(this.max)+"}":"N{"+this.format(1234567.654321)+"}"}toFormatString(){let t="Number";return this.scientific&&(t+=", scientific"),this.strictlyPositive&&(t+=", strictly positive"),this.decimalSeparator?t+=", decimal":t+=", whole",this.prefixes.length>0&&(t+=", "+(this.prefixPlaceholder??"")+" prefixed"),this.suffixes.length>0&&(t+=", "+(this.suffixPlaceholder??"")+" suffixed"),t}toDebugString(){return"Usetype::Number()"}compatibleTypes=[];compatibleTypes=["number"];type="number";domainType="ordinal";priority=2;static getIdUsetype(){return new y({strictlyPositive:!0},{potentialIds:!0})}}function x(t){let e=r();if(!t||!(t instanceof Array)||0===t.length||t.every((t=>t.match(/^\s*$/))))return{type:"unknown",format:"unknown",domain:[]};if(t.every((t=>e.includes(t))))return{type:"currency",format:"code",domain:[...e]};let i=n();if(t.every((t=>i.includes(t))))return{type:"currency",format:"symbol",domain:[...i]};let s=l(),h=o(),u=[].concat(s,h);if(t.every((t=>u.includes(t))))return{type:"magnitude",format:"symbol",domain:[...u]};let c=a();return t.every((t=>c.includes(t)))?{type:"magnitude",format:"prefix",domain:[...c]}:{type:"unknown",format:"unknown",domain:[]}}const S={not:t=>(...e)=>!t(...e),both:(t,e)=>(...i)=>t(...i)&&e(...i),either:(t,e)=>(...i)=>t(...i)||e(...i),imply:(t,e)=>(...i)=>!t(...i)||e(...i),implied:(t,e)=>(...i)=>t(...i)||!e(...i)},b=(t,e)=>(...i)=>t(...i)===e(...i);S.equal=b;const _=(...t)=>(...e)=>t.every((t=>t(...e)));S.all=_;const M=(...t)=>(...e)=>t.some((t=>t(...e)));S.any=M;function v(t,e){return t-e}function T(t,e){let i=t[0]-e[0];if(0!==i)return i;let s=t[1]-e[1];if(0!==s)return s;let n=(t[2]??0)-(e[2]??0);return 0!==n?n:(t[3]??0)-(e[3]??0)}function k(t,e){for(let i=0;i<t.length;i++){for(let s of e)null===s.deformat(t[i])&&(s.disabled=!0);let s=e.filter((t=>!t.disabled));if(0===s.length)return[];e=s}return e}function w(t){for(let e=0;e<t.length;e++){let i=[];for(let s=e+1;s<t.length;s++)t[e].isSupersetOf(t[s])&&i.push(s);t=t.filter(((t,e)=>!i.includes(e)))}return t}var D;S.none=(...t)=>!M(...t),S.notAll=(...t)=>!_(...t),S.equal=b;const E=["January","February","March","April","May","June","July","August","September","October","November","December"],O=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Y=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],C=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];function F(t){return function(t){if(h(t.filter((t=>Object.values(j).some((e=>e.label===t))))))return!1;let e=t.map((t=>L[t]));return e=e.filter((t=>t)),!h(e.map((t=>j[t].category)))&&!!function(t){function e(...t){return function(e){return t.every((t=>e.some((e=>V(e).category===t))))}}function i(...t){return function(e){let i=e.map((t=>V(t).category));return t.map((t=>i.indexOf(t))).map(((t,e,i)=>e===i.length-1||t<i[e+1])).reduce(((t,e)=>t&&e),!0)}}function s(t,s){return t instanceof Array&&s instanceof Array?function(e){let i=e.map((t=>V(t).category)).filter((t=>t)),n=t.map((t=>i.indexOf(t))).filter((t=>t>=0)),r=s.map((t=>i.indexOf(t))).filter((t=>t>=0));return Math.max(...n)<Math.min(...r)}:S.imply(e(t,s),i(t,s))}const n=S.all(S.imply(e(I.Milliseconds),e(I.Seconds)),S.imply(e(I.Meridiem),e(I.Hours)),S.imply(e(I.Era),e(I.Years))),r=S.all(s(I.Hours,I.Minutes),s(I.Minutes,I.Seconds),s(I.Seconds,I.Milliseconds),s(I.Hours,I.Meridiem),s(I.Years,I.Era),s([I.Years,I.Months,I.Days,I.Era,I.DayOfWeek],[I.Hours,I.Minutes,I.Seconds,I.Milliseconds,I.Meridiem]),S.imply(e(I.Years,I.Months,I.Days),S.any(i(I.Years,I.Months,I.Days),i(I.Days,I.Months,I.Years),i(I.Months,I.Days,I.Years))));return(t=>{let i=[I.Years,I.Months,I.Days,I.Hours,I.Minutes,I.Seconds,I.Milliseconds].map((i=>e(i)(t))),s=i.indexOf(!0),n=i.lastIndexOf(!0);return i.slice(s,n).reduce(((t,e)=>t&&e),!0)})(t)&&n(t)&&r(t)&&(t=>{B.NumericLong,B.NumericMedium,B.NumericShort;const e=t=>{let e=V(t);return e.literal?/^[0-9]/.test(t):e.numeric},i=t=>{let e=V(t);return e.literal?/[0-9]$/.test(t):e.numeric};for(let s=0;s<t.length-1;s++)if(i(t[s])&&e(t[s+1]))return!1;return!0})(t)}(t)}(t.formatting)&&"unknown"!==t.type}const I={Years:1,Months:2,Days:3,Hours:4,Minutes:5,Seconds:6,Milliseconds:7,Era:8,Meridiem:9,DayOfWeek:10},B={NumericShort:0,NumericMedium:1,NumericLong:2,WordShort:3,WordLong:4},j={era:{label:"{EE}",regexBit:"(AD|BC)",category:I.Era,numeric:!1,apply:(t,e)=>t.getFullYear()>0&&"BC"===e&&t.setFullYear(-t.getFullYear()),applyTod:(t,e)=>{},extract:t=>t.getFullYear()>=0?"AD":"BC",extractTod:t=>{}},yearFull:{label:"{YYYY}",regexBit:"([12][0-9]{3,})",category:I.Years,numeric:!0,subtoken:"yearShort",apply:(t,e)=>t.setFullYear(+e),applyTod:(t,e)=>{},extract:t=>t.getFullYear().toString().padStart(4,"0"),extractTod:t=>{}},yearShort:{label:"{YY}",regexBit:"([0-9]{2})",category:I.Years,numeric:!0,apply:(t,e)=>t.setFullYear(+e),applyTod:(t,e)=>{},extract:t=>t.getFullYear().toString(),extractTod:t=>{}},monthFull:{label:"{MM}",regexBit:"(0\\d|1[012])",category:I.Months,numeric:!0,apply:(t,e)=>t.setMonth(e-1),applyTod:(t,e)=>{},extract:t=>(t.getMonth()+1).toString().padStart(2,"0"),extractTod:t=>{}},monthShort:{label:"{M}",regexBit:"(0?\\d|1[012])",category:I.Months,numeric:!0,subtoken:"monthFull",apply:(t,e)=>t.setMonth(e-1),applyTod:(t,e)=>{},extract:t=>(t.getMonth()+1).toString(),extractTod:t=>{}},monthName:{label:"{MMMM}",regexBit:"("+E.map((t=>"(?:"+t+")")).join("|")+")",category:I.Months,numeric:!1,apply:(t,e)=>t.setMonth(E.indexOf(e)),applyTod:(t,e)=>{},extract:t=>E[t.getMonth()],extractTod:t=>{}},monthAbbrev:{label:"{MMM}",regexBit:"("+O.map((t=>"(?:"+t+")")).join("|")+")",category:I.Months,numeric:!1,apply:(t,e)=>t.setMonth(O.indexOf(e)),applyTod:(t,e)=>{},extract:t=>O[t.getMonth()],extractTod:t=>{}},dayFull:{label:"{DD}",regexBit:"(0[1-9]|[12]\\d|3[01])",category:I.Days,numeric:!0,apply:(t,e)=>t.setDate(+e),applyTod:(t,e)=>{},extract:t=>t.getDate().toString().padStart(2,"0"),extractTod:t=>{}},dayShort:{label:"{D}",regexBit:"(0?[1-9]|[12]\\d|3[01])",category:I.Days,numeric:!0,subtoken:"dayFull",apply:(t,e)=>t.setDate(+e),applyTod:(t,e)=>{},extract:t=>t.getDate().toString(),extractTod:t=>{}},dayOfWeekFull:{label:"{DDDD}",category:I.DayOfWeek,numeric:!1,regexBit:"("+Y.map((t=>"(?:"+t+")")).join("|")+")",apply:(t,e)=>{},applyTod:(t,e)=>{},extract:t=>Y[t.getDay()],extractTod:t=>{}},dayOfWeekShort:{label:"{DDD}",category:I.DayOfWeek,numeric:!1,regexBit:"("+C.map((t=>"(?:"+t+")")).join("|")+")",apply:(t,e)=>{},applyTod:(t,e)=>{},extract:t=>C[t.getDay()],extractTod:t=>{}},meridiem:{label:"{RR}",regexBit:"(AM|PM)",category:I.Meridiem,numeric:!1,apply:(t,e)=>{let i=t.getHours();"PM"===e&&i<12?t.setHours(i+12):"AM"===e&&12===i&&cate.setHours(0)},applyTod:(t,e)=>{},extract:t=>t.getHours()<12||0===t.getHours()?"AM":"PM",extractTod:t=>t[0]<12||0===t[0]?"AM":"PM"},hourFull:{label:"{hh}",regexBit:"([01]\\d|2[0-3])",category:I.Hours,numeric:!0,apply:(t,e)=>t.setHours(e),applyTod:(t,e)=>t[0]=e,extract:(t,e)=>{let i=t.getHours();return e&&e.includes(j.meridiem.label)&&(i%=12),i.toString().padStart(2,"0")},extractTod:(t,e)=>{let i=t[0];return e&&e.includes(j.meridiem.label)&&(i%=12),i.toString().padStart(2,"0")}},hourShort:{label:"{h}",regexBit:"([01]?\\d|2[0-3])",category:I.Hours,numeric:!0,subtoken:"hourFull",apply:(t,e)=>t.setHours(e),applyTod:(t,e)=>t[0]=e,extract:(t,e)=>{let i=t.getHours();return e&&e.includes(j.meridiem.label)&&(i%=12),i.toString()},extractTod:(t,e)=>{let i=t[0];return e&&e.includes(j.meridiem.label)&&(i%=12),i.toString()}},minuteFull:{label:"{mm}",regexBit:"([0-5]\\d)",category:I.Minutes,numeric:!0,apply:(t,e)=>t.setMinutes(e),applyTod:(t,e)=>t[1]=e,extract:t=>t.getMinutes().toString().padStart(2,"0"),extractTod:t=>t[1].toString().padStart(2,"0")},minuteShort:{label:"{m}",regexBit:"([0-5]?\\d)",category:I.Minutes,numeric:!0,subtoken:"minuteFull",apply:(t,e)=>t.setMinutes(e),applyTod:(t,e)=>t[1]=e,extract:t=>t.getMinutes().toString(),extractTod:t=>t[1].toString()},secondFull:{label:"{ss}",regexBit:"([0-5]\\d)",category:I.Seconds,numeric:!0,apply:(t,e)=>t.setSeconds(e),applyTod:(t,e)=>t[2]=e,extract:t=>t.getSeconds().toString().padStart(2,"0"),extractTod:t=>t[2].toString().padStart(2,"0")},secondShort:{label:"{s}",regexBit:"([0-5]?\\d)",category:I.Seconds,numeric:!0,subtoken:"secondFull",apply:(t,e)=>t.setSeconds(e),applyTod:(t,e)=>t[2]=e,extract:t=>t.getSeconds().toString(),extractTod:t=>t[2].toString()},millisecondFull:{label:"{nnn}",regexBit:"(\\d{3})",category:I.Milliseconds,numeric:!0,apply:(t,e)=>t.setMilliseconds(e),applyTod:(t,e)=>t[3]=e,extract:t=>t.getMilliseconds().toString().padStart(3,"0"),extractTod:t=>t[3].toString().padStart(3,"0")},millisecondShort:{label:"{n}",regexBit:"(\\d{,3})",category:I.Milliseconds,numeric:!0,subtoken:"millisecondFull",apply:(t,e)=>t.setMilliseconds(e),applyTod:(t,e)=>t[3]=e,extract:t=>t.getMilliseconds().toString(),extractTod:t=>t[3].toString()}};function V(t){return function(t){return j[t]}(function(t){return L[t]}(t))||{literal:!0}}delete j.yearShort,delete j.millisecondShort;const L=(()=>{let t={};for(let e in j)t[j[e].label]=e;return t})();function A(){return new Date(2e3,3,21,15,20,25,30)}class N extends e{constructor(t,e){super(e);let i=t.type;i||(i="none");let s="none";t.min&&(this.min=t.min,s=isValidDate(t.min)?"datetime":isValidTimeOfDay(t.min)?"timeofday":"unknown");let n="none";t.max&&(this.max=t.max,n=isValidDate(t.max)?"datetime":isValidTimeOfDay(t.max)?"timeofday":"unknown");let r=[s,n,i,function(t){let e=t.map((t=>L[t]));e=e.filter((t=>t));let i=e.map((t=>j[t].category));const s=[I.Hours,I.Minutes,I.Seconds,I.Milliseconds],n=[I.Years,I.Months,I.Days,I.Era];let r=!1;i.some((t=>n.includes(t)))&&(r=!0);let a=!1;return i.some((t=>s.includes(t)))&&(a=!0),a&&r?"datetime":a?"timeofday":r?"date":"unknown"}(t.formatting)];if(r=r.filter((t=>"none"!==t)),r.every((t=>t===r[0]))||(this.timestampType="unknown"),this.timestampType=r[0],this.formatting=[...t.formatting],!t.skipValidation&&!F(this))return void(this.timestampType="unknown");let a=[],l=[],o=[],h="apply",u="extract";"timeofday"===this.timestampType&&(h="applyTod",u="extractTod"),this.formatting.forEach((t=>{if(void 0!==L[t]){let e=V(t);a.push(e.regexBit),l.push(e[h]),o.push(e[u])}else a.push(p(t)),o.push((()=>t))}));let c=new RegExp(a.join(""));this._extractors=o,this._pattern=c,this._appliers=l,this.hasNoval&&null!==this.deformat(this.novalVal)&&(this.hasNoval=!1,delete this.novalVal)}min=void 0;max=void 0;formatting=null;timestampType="none";pattern=null;replacement=null;type="timestamp";domainType="ordinal";priority=3;toString(){let t="";var e;this.min&&this.max?t=this.format(this.min)+"-"+this.format(this.max):this.min||this.max?t=this.format(this.min?this.min:this.max):"datetime"===this.timestampType||"date"===this.timestampType?t=this.format(A()):"timeofday"===this.timestampType&&(t=this.format([(e=A()).getHours(),e.getMinutes(),e.getSeconds(),e.getMilliseconds()]));let i="X";return"date"===this.timestampType?i="D":"datetime"===this.timestampType?i="DT":"timeofday"===this.timestampType&&(i="TOD"),i+"{"+t+"}"}toFormatString(){return"Chronometric ("+this.timestampType+') "'+N.toShortFormatting(this.formatting)+'"'}format(t,e=!1){return this._extractors.map((e=>e(t,this.formatting))).join("")}deformat(t,e=!1){let i=null;if("timeofday"===this.timestampType)i=[15,20,25,30];else{if(!["time","date","datetime"].includes(this.timestampType))return i;i=A()}let s=t.match(this._pattern);return s?(e?this._verboseAppliers.forEach(((t,e)=>t(i,s[e+1],this.formatting))):this._appliers.forEach(((t,e)=>t(i,s[e+1],this.formatting))),t!==this.format(i,e)?null:(this._checkDomain(i),i)):null}isSupersetOf(t){if(this.formatting.length!==t.formatting.length)return!1;for(let e=0,i=this.formatting.length;e<i;e++){let i=V(this.formatting[e]),s=V(t.formatting[e]),n=j[s.subtoken];if(i.literal){if(!s.literal)return!1;if(this.formatting[e]!==t.formatting[e])return!1}else if(s!==i&&n!==i)return!1}return!0}isSubsetOf(t){return t.isSupersetOf(this)}isEqualTo(t){return this.isSubsetOf(t)&&this.isSupersetOf(t)}isSimilarTo(t){return this.isSubsetOf(t)||this.isSupersetOf(t)}_checkDomain(t){let e;if("timeofday"===this.timestampType)e=T;else{if("datetime"!==this.timestampType&&"date"!==this.timestampType)return;e=v}(void 0===this.min||e(this.min,t)>0)&&(this.min=t),(void 0===this.max||e(this.max,t)<0)&&(this.max=t)}static fromShortFormatting(t){let e=[];for(let t in j)e.push(j[t].label.slice(1,-1));let i=t,s=[];for(;i.length>0;){let t=e.filter((t=>i.startsWith(t)));if(t.length>0){let e=t.reduce(((t,e)=>t.length<e.length?e:t),"");s.push("{"+e+"}"),i=i.slice(e.length)}else s.push(i[0]),i=i.slice(1)}return s[0]=[s[0]],s=s.reduce(((t,e)=>t[t.length-1].endsWith("}")||e.startsWith("{")?(t.push(e),t):(t[t.length-1]=t[t.length-1]+e,t))),new N({formatting:s})}static toShortFormatting(t){return t.map((t=>t.replace(/\{(.*)\}/,"$1"))).join("")}}class P extends e{domain=[];constructor({domain:t=[]},e){super(e),t&&(this.domain=t)}format(t){return this.domain.includes(t)?t:void 0}deformat(t){return this.domain.includes(t)?t:void 0}isSubsetOf(t){return this.domain.every((e=>t.domain.includes(e)))}isSupersetOf(t){return t.isSubsetOf(this)}isEqualTo(t){return this.isSubsetOf(t)&&this.isSupersetOf(t)}isSimilarTo(t){return this.isSubsetOf(t)||this.isSupersetOf(t)}size(){return this.domain.length}toString(){return`E{[${this.domain}]}`}toFormatString(){return"Categorical"}toDebugString(){return`Usetype.Enum([${this.domain}])`}compatibleTypes=["string"];type="string";domainType="nominal";priority=1}class H extends e{constructor(t){super(t),t.potentialIds&&(this.unique=!0),t.constant&&(this.constant=!0,this.constantValue=t.constant),t.type&&(this.kind=t.type)}format(t){return t.toString()}deformat(t){return t.toString()}isSubsetOf(t){return t.type===this.type||this.type&&!t.type}isSupersetOf(t){return t.isSubsetOf(this)}isEqualTo(t){return this.isSubsetOf(t)&&this.isSupersetOf(t)}isSimilarTo(t){return this.isSubsetOf(t)||this.isSupersetOf(t)}toString(){return this.unique?"SID{"+(this.type??"")+"}":this.constant?"SC("+this.constantValue+"){"+(this.type??"")+"}":"S{"+(this.kind??"")+"}"}toFormatString(){let t="Custom/Unknown";return this.kind&&(t+=" of kind "+this.kind),t}compatibleTypes=["string"];type="string";domainType="nominal";priority=0}const U={skipConstants:!1,sizeHardLimit:50,sampleSize:500};function $(t,e){let i=[],s=function(t,e){if(!e.sizeHardLimit)return!0;let i=t.every((t=>t.length<e.sizeHardLimit));return i||(e.limitExceeded=!0),i}(t,e=Object.assign(e??{},U)),n=[];if(s&&([t,n]=function(t,e){let i=function(t,e){if(!t||0===t.length)return[];let i={};for(let e in t)i[t[e]]||(i[t[e]]=[]),i[t[e]].push(e);let s=[];for(let t in i)s.push([t,i[t].length]);if(s=s.sort(((t,e)=>t[1]-e[1])),1===s.length)return e.isConstant=!0,e.constantVal=s[0][0],[];if(s.length===t.length)return e.potentialIds=!0,e.ambiguousSets=[],[];let n=[];for(let t in i)i[t].length>1&&n.push(i[t]);return e.ambiguousSets=n,t.length/s.length>.5&&s[0][1]>=2&&s.length>2?[new P({domain:s.map((t=>t[0]))},{ambiguousSets:n})]:s[s.length-1][1]/s[s.length-2][1]>2&&s[s.length-2][1]>0?(e.hasNoval=!0,e.novalVal=s[s.length-1][0],[]):[]}(t,e);return e.hasNoval&&(t=t.filter((t=>t!==e.novalVal))),e.isConstant&&(t=[t[0]]),[t,i]}(t,e),i.push(...n)),(!e.skipConstants||!e.isConstant)&&s){let s=function(t,e){if(!t||0===t.length)return[];let i=[];i=[...t].sort().slice(0,5);let s=m(i,e),n=s.map((()=>0));for(let i=0,r=t.length;i<r;i++){let r,a=t[i];for(let t=0,i=s.length;t<i;t++)if(!s[t].disabled){let i=s[t].deformat(a);if(null!==i)n[t]++,s[t].max<i&&(s[t].max=i),s[t].min>i&&(s[t].min=i);else{r||(r=m([a],e));let i=!1;for(let e=0,n=r.length;e<n;e++)if(r[e].isSupersetOf(s[t])){i=!0;let n=r[e].deformat(a);r[e].min=Math.min(n,s[t].min),r[e].max=Math.max(n,s[t].max),s[t]=r[e],r.splice(e,1);break}i||(s[t].disabled=!0)}}if(0===s.length)return[]}return s.forEach(((e,i)=>e.confidence=n[i]/t.length)),s=s.filter((t=>!t.disabled)),s}(t,e);i.push(...s);let n=function(t,e){let i=function(t){return D||function(){let t=[];const e=[["{YYYY}","{MM}","{DD}"],["--","{MM}","{DD}"]];t=t.concat(e);const i=[["{YYYY}","-","{MM}","-","{DD}"],["{YYYY}","-","{MM}"],["--","{MM}","-","{DD}"]];t=t.concat(i);const s=[["T","{hh}","{mm}","{ss}",".","{nnn}"],["T","{hh}","{mm}","{ss}"],["T","{hh}","{mm}"],["T","{hh}"]];t=t.concat(s);let n=[];for(let t of e)for(let e of s)n.push(t.concat(e));t=t.concat(n);const r=[["{hh}",":","{mm}",":","{ss}",".","{nnn}"],["{hh}",":","{mm}",":","{ss}"],["{hh}",":","{mm}"]];t=t.concat(r);let a=[];for(let t of i)for(let e of r)a.push(t.concat(["T"],e));t=t.concat(a);const l=[".","-","/"],o=[":","."],h=[" ","\t"],u=[["{DD}","{MM}","{YYYY}"],["{DD}","{MM}","{YY}"],["{MM}","{DD}","{YYYY}"],["{MM}","{DD}","{YY}"],["{YYYY}","{MM}","{DD}"]],c=[["{hh}","{mm}","{ss}","{nnn}"],["{hh}","{mm}","{ss}"],["{hh}","{mm}"]];let p=[];for(let t of u)for(let e of l)p.push(d(t,e));t=t.concat(p);let m=[];for(let t of c)for(let e of o)m.push(d(t,e));t=t.concat(m);let f=[];for(let t of p)for(let e of m)f=f.concat(h.map((i=>[].concat(t,[i],e))));t=t.concat(f),D=t}(),D.map((e=>new N({formatting:e,skipValidation:!0},t)))}(e);if(i=k(t,i),i=w(i),i.length>0)return i;let s=function(t,e){let i=[],s={},n={},r=Object.keys(j);for(let e of t)a(e).forEach((t=>{n[t]||(n[t]=!0,i.push(t))}));return i.map((t=>new N({formatting:t},e)));function a(t,e=[],i=0){if(""===t)return[[]];if(s[[t,"|",e]])return s[[t,"|",e]];let n=[];for(let s=i,l=r.length;s<l;s++){let i=j[r[s]];if(e.includes(i.category))continue;let l=new RegExp(i.regexBit),o=t.match(l);if(o){let s=[i.category,...e],r=t.split(o[1]),l=r[0],h=r.slice(1).join(o[1]),u=a(l,s);for(let t of u){let e=t.map((t=>V(t).category)).filter((t=>t)),r=a(h,[].concat(s,e));for(let e of r){let s=[].concat(t,[i.label],e);n.push(s)}}}}return n.length>0?(s[[t,"|",e]]=n,n):(s[[t,"|",e]]=[[t]],[[t]])}}(t.slice(0,5),e);return s=s.filter(F),s=k(t,s),s=w(s),s}(t,e);i.push(...n)}return 0===i.length&&(i=function(t,e){let i=Object.assign({},e);return t.slice(0,10).every((t=>/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(t)))&&(i.type="url"),[new H(i)]}(t,e)),i}function z(t){if(0===t.length)return!1;if(1===t.length)return t[0].every((t=>1===t.length));let e=t[0],i=t.slice(1);for(let t=0;t<e.length;t++){let s=e[t],n=[];for(let r=0;r<e[t].length;r++){let t=s[r],e=[];for(let s=0;s<i.length;s++){let n=i[s];for(let r=0;r<i[s].length;r++){let i=n[r].indexOf(t);if(-1!==i){e.push([r,i]);break}}}n.push(e)}for(let t=0;t<s.length;t++)if(n.map((e=>e[t])).filter((t=>void 0!==t)).some((t=>h(t.filter((t=>void 0!==t))))))return!1}return!0}let W;function q(t,e,i){i.keys.map((t=>e[t])),i.keys.map((t=>e[t]));let s=[];for(let t in W){let n=W[t],r=!0,a=n.constraints;if(a){let t=a.xAxis;t&&(R(t,0,e,i.keys)||(r=!1));let s=a.yAxis;s&&(R(s,0,e,i.values)||(r=!1))}r&&s.push(n.type)}return s}function R(t,e,i,s,n=!1){if(!t||0===t.length||!s||0===s.length)return!1;if(!n&&t.length!==s.length)return!1;if(n&&1!==t.length)return!1;for(let e in s){let r=t[0];n||(r=t[e]);let a=i[s[e]];if(r.domainType&&r.domainType!==a.domainType)return!1;if(r.type&&r.type!==a.type)return!1;r.range&&r.range}return!0}const J=[[255,99,132],[255,159,64],[255,205,86],[75,192,192],[54,162,235],[153,102,255],[201,203,207]];function K(t){let e;if(t<J.length)e=J[t];else if(t<J.length**2){let i=Math.floor(t/J.length);e=function(...t){return[Math.floor(t.map((t=>t[0])).reduce(((t,e)=>t+e))/t.length),Math.floor(t.map((t=>t[1])).reduce(((t,e)=>t+e))/t.length),Math.floor(t.map((t=>t[2])).reduce(((t,e)=>t+e))/t.length)]}(J[i],J[t%J.length])}else e=[Math.floor(255*Math.random()),Math.floor(255*Math.random()),Math.floor(255*Math.random())];return"rgba("+e.join(", ")+")"}class Q{_head=[];_headValid=!1;get head(){return this._headValid||this._checkHeaderValidity(),this._head}_data=[];get height(){return this._data.length}get width(){return(this._data[0]??[]).length}get length(){return this.height*this.width}get data(){return this._data}row(t){return this._data[t]}col(t){return this._data.map((e=>e[t]))}_usetypesLoaded=!1;_usetypes=[];get usetypes(){return!this._usetypesLoaded&&this._auto&&this._determineUsetypes(),this._usetypes}_meta={};get meta(){return this._meta}_dataErr=[];get errors(){return this._dataErr}_bindingsLoaded=!1;_bindings=[];get size(){return this._bindings.length}get bindings(){return!this._bindingsLoaded&&this._auto&&this._createBindings(),this._bindings}_keySets=[];get keySets(){return this._keySetsLoaded||this._generateKeySets(),this._keySets}_keySetsLoaded=!1;_valueSets=[];get valueSets(){return this._valueSetsLoaded||this._generateValueSets(),this._valueSets}_valueSetsLoaded=!1;constructor({auto:t=!0}={}){this._auto=t}_reset(){this._head=[],this._data=[],this._dataErr=[],this._meta={},this._usetypes=[],this._keySets=[],this._valueSets=[],this._bindings=[],this._usetypesLoaded=!1,this._bindingsLoaded=!1,this._keySetsLoaded=!1,this._valueSetsLoaded=!1;for(let t in Chart.instances)Chart.instances[t].destroy()}setAutomatic(t){this._auto=t}setData(t){this._reset();let e=t.data;1===e[e.length-1].length&&""===e[e.length-1][0]&&e.splice(-1),e.every((t=>0===t[t.length-1].trim().length))&&(e=e.map((t=>t.slice(0,-1))));let i=e.slice(0,20),s=e.slice(e.length-20,e.length),n=i.concat(s).map((t=>t.length)).reduce(((t,e)=>(t[e]?t[e]++:t[e]=1,t)),{});n=function(t){let e=[];for(let i in t)e.push([i,t[i]]);return e}(n),n.sort(((t,e)=>e[1]-t[1]));let r=n[0][0],a=0;for(;e[a++].length!=r;);for(e.splice(0,a-1),a=e.length-1;e[a--].length!=r;);e.splice(a+1,e.length-a),this._head=e[0],this._data=e.slice(1),this._meta=t.meta,this._dataErr=t.errors,this.triggerEvent(X.sourceChange,t)}loadFromUrl(t,e){Papa.parse(t,{encoding:"utf8",download:!0,skipEmptyFiles:!0,preview:0,complete:t=>this.setData(t)})}loadFromLocal(t,e){Papa.parse(t,{encoding:"utf8",skipEmptyFiles:!0,preview:0,complete:t=>this.setData(t)})}setUsetypes(t){this._auto||(this._usetypes=t)}_determineUsetypes(){this._usetypes=[],this._allUsetypes=[];for(let t=0,e=this.width;t<e;t++){let e=$(this.col(t),{header:this._head[t]});this._allUsetypes.push(e),1===e.length||(e.filter((t=>"timestamp"===t.type)).length>1&&(window.determinedUsetypes=e,e=e.filter((t=>"timestamp"!==t.type))),e.sort(((t,e)=>e.priority-t.priority))),this._usetypes[t]=e[0]}this._usetypesLoaded=!0,this._checkHeaderValidity()}_checkHeaderValidity(){this._headValid=!1;for(let t=0;t<this._head.length;t++){let e=this.usetypes[t];e.hasNoval&&(e.novalVal,this._head[t]),null===e.deformat(this._head[t])&&(this._headValid=!0)}if(!this._headValid){this._data=[this._head,...this._data],this._head=this._usetypes.map((t=>t.toString())),this._headValid=!0;for(let t=0;t<this._usetypes.length;t++)if(this._usetypes[t].ambiguousSets){this._usetypes[t].ambiguousSets=this._usetypes[t].ambiguousSets.map((t=>t.map((t=>+t+1))));let e=this._usetypes[t].ambiguousSets.map((e=>this._data[e[0]][t]));for(let i=0;i<e.length;i++)this._data[0][t]===e[i]&&this._usetypes[t].ambiguousSets[i].push(0)}}}createBindings(t){if(!this._auto)throw new Error("Not implemented");return this._createBindings(),this._bindings}_createBindings(){this._bindings=[];for(let t of this.keySets)for(let e of this.valueSets){let i=c(t,e);if(i.length>0){if(i.length===t.length||i.length===e.length)continue;e=e.filter((t=>!i.includes(t)))}let s=q(this.data,this.usetypes,{keys:t,values:e}).map((i=>new G(this,{keyIdxs:t,valueIdxs:e,chartType:i})));this._bindings=this._bindings.concat(s)}this._bindingsLoaded=!0}_generateKeySets(){let t=this.usetypes,e=[...Array(this.usetypes.length).keys()],i=e.filter((e=>t[e].potentialIds)),s=(e.filter((e=>t[e].isConstant)),t.filter((t=>!t.potentialIds&&!t.isConstant&&!t.ignored))),n=e.filter((e=>!t[e].potentialIds&&!t[e].isConstant)),r=(l=s.map((t=>t.ambiguousSets)),function(t){let e=[...Array(t.length).keys()].reduce(((t,e)=>t.concat(t.map((t=>[e,...t])))),[[]]),i=e.map((()=>!1)),s=[];for(let n in e){if(i[n])continue;let r=e[n];z(t.filter(((t,e)=>r.includes(e))))&&(s.push(r),i=i.map(((t,i)=>t||u(r,e[i]))))}return s}(l)).map((t=>t.map((t=>n[t])))),a=function(t){let e=[];for(let i=0;i<t.length;i++){let s=!0;for(let e=0;e<t.length;e++)if(i!==e&&u(t[e],t[i])){s=!1;break}s&&e.push(t[i])}return e}(r);var l;a.length!==r.length&&(r=a),this._keySets=i.map((t=>[t])).concat(r),0===this._keySets.length&&(this._keySets=[[-1]],this._usetypes[-1]=y.getIdUsetype(),this._data.forEach(((t,e)=>t[-1]=e))),this._keySetsLoaded=!0}_generateValueSets(){let t=[];this.usetypes.forEach(((e,i)=>{"ordinal"===e.domainType&&t.push(i)}));let e=t.map((t=>this.usetypes[t])),i=e.filter((t=>"number"===t.type));i.forEach(((t,e)=>t.order=e));let s=i.reduce(r,[]).map((t=>t.map((t=>this.usetypes.indexOf(t))))),n=e.filter((t=>"timestamp"===t.type)).reduce(r,[]).map((t=>t.map((t=>this.usetypes.indexOf(t)))));function r(t,e){let i=!1,s=t.length;for(let n=0;n<s;n++){let s=t[n],r=[];for(let t of s)t.isSimilarTo(e)&&r.push(t);r.push(e),r.length-1===s.length?(s.push(e),i=!0):r.length>1&&(t.push(r),i=!0)}return i||t.push([e]),t}this._valueSets=s.concat(n),this._valueSetsLoaded=!0}setBindingElementId(t,e){this._bindings[t].boundElementId=e}drawBinding(t){this._drawBinding(this._bindings[t])}_drawBinding(t){!function(t,e,i,s){if(s.type||(s.type=q(0,i,s)[0]),s.head||(s.head=[...Object.keys(Array(i.length))]),"bubble"===s.type)return function(t,e,i,s){let n,r=[],a=s.keys[0],l=i[a],o=s.header[a],h=s.keys[1],u=i[h],c=s.header[h],d=s.values[0],p=i[d],m=s.header[d],f=0;for(let t of e){let e=l.deformat(t[a]),i=u.deformat(t[h]),s=p.deformat(t[d]);r.push({x:e,y:i,r:s}),f=Math.max(f,s)}if(f>10){n=Math.floor(Math.log10(f));for(let t of r)t.r/=10**n}let g={type:s.type,data:{datasets:[{label:"("+o+")x("+c+") => "+m+(n?"(e"+n+")":""),data:r,borderColor:K(0),backgroundColor:K(1)}]}};return new Chart(document.getElementById(t),g)}(t,e,i,s);if("pie"===s.type||"doughnut"===s.type)return function(t,e,i,s){let n=s.keys[0],r=i[n],a=(s.header[n],s.values[0]),l=i[a],o=s.header[a],h=[],u=[];for(let t of e)h.push(r.deformat(t[n])),u.push(l.deformat(t[a]));let c={type:s.type,data:{labels:h,datasets:[{label:o,data:u,backgroundColor:e.map(((t,e)=>K(e)))}]}};return new Chart(document.getElementById(t),c)}(t,e,i,s);let n=[],r=[],a=s.keys.map((t=>s.header[t])).join(", "),l=s.values.map((t=>s.header[t])),o=s.keys.map((t=>i[t])),h=s.values.map((t=>i[t]));for(let t of e){let e=s.keys.map((e=>t[e])).join(", ");r.push(e);let i={};i.x=e;for(let e=0;e<h.length;e++)i["y"+e]=h[e].deformat(t[s.values[e]]);n.push(i)}let u=[];for(let t=0;t<h.length;t++){let e={label:l[t],data:n,parsing:{yAxisKey:"y"+t},borderColor:K(t),backgroundColor:K(t)};u.push(e)}let c,d,p={labels:r,datasets:u};h[0].min&&(c=Math.min(...h.map((t=>t.min))),d=Math.max(...h.map((t=>t.max))));let m={scales:{}};m.scales.x={display:!0,title:{display:!0,labelString:a}},1===o.length&&"timestamp"===o[0].type&&(m.scales.x.type="time"),1===o.length&&o[0].min&&(m.scales.x.min=o[0].min,m.scales.x.max=o[0].max);for(let t=0;t<h.length;t++)m.scales["y"+t]={display:!0,title:{display:!0,labelString:l[t]}},"timestamp"===h[t].type&&(m.scales["y"+t]={type:"time"}),h[t].min&&(m.scales["y"+t]=m.scales["y"+t]??{},m.scales["y"+t].min=c,m.scales["y"+t].max=d);let f={type:s.type,data:p,options:m};new Chart(document.getElementById(t),f)}(t.boundElementId,this.data,this.usetypes,{keys:t.keyIdxs,values:t.valueIdxs,header:this.head,type:t.chartType})}}class G{_catalogue;_keyIdxs;get keyIdxs(){return this._keyIdxs}_valueIdxs;get valueIdxs(){return this._valueIdxs}_boundElementId;get boundElementId(){return this._boundElementId}set boundElementId(t){this._boundElementId||(this._boundElementId=t)}get usedFeatures(){return[this._keyIdxs,this._valueIdxs]}_chartType;get chartType(){return this._chartType}constructor(t,{keyIdxs:e=[],valueIdxs:i=[],chartType:s="",boundElementId:n=null}){this._catalogue=t,this._chartType=s,this._keyIdxs=e,this._valueIdxs=i,n&&(this._boundElementId=n)}}const X={sourceChange:"dataChanged",usetypeChange:"usetypesChanged",bindingChange:"bindingsChanged"};var Z,tt;Z=Q,tt=Object.values(X),t.events=Z.prototype.events??{},tt.forEach((e=>t.events[e]=[])),Object.assign(Z.prototype,t),window.Catalogue=Q,window.Init=function(t){fetch("https://raw.githubusercontent.com/SaNuelson/DataChartRenderer/master/src/json/chart.js.json").then((t=>t.json())).then((e=>{!function(t){if(W)console.error("Chart.js integration template data already defined.");else{W={};for(let e of t.ChartTypes)W[e.label]=e}}(e),t.onChartTemplatesLoaded&&t.onChartTemplatesLoaded()})).catch((t=>console.error(t)))},window.hardRowLimit=0})();