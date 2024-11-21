"use strict";

// const moment = require("moment");
import moment from "moment";

function getSeeds() {
    let start = moment();
    let stop = moment().subtract(1, 'months');

    //override for manual range
    start = moment("2023-11-19");
    stop = moment("2023-11-21");

    let issuers = {
        "Buscador_Jurisprudencial_de_la_Corte_Suprema": false,
        "Buscador_Corte_de_Apelaciones": false,
        "Sentencias_Penales": !false,
        "Sentencias_Cobranza": false,
        "Compendio_de_Salud_de_Corte_Suprema": false,
        "Compendio_de_Salud_Corte_de_Apelaciones": false,
        "Sentencias_Laborales": false,
        "Sentencias_de_Familia": false,
        "Sentencias_Civiles": false,
    }

    let rangeDivisions = {
        "unit": "days",
        'number': 1
    }

    if (start.isAfter(stop))
        [start, stop] = [stop, start];
    const seeds = [];
    while (stop.isSameOrAfter(start)) {
        let limit = stop.clone().subtract(rangeDivisions.number, rangeDivisions.unit).add(1, 'day');
        if (limit.isBefore(start))
            limit = start.clone();
        for (let issuer of Object.keys(issuers)) {
            if (!issuers[issuer]) continue;
            let url = `https://juris.pjud.cl/busqueda?${issuer}&from=${limit.format("YYYY-MM-DD")}&to=${stop.format("YYYY-MM-DD")}&pageSize=60&page=1`;
            //skip weekend only searches
            if (!/day/i.test(rangeDivisions.unit) || rangeDivisions.number > 2 || rangeDivisions.number === 1 && limit.isoWeekday() <= 5 || rangeDivisions.number === 2 && limit.isoWeekday() !== 6)
                seeds.push(url);
        }
        stop = limit.clone().subtract(1, 'days');
    }
    return seeds;
}

const testSeeds = function () {
    let seeds = getSeeds();
    console.log(JSON.stringify(seeds, null, 4));
    console.log(`${seeds.length} links generated`);
};
testSeeds();
