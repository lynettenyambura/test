"use strict";

// const moment = require("moment");
import moment from "moment";

function getSeeds() {
    let start = moment();
    let stop = moment().subtract(1, 'months');

    //override for manual range
    // start = moment("2020-02-02");
    // stop = moment("2020-03-02");

    if (start.isAfter(stop))
        [start, stop] = [stop, start];
    const seeds = [];
    let date = stop.clone();
    while (date.isSameOrAfter(start)) {
        if (date.isoWeekday() <= 5)
            seeds.push(`https://juris.pjud.cl/busqueda?Buscador_Jurisprudencial_de_la_Corte_Suprema&date=${date.format("YYYY-MM-DD")}`);
        date.subtract(1, 'days');
    }
    return seeds;
}

const testSeeds = function () {
    let seeds = getSeeds();
    console.log(JSON.stringify(seeds, null, 4));
    console.log(`${seeds.length} links generated`);
};
testSeeds();
