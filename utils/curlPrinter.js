"use strict";


var s = `VARAPROC=1500%401100%401101%401102%401200%401203%401204%401300%401305%401306%401400%401407%401408%402001%402101%402102%402103%402111%402112%402113%402114%402115%402116%402117&BOTAOCONSULTA=0&TIPOCONSULTA=0&ArgPes=&ArgPesTxt=&NumDoc=&NomRelat=&TpRelator=1&datainicio=01%2F01%2F2020&datafim=15%2F03%2F2020&TpData=1&SJ_ORGAO=&TipoProcesso=&SJ_TURMA_OPT=&SJ_TODAS=1&SJ_TURMA%5B%5D=1500&SJ_TURMA%5B%5D=1100&SJ_TURMA%5B%5D=1101&SJ_TURMA%5B%5D=1102&SJ_TURMA%5B%5D=1200&SJ_TURMA%5B%5D=1203&SJ_TURMA%5B%5D=1204&SJ_TURMA%5B%5D=1300&SJ_TURMA%5B%5D=1305&SJ_TURMA%5B%5D=1306&SJ_TURMA%5B%5D=1400&SJ_TURMA%5B%5D=1407&SJ_TURMA%5B%5D=1408&SJ_TURMA%5B%5D=2001&SJ_TURMA%5B%5D=2101&SJ_TURMA%5B%5D=2102&SJ_TURMA%5B%5D=2103&SJ_TURMA%5B%5D=2111&SJ_TURMA%5B%5D=2112&SJ_TURMA%5B%5D=2113&SJ_TURMA%5B%5D=2114&SJ_TURMA%5B%5D=2115&SJ_TURMA%5B%5D=2116&SJ_TURMA%5B%5D=2117&CONSULTA_ACORDAO=checked&CONSULTA_SUMULA=checked&CONSULTA_SUMULA_VINC=checked&CONSULTA_DECISAO=checked&CONSULTA_ARGUICAO=checked&RegistroInicial=1
`;
// s = s.replace(/%3A/g,":");
s = unescape(s);
console.log(s);

var querystring = require("querystring");
var x = querystring.parse(s);
console.log(JSON.stringify(x, null, 4));
s = s.split("&");
var querystring = require("querystring");
querystring.parse(s);
var kvs = [];
console.log("var params = {};");
// console.log("var form = new FormData();");
console.log("");
for (var i = 0; i < s.length; i++) {
    var p = s[i];
    var ind = p.indexOf("=");
    var key = p.substring(0, ind);
    var val = p.substring(ind + 1);
    // if (val.length > 20)
    //     val = "";
    kvs.push("params['" + key + "'] = " + "\"" + val + "\";");
    // kvs.push("form.append('" + key + "', '" + val + "');");
    console.log(`${key}${val&&`=${val}`}`);
}
console.log("");
kvs.sort();
for (var i = 0; i < kvs.length; i++)
    console.log(kvs[i]);
