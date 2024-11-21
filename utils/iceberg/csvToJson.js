"use strict";

const csv = require("csv-parse/sync");
const fs = require("fs");

let pathToCSV = __dirname + `/pdf/2022-10-28T02_57_14.820Z (1).csv`;
let icbgCsv = fs.readFileSync(pathToCSV);

let URIs = csv.parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
}).reduce((acc, x) => {
    let URI = x.URI || x.URL;
    URI && /collections/i.test(URI) && acc.push(URI);
    return acc;
}, []);

let i = 1;
const uriToA = function (uri) {
    console.log(i);
    return `   <a href="${uri}">${++i}</a>${i % 25 === 0 ? "<br/>" : ""}`;
};
URIs = URIs.map((u) => {
    if (Array.isArray(u))
        return u.map(uriToA).join(" \n")
    return uriToA(u);
})
icbgCsv = `<html>
 <body>
  <div>
   ${URIs.join("\n")}
  </div>
</body>
</html>`;
fs.writeFileSync(__dirname + `/pdf/csv.html`, icbgCsv)

