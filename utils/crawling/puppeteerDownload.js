async function puppeteerDownload({canonicalURL,requestURL, headers, download = true}) {

    if (download || /\.pdf|\.docx?/i.test(canonicalURL.trim())) {

        //await new Promise(resolve => setTimeout(resolve, 60000));
        const page = await puppeteerManager.newPage({
            incognito: false,
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
            downloadContentTypes: ["application/pdf", 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });


        // requestURL = canonicalURL.replace(/^http:/i, "https:");
        console.log(`puppeteer navigating to page`);
        await page.goto(requestURL, {
            waitUntil: "networkidle0",
            timeout: 300000
        }).catch(e => console.error(`Puppeteer still loading page ${canonicalURL}`));
        console.log(`puppeteer page loaded`);
        let allDownloads = await page.getDownloads();
        let downloads = allDownloads.filter(d => d.canonicalURL === canonicalURL || d.canonicalURL === requestURL || d.canonicalURL === encodeURI(requestURL) || d.canonicalURL === encodeURI(canonicalURL));
        if (!downloads.length) throw ("Downloaded file could not be found: " + canonicalURL + ". " + JSON.stringify(allDownloads.map(x => x.canonicalURL)));
        downloads.forEach(x => {
            x.canonicalURL = canonicalURL;
            let type = x.response.headers.get('content-type');
            if (!type || !/pdf|word/i.test(type)) {
                x.response.status = 505;
                x.response.statusText = "Downloaded " + type + ", expected binary."
                x.response.ok = false;
            }
        });

        return downloads;
    }
    return [];
}
