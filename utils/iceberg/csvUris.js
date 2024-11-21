"use strict";

const csv = require("csv-parse/sync");
const fs = require("fs");

let pathToCSV = __dirname + `/pdf/2022-11-29T06_40_22.724Z.csv`;
let icbgCsv = fs.readFileSync(pathToCSV);

let URIs = csv.parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
}).filter((r) => r.local_court);

let organos = {};

URIs.forEach((r) => {
    if (!organos[r.local_court]) {
        organos[r.local_court] = new Set();
    }
    organos[r.local_court].add(`/${r.search_organo}/${r.search_materia}/${r.search_numero}/`);
});
for (let org in organos) {
    if (organos[org].size > 1) throw new Error(`organo ${org} has more than one Param combination`);
    organos[org] = organos[org].values().next().value;
}
let keys = Object.keys(organos).sort();
let sortedOrganos = keys.reduce((acc, key) => {
    acc[key] = organos[key];
    return acc;
}, {});
console.log(JSON.stringify(sortedOrganos, null, 4));
