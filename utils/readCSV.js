"use strict";

// const csv = require("csv-parse/sync");
// const fs = require("fs");

import { parse } from "csv-parse/sync";
import fs from 'fs';
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

let pathToCSV = path.join(__dirname, 'pdf', 'I06s73iee2hq9vz-preview.csv')


// let pathToCSV = __dirname + `/pdf/I06s73iee2hq9vz-preview.csv`;
let icbgCsv = fs.readFileSync(pathToCSV);

let values = parse(icbgCsv, {
    columns: true,
    skip_empty_lines: true
}).reduce((acc, x) => {
    //add x['Tribunal de Origen'] to acc
    x['Tribunal de Origen'] && acc.add(x['Tribunal de Origen']);
    return acc;
}, new Set());

//convert set to array, and sort it
values = Array.from(values).sort();
// console.log(JSON.stringify(values, null, 4));

fs.writeFileSync(path.join(__dirname, 'pdf', 'tribunales-de-origen.txt'), values.join("\n"));


// fs.writeFileSync(__dirname + `/pdf/tribunales-de-origen.txt`, values.join("\n"))

