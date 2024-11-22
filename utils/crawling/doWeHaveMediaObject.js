const pdfAlreadyDownloaded = async (URL) => {
    try{
        //await runRemoteFilter({URL})
        return await doWeHaveMediaObject({URL});
    }catch(e){
        // throw e;
        return false;
    }
}

async function doWeHaveMediaObject({URL}) {
    let query = `
        query {
            viewer {
                crawledURLs(first: 1, q: "${URL}") {
                    edges {
                        node {
                            lastSuccessfulRequest {
                                responseBody {
                                    id
                                    fileFormat
                                }
                            }
                        }
                    }
                }
            }
        }`;
    let result = await graphql(query);
    // throw JSON.stringify(result, null, 4)
    let regex = /application\/pdf/i
    if (result && result.viewer.crawledURLs.edges[0] && regex.test(result.viewer.crawledURLs.edges[0].node.lastSuccessfulRequest.responseBody.fileFormat)) {
        return true;
    }
    return false;
}
