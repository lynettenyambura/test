"use strict";

const usageExamples = async function (URL) {
    let doc = {URL};
    const times = await getUrlDates({URL}) || {};
    Object.assign(doc, times);
};

const getUrlDates = async function ({URL}) {
    let urlVersions = [URL, decodeURI(URL), encodeURI(URL), encodeURI(decodeURI(URL))].filter((c, i, a) => a.indexOf(c) === i);
    let ids = [];
    urlVersions.forEach(urlToParse => {
        const urlToParseId = "H" + new Buffer(URL).toString("base64");
        const urlToParseId2 = "H" + sha256(URL) + ".N";
        ids.push(urlToParseId, urlToParseId2);
    })
    try {
        const resp = await graphql(`
          query {
            nodes(ids: [${ids.filter((c, i, a) => a.indexOf(c) === i).map(x => `"${x}"`).join(", ")}]) {
                __typename
                ... on CrawledURL {
                  URL
                  firstSeen
                  lastSuccessfulRequest {
                    fetchedAt
                    
                  }
                }
            }
          }`);
        let node = resp.nodes && resp.nodes.filter(n => n)[0];
        return node && {
            firstFetched: node.firstSeen,
            lastFetched: node.lastSuccessfulRequest && node.lastSuccessfulRequest.fetchedAt
        } || {};
    } catch (e) {
        console.error("Error getting dates for " + URL, e);
    }
    return {};
};
