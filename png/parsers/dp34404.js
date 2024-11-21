const gistURL = `https://gist.githubusercontent.com/tindase/6dd272fc9fa5e3facc75c1f0979325ac/raw/6763ff643f4e243dfd8123b3ab0e28cd1f3e103c/png_dates.js`;
const {dateMap} = requireFromUrl(gistURL);

function getDate(URI) {
    if (!dateMap || !dateMap.length) return null;
    let valid = dateMap.filter(x => URI && x.URI === URI);
    if (!valid.length) return null;
    let o = valid[0];
    if(o.date){
        o.coming_into_force_date = o.date;
    }
    return o;
}

const getType = (URI) => {
    if (/\/pg_leg_h\//i.test(URI))
        return {
            legislation_type: "Historical Legislation (Repealed or Amended)",
            link_type: "pg_leg_h",
            child_url_ext: "historicText"
        }
    else if (/\/pg_leg_sess\//i.test(URI))
        return {
            legislation_type: "National Sessional Legislation",
            link_type: "pg_leg_sess",
            child_url_ext: "asEnactedText"
        };
    else if (/\/pg_leg_s\//i.test(URI))
        return {
            legislation_type: "Subsidiary Legislation",
            link_type: "pg_leg_s",
            child_url_ext: "subsidiaryText"
        };
    else if (/\/pg_leg_p\//i.test(URI))
        return {
            legislation_type: "Provincial Legislation",
            link_type: "pg_leg_p",
            child_url_ext: "provincialConsolidatedText"
        };
    else if (/\/pg_leg_r\//i.test(URI))
        return {
            legislation_type: "Historical Legislation (Repealed)",
            link_type: "pg_leg_r",
            child_url_ext: "repealedText"
        };

    return {}
};

function parsePage({responseBody, URL, html, referer}) {
    console.log(`parsePage: parsing: ${responseBody.fileFormat} ${URL}`);
    let xmlNumber = (/(\d+)\.xml$/i.exec(URL))[1];
    const $ = cheerio.load(cleanseHtml(responseBody.content), {xmlMode: !false});
    let style = $(`<style></style>`);
    let typeObject = getType(URL);
    let mother = {
        isMother: true, URI: URL, title: null, year: null, class: "Act", htmlIsModified: false, changedArticleTitles:[], xmlNumber
    };

    let child = {URI: URL, title: null, year: null, class: "Act", parentURI: null, content: null};
    child.legislation_type = typeObject.legislation_type;
    child.xml_source = typeObject.link_type && `${typeObject.link_type}.xml`;
    const results = [];

    let top = {
        "$schema": "./consolidation-schema.json",
        "title": null,
        "nodes": [],
        nextOrderNo: 1,
        getNextOrderNo: function () {
            return this.nextOrderNo++;
        }
    }

    function getNewNode() {
        return {
            "id": "node-" + (1 + top.nodes.length), "order": top.getNextOrderNo(), "versions": []
        };
    }
    const validateRecordHtml = (record, retry=false) => {
        let dupRecord = record.clone();
        dupRecord.find(">p, >bookmark > p").remove();
        let modified = false;
        let hasTextOutsideParagraphs = dupRecord.text().replace(/[^a-z\d]+/ig, "").trim();
        let closingTag = null;
        if(!retry && hasTextOutsideParagraphs){
            let h = record.html().replace(/\s*\n\s*/ig, " ");
            let pieces = h.split(/(<\/?p\b[^<>]*\/?>)/ig).filter(x=>x && x.trim());
            //loop through pieces, mark as opening, text or closing tag. Text must come after opening, closing can come after opening.
            let _h = ``;
            let openingTag = null;
            let text = null;
            for(let i=0; i<pieces.length; i++){
                let isOpening = /^<p\b/i.test(pieces[i].trim());
                let isClosing = /^<\/p\b/i.test(pieces[i].trim());
                let isOpenClosing = /^<p\/>/i.test(pieces[i].trim());
                let isText = !isOpenClosing && !isOpening && !isClosing;
                if(isOpenClosing){
                    _h += pieces[i];
                    openingTag = null;
                    text = null;
                    closingTag = null;
                }else if(isClosing){
                    if(openingTag){
                        _h += openingTag +(text||'')+ pieces[i];
                    }else{
                        //throw new Error(`UnMatched closing tag: ${pieces[i]}`);
                        _h += (openingTag||'') +(text||'')+ pieces[i];
                    }
                    openingTag = null;
                    text = null;
                    closingTag = null;
                }else if(isOpening){
                    if(openingTag){
                        text = (text||'')+pieces[i];
                    }else{
                        openingTag = pieces[i];
                    }
                }else if(isText){
                    if(!openingTag){
                        //wrap in p tags
                        _h += `<p>${pieces[i]}</p>`
                    }else {
                        text = (text||"")+pieces[i];
                    }

                }
                //if it's the last one, and not a closing tag, add one and append to html
                if(i===pieces.length-1){
                    if(isText || isOpening){
                        _h += `${(openingTag||'')}${pieces[i]}</p>`
                    }
                }
            }
            record.html(_h);
            modified = true;
            validateRecordHtml(record, true);
        } else if(retry && hasTextOutsideParagraphs)
            throw new Error(dupRecord.text()+`: ${record.html()}`);
        return modified;
    }
    const checkPartHeadingHasAnnotation = function(partRecord, $){
        //return text, {annotation Record}
        let ps = partRecord.find("[class *= 'Footnote']");
        let footNoteText = ps.toArray().map(p=> $(p).text().trim()).filter(x=>x.length);
        ps.remove();
        let newTitle = partRecord.text().trim().replace(/\s+/ig, " ");
        let annotationNode = null;
        if(footNoteText.length){
            //create new node
            let node = getNewNode();
            //create new version
            let version = {
                id: node.id + "-version-1",
                type: "paragraph",
                title: "",
                text:footNoteText.map(x=>{return `<p># ${x}</p>`}).join("\n"),
                amendingText: "",
                versionNumber: 1,
                amendingProvision: null
            };
            node.versions.push(version);
            annotationNode = node;
        }
        return [newTitle, annotationNode]
    }
    let parsingHeader = false;//parse header after name of legislation until part or section is found
    let lastLineWasPart = false;
    let lastLineWasSection = false;
    let lastElement = null;
    let lastNodeVersion = null;
    let lastPartLevel = 0;
    let lastSectionLevel = 0;
    let lastLineWasText = false;

    let paragraphCount = 0;
    mother.changedArticles = new Set()

    $("record").each(function (i) {
        $(this).find(":contains('Press Esc to close'), [class *='Exit'], [class *='Popup']").remove();
        const thisIsChanged = validateRecordHtml($(this));
        mother.htmlIsModified = mother.htmlIsModified || thisIsChanged;
        let _class = $(this).attr("class");
        let level = $(this).attr("level");
        let isPart = /Heading.{0,3}Part/i.test(_class + " " + level);
        let isSection = /Heading.{0,3}Sect/i.test(_class + " " + level);
        let text = $(this).text().replace(/\s+/g, " ").trim();
        _class && $(this).children().first().addClass(_class);
        if (/Name.*of.*Legislation/i.test(_class + " " + level)) {
            mother.title = mother.title || $(this).text().replace(/\s+/g, " ").trim();
            child.title = mother.title;
            mother.URI = `http://vlex.com/papua-new-guinea/legislation/${mother.title && mother.title.replace(/\W+/g, " ").trim().replace(/\s+/g, "-").toLowerCase()}`;
            child.URI = `${mother.URI}/${typeObject.child_url_ext}`;
            top.title = mother.title;
            //Rules: Rules
            //Regulation: Regulation
            //Scheme: Scheme
            if (/\brules?\b/i.test(mother.title)) {
                mother.class = 'Rule';
                child.class = 'Rule';
            } else if (/\Regulations?\b/i.test(mother.title)) {
                mother.class = 'Regulation';
                child.class = 'Regulation';
            } else if (/\Schemes?\b/i.test(mother.title)) {
                mother.class = 'Scheme';
                child.class = 'Scheme';
            }
            let m = /\b((20|1[8-9])[0-9]{2})\b/i.exec(mother.title);
            mother.year = m && parseInt(m[1]) || mother.year;
            mother.coming_into_force_date = mother.year && `${mother.year}-01-01`;
            if (!mother.year || !mother.coming_into_force_date) {
                let d = getDate(mother.URI);
                mother.year = d && d.year;
                mother.coming_into_force_date = d && d.coming_into_force_date;
                //throw JSON.stringify(mother);
            }
            child.year = mother.year;
            child.coming_into_force_date = mother.coming_into_force_date;
            //create new node
            let node = getNewNode();
            //create new version
            let version = {
                id: node.id + "-version-1",
                start: mother.coming_into_force_date,
                type: "heading",
                title: mother.title,
                level: 1,
                text: "",
                sectionNumber: null,
                amendingText: '',
                versionNumber: 1,
                amendingProvision: null
            };
            node.versions.push(version);
            top.nodes.push(node);
            lastNodeVersion = version;

            parsingHeader = true;
            lastLineWasPart = false;
            lastLineWasSection = false;
            lastLineWasText = false;
            if(thisIsChanged){
                mother.changedArticles.add(`${version.id}: ${version.type} - ${version.title}`);
            }
            return;
        } else if (isPart) {
            let match = /\bpart ([^\.\s]+)/i.exec(text);
            let no = match && match[1] || null;

            if (!lastPartLevel) lastPartLevel = 1;
            //create new node
            let node = getNewNode();
            //create new version
            let version = {
                id: node.id + "-version-1",
                start: mother.coming_into_force_date,
                type: "section",
                title: text,
                level: lastPartLevel + (lastLineWasPart ? 1 : 0),
                text: "",
                sectionNumber: "part-" + no,
                amendingText: "",
                versionNumber: 1,
                amendingProvision: null
            };
            node.versions.push(version);
            top.nodes.push(node);
            // check for annotation in record
            let [newTitle, annotationNode] = checkPartHeadingHasAnnotation($(this), $)
            version.title = newTitle;
            if(annotationNode){
                //start: mother.coming_into_force_date,
                //level: lastNodeVersion.level + 1,
                //sectionNumber: "paragraph-" + (++paragraphCount),
                let v = annotationNode.versions[0];
                v.start = mother.coming_into_force_date;
                v.level = version.level + 1;
                v.sectionNumber = "part-annotation-" + (++paragraphCount);
                v.parentSectionNumber = version.sectionNumber;
                top.nodes.push(annotationNode);
            }
            lastNodeVersion = annotationNode && annotationNode.versions[0] || version;
            lastLineWasPart = true;
            lastLineWasSection = false;
            parsingHeader = false
            lastLineWasText = false;
            if(thisIsChanged){
                mother.changedArticles.add(`${version.id}: ${version.type} - ${version.title}`);
            }

        } else if (isSection) {
            let match = /\bsection ([^\.\s]+)/i.exec(text);
            if (!match) match = /^([A-Za-z\d]{1,5})\s*\./i.exec(text);
            let no = match && match[1] || null;
            if (!lastSectionLevel) {
                if (lastPartLevel) lastSectionLevel = lastPartLevel + (lastLineWasSection ? 1 : 0) + 1;
                else lastSectionLevel = 1;
            }
            //create new node
            let node = getNewNode();
            //create new version
            let version = {
                id: node.id + "-version-1",
                start: mother.coming_into_force_date,
                type: "article",
                title: $(this).text().replace(/\s+/g, " ").trim(),
                level: lastSectionLevel + (lastLineWasSection ? 1 : 0),
                text: "",
                sectionNumber: "S-" + no,
                amendingText: "",
                versionNumber: 1,
                amendingProvision: null
            };
            node.versions.push(version);
            top.nodes.push(node);
            lastNodeVersion = version;

            let [newTitle, annotationNode] = checkPartHeadingHasAnnotation($(this), $)
            version.title = newTitle;
            if(annotationNode){
                //start: mother.coming_into_force_date,
                //level: lastNodeVersion.level + 1,
                //sectionNumber: "paragraph-" + (++paragraphCount),
                let v = annotationNode.versions[0];
                v.start = mother.coming_into_force_date;
                v.level = version.level + 1;
                v.sectionNumber = "section-annotation-" + (++paragraphCount);
                v.parentSectionNumber = version.sectionNumber;
                top.nodes.push(annotationNode);
            }
            lastNodeVersion = annotationNode && annotationNode.versions[0] || version;
            lastLineWasSection = true;
            lastLineWasPart = false;
            parsingHeader = false;
            lastLineWasText = false;
            if(thisIsChanged){
                mother.changedArticles.add(`${version.id}: ${version.type} - ${version.title}`);
            }
        } else if (lastNodeVersion && lastNodeVersion.type === "heading") {

            //create new node
            let node = getNewNode();
            //create new version
            let version = {
                id: node.id + "-version-1",
                start: mother.coming_into_force_date,
                type: "paragraph",
                title: "",
                level: lastNodeVersion.level + 1,
                text: $(this).html(),
                sectionNumber: "paragraph-" + (++paragraphCount),
                parentSectionNumber: lastNodeVersion.sectionNumber,
                amendingText: "",
                versionNumber: 1,
                amendingProvision: null
            };
            node.versions.push(version);
            top.nodes.push(node);
            lastNodeVersion = version;

            lastLineWasPart = false;
            lastLineWasSection = false;
            parsingHeader = false;
            lastLineWasText = true;
            if(thisIsChanged){
                mother.changedArticles.add(`${version.id}: ${version.type} - ${version.title}`);
            }
        } else if (lastNodeVersion) {
            lastNodeVersion.text += "\n" + $(this).html();
            lastLineWasPart = false;
            lastLineWasSection = false;
            parsingHeader = false;
            lastLineWasText = true;
            if(thisIsChanged){
                mother.changedArticles.add(`${lastNodeVersion.id}: ${lastNodeVersion.type} - ${lastNodeVersion.title}`);
            }
        }
    });
    if (child.URI && child.title) {
        child.parentURI = mother.URI;
        child.URL = URL;
        mother.URL = URL;
        delete top.getNextOrderNo;
        delete top.nextOrderNo;
        setEmptyStringsToNull(top);
        //trim text in versions
        top.nodes.forEach(node => {
            node.versions.forEach(version => {
                version.text = version.text && version.text.trim();
            });
        });
        child.content = top;
        mother.changedArticles = Array.from(mother.changedArticles).map(x=>{
            let match = /([^:]+)\s*:\s*([^\-]+)\s*-\s*(.+)/i.exec(x);
            return {id: match[1], type: match[2], title:match[3]};
        });
        mother.changedArticleTitles = mother.changedArticles.map(x=>x.title);
        results.push(mother);
        results.push(child);
        // if(!mother.coming_into_force_date){
        //   results.push({URI: mother.URI, title: mother.title, parsedFrom: URL});
        // }
    }
    results.forEach(d=>{
        d.content && d.content.nodes && d.content.nodes.forEach(node=>{
            node.versions.forEach(version=>{
                processText({versionObject: version})
            })
        })
    })
    let changed = false;
    let count = 0;
    do {
        console.log("cleaning footnotes", ++count);
        changed = cleanFootnotes(results);
    } while (changed);
    // return []
    return results;
}

const cleanFootnotes = (results) => {
    //check if last annotationS references next node and move it to the next node
    let changed = false;
    console.log('cleaning footnotes - new iteration ------------------------- ');
    results.forEach(d => {
        if (d.content && Array.isArray(d.content.nodes)) {
            // loop through nodes until second last one
            for (let i = 0; i < d.content.nodes.length - 2; i++) {
                let version = d.content.nodes[i].versions[0];
                let nextVersion = d.content.nodes[i + 1].versions[0];
                let lines = (version.text || "").split("\n");
                // get number from next version title
                let nextMatch = /(\D{0,16}\s)?([\dIXVLM]+[A-Z]{0,2}\W{0,3})/i.exec(nextVersion.title);
                let nextTitleNumber = nextMatch && nextMatch[2].replace(/[\.\s—\-\(]+/ig, "");
                let nextTitleType = nextMatch && nextMatch[1];
                if (!nextTitleType) {
                    let m = /^([A-Za-z\d]{1,5})\s*\./i.exec(nextVersion.title);
                    nextTitleNumber = m && m[1] || nextTitleNumber;
                }
                // get number from next version section number
                nextMatch = /-(\w+)$/i.exec(nextVersion.sectionNumber);
                let nextSectionNumber = nextMatch && nextMatch[1];
                // loop through lines in reverse order
                let annotationsForNextNode = [];
                for (let j = lines.length - 1; j >= 0; j--) {
                    let currentLineIsAnnotation = /^#/i.test(lines[j]);
                    if (!currentLineIsAnnotation) break;
                    //    get number from annotation
                    let match = /#(\D{0,16}\s)?([\dIXVLM]+[A-Z]{0,2}\W{0,3})/i.exec(lines[j].replace(/^#\s*the \S+ of /i, "# "));
                    let annotationNumber = match && match[2].replace(/[\.\s—\-\(]+/ig, "");
                    // let annotationType = match && match[1];
                    // if (/^3[89]|4[567]/i.test(nextTitleNumber) || /^3[89]|47/i.test(nextTitleNumber) || /^3[89]|47/i.test(annotationNumber)) {
                    //     //for debugging only
                    //     console.log("debug", nextTitleNumber, nextSectionNumber, annotationNumber);
                    // }
                    if (nextTitleNumber && annotationNumber === nextTitleNumber ||
                        nextSectionNumber && annotationNumber === nextSectionNumber) {
                        // remove annotation from current version
                        version.text = lines.slice(0, j).join("\n");
                        // add annotation to next version
                        annotationsForNextNode.push(lines[j]);
                        changed = true;
                        console.log(`moving annotation from ${version.title || version.parentSectionNumber} to ${nextVersion.title}`);
                    } else break;
                }
                // add annotations to next version
                if (annotationsForNextNode.length > 0) {
                    // console.log(`moving ${annotationsForNextNode.length} annotations from ${version.title || version.parentSectionNumber} to ${nextVersion.title}`);
                    nextVersion.text = annotationsForNextNode.join("\n") + "\n" + nextVersion.text;
                }
            }
        }
    });
    // delete empty nodes
    results.forEach(d => {
        if (d.content && Array.isArray(d.content.nodes)) {
            let originalNodes = d.content.nodes.length;
            d.content.nodes = d.content.nodes.filter(node => {
                let version = node.versions[0];
                return version && version.text && version.text.trim().length > 0 || version.title;
            });
            let finalNodes = d.content.nodes.length;
            console.log(`deleting ${originalNodes - finalNodes} empty nodes`.toUpperCase());
        }
    });
    return changed;
}

const cleanseHtml = (html) => {
    const $ = cheerio.load(html, {decodeEntities: false, xmlMode: true});
    $(".Footnote_Text  + .Footnote_Text_Indented").each((i, el) => {
        let prev = $(el).prev();
        let prevHtml = prev.html();
        $(el).html(prevHtml + $(el).html());
        $(el).removeClass("Footnote_Text_Indented");
        $(el).addClass("Footnote_Text");
        // loop throw all next siblings and append prevHtml if they are Footnote_Text_Indented
        let next = $(el).next();
        while (next.hasClass("Footnote_Text_Indented")) {
            $(next).html(prevHtml + $(next).html());
            $(next).removeClass("Footnote_Text_Indented");
            $(next).addClass("Footnote_Text");
            next = next.next();
        }
        prev.remove();
    });
    return $.html();
}

function setEmptyStringsToNull(obj) {
    for (let e in obj) {
        if (obj[e] === "")
            ;//obj[e] = null;
        //if its an object, call setEmptyStringsToNull  on it
        else if (typeof obj[e] == "object")
            setEmptyStringsToNull(obj[e]);

    }
}

function processText({text, versionObject}){
    if(!text && versionObject)
        text = versionObject.text;
    if(!text || !text.trim())
        return text;
    const $ = cheerio.load(`<html lang='en'><body>${text}</body><html>`);
    let mainContent = '';
    let annotationContent = ''

    $('p').each(function(){
        let p = $(this);
        if(!p.text().trim())return;
        let _class = p.attr("class");

        let isAnnotation = /annotation|footnote/i.test(p.attr('class')||"");
        if(!isAnnotation){
            //Main text, can be a multi-line string
            let match = /\bACT_(\d+)\b/i.exec(_class);
            let indentIndex = match && (parseInt(match[1]) - 1) || 0;
            if(!indentIndex || indentIndex<1)
                indentIndex = 0;
            let warnRegex = /(.*)\b(WARNING:[^\.]+\.)(.*)/i;
            let lineText = p.text().replace(/\s+/g, " ").trim();
            match = warnRegex.exec(lineText);
            if(match){
                let st = ``;
                while(match){
                    st+=`\n# ${match[2]}`;
                    lineText = match[1]+match[3];
                    match = warnRegex.exec(lineText);
                }
                lineText = (st + "\n" + lineText).trim();
                let match2 = /(\s*Go\s+to)/.exec(lineText);
                if(match2){
                    let startIndex = lineText.indexOf(match2[0]);
                    let subStr = lineText.substring(startIndex);
                    let endMatch = /(\.(?:\s).*)/i.exec(subStr)
                    if(endMatch){
                        let endIndex = subStr.indexOf(endMatch[0]);
                        lineText = (lineText.substring(0, startIndex)+ lineText.substring(endIndex+startIndex+endMatch[0].length)).trim()
                    }else {
                        lineText = lineText.substring(0, startIndex).trim()
                    }
                    //throw JSON.stringify({lineText});

                }
            }
            mainContent = `${mainContent}\n${"·".repeat(indentIndex)}${lineText}`.trim();
        }else{
            //remove every child that is not a span, strong, i, b
            $(p.find("*").get().reverse()).each(function(){
                let tag = $(this).prop('name');
                if(!/^(span|strong|i|b)$/i.test(tag)){
                    $(this).replaceWith($(this).html());
                }
            });
            //add annotation line, starting with #, remove all new lines
            p.find("span").each(function(){
                let span = $(this);
                let style = span.attr("style");
                let type = span.attr("type");
                let isBold = /bold/i.test(style + " " + type);
                let isItalic = /italic/i.test(style + " " + type);
                let content = cleanHtmlFromText(span.html());
                if(isBold)
                    content = `<b>${content}</b>`;
                if(isItalic)
                    content = `<i>${content}</i>`;
                span.replaceWith(content);
            })
            let annotationText = p.html().replace(/\s+/g, " ");
            mainContent = `${mainContent}\n#${annotationText}\n`.trim();
            //TODO: clean html entities outside of the html tags
            //    Annotation can belong to the next section


        }
    });
    text = replaceHtmlEntities(`${mainContent}\n\n${annotationContent}`.trim());
    if(versionObject)
        versionObject.text = text;
    return text;
}

const cleanHtmlFromText = (text) => {
    if(!text || !text.trim()) return text;
    const $ = cheerio.load(`<div>${text}</div>`);
    return $.text().trim();
}


const replaceHtmlEntities = (text) => {
    if(!text || !text.trim()) return text;
    let entityMap = {
        "&quot;": "\"",
        "&#x2022;": "•",
        "&bull;": "•",
    }
    for(let en in entityMap){
        let reg = new RegExp(en, "ig");
        text = text.replace(reg, entityMap[en]);
    }
    return text;
}
