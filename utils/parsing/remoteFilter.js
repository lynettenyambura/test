"use strict";

const runRemoteFilter = async function ({URL, id, filter}) {
    let htmlContent = "";
    const URLId = URL && "H" + new Buffer(URL).toString("base64");
    const URLIdN = URL && "H" + sha256(URL) + ".N";
    // const filter = "pdf2htmlEx";
    let query = `
              query {` +
        `
                nodes(ids: ["${URL && `${URLId}", "${URLIdN}` || `${id}`}"]) {`
        + `               id
                ... on CrawledURL {
                  lastSuccessfulRequest {
                    outputForFilter(filter: "${filter}")
                  }
                }
              }
            }`;
    const resp = await graphql(query);

    let node = resp.nodes.filter(n => n)[0];

    if (node && node.lastSuccessfulRequest && node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content) {
        let _html = node.lastSuccessfulRequest.outputForFilter[0].filterOutput.content;
        htmlContent += _html;
    } else {
    }
    return htmlContent;
};
