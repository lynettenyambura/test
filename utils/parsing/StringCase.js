
function spanishTitleCase(str){
    if(!str || !str.trim()) return str;
    const articles = ["el", "la", "los", "las", "un", "una", "unos", "unas"];
    const prepositions = ["a", "ante", "bajo", "cabe", "con", "contra", "de", "desde", "durante", "en", "entre", "hacia", "hasta", "mediante", "para", "por", "según", "sin", "so", "sobre", "tras", "versus", "vía"];
    const conjunctions = ["y", "e", "ni", "o", "u", "pero", "sino", "que", "aunque", "si", "pues", "ya", "bien", "luego", "porque", "puesto", "como", "cuando", "mientras", "donde", "cuanto", "tan", "entonces", "además", "también", "sino",
        "siquiera", "sino", "sino que", "sino también", "no sólo", "no solo", "sino también", "sino que también", "no sólo sino", "no solo sino", "sino que también", "no sólo sino que", "no solo sino que", "sino que también", "no sólo sino que también", "no solo sino que también"];
    const exceptions = [...articles, ...prepositions, ...conjunctions];
    //split the string into sentences, handle each sentence separately
    const sentences = str.toLowerCase().split(/\.\s+/).filter(x=>x);
    const newSentences = sentences.map(sentence=>{
        //split the sentence into words, handle each word separately
        const words = sentence.split(/\s+/).filter(x=>x);
        const newWords = words.map((word, i)=>{
            //if the word is the first word in the sentence, or if it is not an exception, capitalize the first letter
            if(i===0 || !exceptions.includes(word.toLowerCase())){
                return word[0].toUpperCase() + word.slice(1);
            }
            //otherwise, leave it as is
            else{
                return word;
            }
        })
        return newWords.join(" ");
    })
    return newSentences.join(". ");
}

// write a function to capitalize the first letter of each word in an english string (except for articles, prepositions, and conjunctions)
function englishTitleCase(str){
    if(!str || !str.trim()) return str;
    const articles = ["a", "an", "the"];
    const prepositions = ["aboard", "about", "above", "across", "after", "against", "along", "amid", "among", "anti", "around", "as", "at", "before", "behind", "below", "beneath", "beside", "besides", "between", "beyond", "but", "by", "concerning", "considering", "despite", "down", "during", "except", "excepting", "excluding", "following", "for", "from", "in", "inside", "into", "like", "minus", "near", "of", "off", "on", "onto", "opposite", "outside", "over", "past", "per", "plus", "regarding", "round", "save", "since", "than", "through", "to", "toward", "towards", "under", "underneath", "unlike", "until", "up", "upon", "versus", "via", "with", "within", "without"];
    const conjunctions = ["and", "but", "or", "nor", "for", "yet", "so"];
    const exceptions = [...articles, ...prepositions, ...conjunctions];
    //split the string into sentences, handle each sentence separately
    const sentences = str.toLowerCase().split(/\.\s+/).filter(x=>x);
    const newSentences = sentences.map(sentence=>{
        //split the sentence into words, handle each word separately
        const words = sentence.split(/\s+/).filter(x=>x);
        const newWords = words.map((word, i)=>{
            //if the word is the first word in the sentence, or if it is not an exception, capitalize the first letter
            if(i===0 || !exceptions.includes(word.toLowerCase())){
                return word[0].toUpperCase() + word.slice(1);
            }
            //otherwise, leave it as is
            else{
                return word;
            }
        })
        return newWords.join(" ");
    });
    return newSentences.join(". ");
}

//write a function to capitalize the first letter of sentence in a paragraph.
function sentenceCase(str){
    if(!str || !str.trim()) return str;
    //split the string into sentences, handle each sentence separately
    const sentences = str.toLowerCase().split(/\.\s+/).filter(x=>x);
    const newSentences = sentences.map(sentence=>{
        //split the sentence into words, handle each word separately
        const words = sentence.split(/\s+/).filter(x=>x);
        const newWords = words.map((word, i)=>{
            //if the word is the first word in the sentence, or if it is not an exception, capitalize the first letter
            if(i===0){
                return word[0].toUpperCase() + word.slice(1);
            }
            //otherwise, leave it as is
            else{
                return word;
            }
        })
        return newWords.join(" ");
    });
    return newSentences.join(". ");
}

console.log(spanishTitleCase("LEY DE INSTITUCIONES Y PROCEDIMIENTOS ELECTORALES PARA EL ESTADO DE TLAXCALA"));
console.log(englishTitleCase("MUNYARUGARAMA - ORDER TO UNSEAL AND PUBLICLY FILE THE FIRST AMENDED INDICTMENT - RULES 50, 52 AND 60 OF THE RULES OF PROCEDURE AND EVIDENCE"));
console.log(sentenceCase("this is a sentence. this is another sentence. this is a third sentence in the paragraph."));
