async function fetchPage({canonicalURL, requestURL, requestOptions, headers}) {
    if (!requestOptions) requestOptions = {method: "GET", headers};
    // requestOptions.follow = 20;
    requestOptions.redirect = "manual";
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;
    if (requestURL.match(/^https/i)) {
        requestOptions.agent = new https.Agent({rejectUnauthorized: false});
        console.log("using a custom agent");
    }
    let res = await fetchWithCookies(requestURL, requestOptions)
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({URL: requestURL}, requestOptions),
                response
            };
        });
    let location = res.response.headers.get("location");
    // console.log(location);
    if (location) {
        requestOptions.method = "GET";
        requestOptions.referer = requestURL;
        delete requestOptions.body;
        return await fetchPage({canonicalURL, requestURL: location, requestOptions, headers});
    }
    return res;
}

async function fetchURL({canonicalURL, headers}) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    return [await fetchPage({canonicalURL, headers})];
}