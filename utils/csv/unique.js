"use strict";

const csv = require("csv-parse/sync");
const fs = require("fs");

const columns = ['section']

let pathToCSV = __dirname + `/pdf/chubut.csv`;
let csvString = fs.readFileSync(pathToCSV);

let rows = csv.parse(csvString, {
    columns: true,
    skip_empty_lines: true
})
for (let i = 0; i < columns.length; i++) {
    let column = columns[i];
    let outputDir = pathToCSV.replace(/[^\/\\]+$/i, "");
    let outputFile = outputDir+column.replace(/\W+/ig, "-")+".txt";
    let string = rows.map(x=>x[column]).filter((c, i, a) => c && c.trim() && a.indexOf(c) === i).join("\n");
    fs.writeFileSync(outputFile, string);
    console.log(`saved unique '${column}' values to ${outputFile}`);
}



