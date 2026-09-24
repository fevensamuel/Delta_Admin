import{c as u}from"./index-Bjb4EdBU.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],y=u("arrow-left",h);function E(l,o=1200,a=1200,F=.82){return new Promise((d,s)=>{if(!l.type.startsWith("image/")){s(new Error("File is not an image"));return}const c=new FileReader;c.onerror=()=>s(new Error("Failed to read image file")),c.onload=g=>{var w;const r=new Image;r.onerror=()=>s(new Error("Failed to load image object")),r.onload=()=>{var m;let e=r.width,t=r.height;(e>o||t>a)&&(e/t>o/a?(t=Math.round(t*o/e),e=o):(e=Math.round(e*a/t),t=a));const n=document.createElement("canvas");n.width=e,n.height=t;const i=n.getContext("2d");if(!i){d((m=g.target)==null?void 0:m.result);return}i.fillStyle="#FFFFFF",i.fillRect(0,0,e,t),i.drawImage(r,0,0,e,t);const f=n.toDataURL("image/jpeg",F);d(f)},r.src=(w=g.target)==null?void 0:w.result},c.readAsDataURL(l)})}export{y as A,E as c};
