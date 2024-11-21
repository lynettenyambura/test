"use strict";

async function splitPDF({pdfURL, startPage = 1, endPage = 'end', locale}) {
    const URLId = "H" + new Buffer(pdfURL).toString("base64");
    const URLIdN = "H" + sha256(pdfURL) + ".N";
    const resp = await graphql(`
            query {
              nodes(ids: ["${URLId}", "${URLIdN}"]) {
                id
                ... on CrawledURL {
                  lastSuccessfulRequest {
                    outputForFilter(filter: "getPDFRange", arguments: {FROM: "${startPage}", TO: "${endPage}"})
                  }
                }
              }
            }`);
    const res = resp.nodes && (resp.nodes[0] || resp.nodes[1]);
    const transcodedMediaObject = res && res.lastSuccessfulRequest &&
        res.lastSuccessfulRequest.outputForFilter &&
        res.lastSuccessfulRequest.outputForFilter.length &&
        res.lastSuccessfulRequest.outputForFilter[0].filterOutput &&
        res.lastSuccessfulRequest.outputForFilter[0].filterOutput.transcodedMediaObject;
    let returnObject = {
        splitPdf: null,
        splitHtml: null,
        splitText: null,
    };

    if (transcodedMediaObject) {
        returnObject.splitPdf = transcodedMediaObject.id && {
            mediaObjectId: transcodedMediaObject.id,
            dataType: "MEDIA",
            locale
        };
        returnObject.splitHtml = transcodedMediaObject.id && await transcodeMediaObject({
            mediaObjectId: transcodedMediaObject.id,
            locale,
            filter: "pdf2htmlEx"
        });
        returnObject.splitText = transcodedMediaObject.id && await transcodeMediaObject({
            mediaObjectId: transcodedMediaObject.id,
            locale,
            filter: "pdftotext_raw"
        });
    }
    return returnObject;
}


async function transcodeMediaObject({mediaObjectId, filter, locale}) {
    const resp = await graphql(`
    mutation {
      transcodeMediaObject (input: {
        clientMutationId: "0",
        filter: "${filter}",
        mediaObjectId: "${mediaObjectId}"

      }) {
        mediaObject {
          id
        }
      }
    }
`)

    return resp && resp.transcodeMediaObject && resp.transcodeMediaObject.mediaObject && {
        mediaObjectId: resp.transcodeMediaObject.mediaObject.id, dataType: "MEDIA", locale
    };
}
