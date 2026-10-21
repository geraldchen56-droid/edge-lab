/* Edge Lab i18n runtime: T("English template {0}", a) -> translated string. Dictionaries live in i18n/<lang>.js */
(function(){
"use strict";
const D=window.EL_DICT||{};
window.EL_LANG=document.documentElement.dataset.lang||"en";
window.T=function(key){let s=Object.prototype.hasOwnProperty.call(D,key)&&D[key]?D[key]:key;
  for(let i=1;i<arguments.length;i++)s=s.split("{"+(i-1)+"}").join(arguments[i]);return s};
})();
