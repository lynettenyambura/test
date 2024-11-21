"use strict";

// const moment = require("moment");
import moment from "moment";

function getSeeds() {
    let yearTo = moment().year();
    let yearFrom = moment().subtract(1, 'months').year();

    //override for manual range
    // yearFrom = 2018;
    // yearTo = 2018;

    if (yearFrom > yearTo)
        [yearFrom, yearTo] = [yearTo, yearFrom];

    let seeds = [];
    for (let year = yearFrom; year <= yearTo; year++) {
        if (moment().year(year).month(0).date(1).isSameOrBefore(moment(), 'day')) {
            // if date <= current date, add link for Q1 for current year
            seeds.push(`https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR1/`);
        }
        if (moment().year(year).month(3).date(1).isSameOrBefore(moment(), 'day')) {
            // if date <= current date, add link for Q2 for current year
            seeds.push(`https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR2/`);
        }
        if (moment().year(year).month(6).date(1).isSameOrBefore(moment(), 'day')) {
            // if date <= current date, add link for Q3 for current year
            seeds.push(`https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR3/`);
        }
        if (moment().year(year).month(9).date(1).isSameOrBefore(moment(), 'day')) {
            // if date <= current date, add link for Q4 for current year
            seeds.push(`https://www.sec.gov/Archives/edgar/daily-index/${year}/QTR4/`);
        }
    }
    return seeds;
}

const testSeeds = function () {
    let seeds = getSeeds();
    console.log(JSON.stringify(seeds, null, 4));
    console.log(`${seeds.length} links generated`);
};
testSeeds();
