'use strict';

const downloadGoogleDriveFile = async function ({id, canonicalURL, headers}) {
    if (!id) {
        let match = /file\/d\/([^\/]+)/.exec(canonicalURL) || /\?id=([^&]+)/.exec(canonicalURL);
        id = match && match[1]
    }
    let customHeaders = {"authority":"drive.google.com","dnt":"1","sec-ch-ua":"\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"","sec-ch-ua-arch":"\"x86\"","sec-ch-ua-bitness":"\"64\"","sec-ch-ua-full-version":"\"119.0.6045.124\"","sec-ch-ua-full-version-list":"\"Google Chrome\";v=\"119.0.6045.124\", \"Chromium\";v=\"119.0.6045.124\", \"Not?A_Brand\";v=\"24.0.0.0\"","sec-ch-ua-mobile":"?0","sec-ch-ua-model":"\"\"","sec-ch-ua-platform":"\"Windows\"","sec-ch-ua-platform-version":"\"10.0.0\"","sec-ch-ua-wow64":"?0","sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":"none","sec-fetch-user":"?1","service-worker-navigation-preload":"true","upgrade-insecure-requests":"1","x-chrome-connected":"source=Chrome,id=113107138880511181120,mode=0,enable_account_consistency=false,supervised=false,consistency_enabled_by_default=false","x-client-data":"CIe2yQEIo7bJAQipncoBCMH6ygEIk6HLAQiFoM0BCJayzQEI3L3NAQjoxc0BCKXczQEI2dzNAQiw3s0BCKPfzQEIteDNAQjV4M0BCOThzQEIs+PNAQjc480BCOLpzQEY9MnNARjJ4c0B","Accept-Encoding":"gzip, deflate, br"};
    let _headers = Object.assign(customHeaders, headers);
    let method = "GET";
    let requestOptions = {method, headers: _headers};
    requestOptions.redirect = "manual";
    let requestURL = id ? `https://drive.google.com/uc?id=${id}&export=download` : canonicalURL;
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions});
    if (responsePage?.response?.status && /30[23]/.test(responsePage.response.status)) {
        let location = responsePage.response.headers.get("location");
        return await fetchPage({canonicalURL, requestURL: location, requestOptions});
    } else {
        throw new Error('Invalid url!')
        responsePage.response.ok = false;
        responsePage.response.statusText = `INVALID URL!: ${canonicalURL}\n`;
        responsePage.response.status = 502;
        responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
        return responsePage;
    }
};