"use strict";


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
