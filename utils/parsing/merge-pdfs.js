"use strict";


const mergePdfsToPdf = async function ({pdf_urls, locale, transcode=true}) {

    let res = null;
    try {
        res = await joinPDFsToMediaObject(pdf_urls);

    } catch (e) {
        console.error("Merging PDFs failed for " + JSON.stringify(pdf_urls), e);
    }
    let returnObject = {};
    returnObject.mergedPdf = res && res.id && {
        mediaObjectId: res.id,
        // fileFormat: "application/pdf",
        locale, dataType: "MEDIA"
    } || null;
    returnObject.mergedHtml = transcode && res && res.id && await transcodeMediaObject({mediaObjectId: res.id, locale, filter:"pdf2htmlEx"});
    returnObject.mergedText = transcode && res && res.id && await transcodeMediaObject({mediaObjectId: res.id, locale, filter:"pdftotext_raw"});
    return returnObject;
};

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
