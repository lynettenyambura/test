async function parsePage({URL, responseBody, filterOutputs}) {
  const mutationQuery = `mutation {
    transcodeMediaObject(input: {clientMutationId: "0", mediaObjectId: "MEDIA_OBJECT_ID_GOES_HERE", filter: "pdf2htmlEx"}) {
      mediaObject {
        id
        fileFormat
contentURL
      }
    }
  }
  `;

  const out = {
      URI: [URL, decodeURI(URL), encodeURI(decodeURI(URL))].filter((c, i, a) => a.indexOf(c) === i)

    };
    if (filterOutputs && filterOutputs.tiff2pdf) {
      out.pdf = [{
          mediaObjectId: filterOutputs.tiff2pdf.id,
          dataType: "MEDIA",
          locale: "es"
      }];

      // Transcode PDF to HTML
      // out.debugMutation = mutationQuery.replace(/MEDIA_OBJECT_ID_GOES_HERE/, filterOutputs.tiff2pdf.id);
      let resp = await graphql(mutationQuery.replace(/MEDIA_OBJECT_ID_GOES_HERE/, filterOutputs.tiff2pdf.id));
      if (resp && resp.transcodeMediaObject && resp.transcodeMediaObject.mediaObject && resp.transcodeMediaObject.mediaObject.id) {
      	out.html = [{
          mediaObjectId: resp.transcodeMediaObject.mediaObject.id,
          dataType: "MEDIA",
          locale: "es"
      	}];
      }
    }else {
    	//probably not a tiff but pdf file
      	let resp = await graphql(mutationQuery.replace(/MEDIA_OBJECT_ID_GOES_HERE/, responseBody.id));
      	if (resp && resp.transcodeMediaObject && resp.transcodeMediaObject.mediaObject && resp.transcodeMediaObject.mediaObject.id) {
        	//THE PDF will not display on iceberg since the file has a tiff mime type
          	/*out.pdf = [{
                mediaObjectId: responseBody.id,
                fileFormat: "application/pdf",
                locale: "es"
            }];*/
            out.html = [{
              mediaObjectId: resp.transcodeMediaObject.mediaObject.id,
              dataType: "MEDIA",
              locale: "es"
          }];
            out.pdf = [{
              mediaObjectId: resp.transcodeMediaObject.mediaObject.id,
              dataType: "MEDIA",
              locale: "es"
          }];
        }
    }



	return [out];
}
