async function fetchPage({canonicalURL, requestURL, requestOptions, headers, retainSession = false}) {
    if (!requestOptions) requestOptions = {method: "GET", headers};
    if (!canonicalURL) canonicalURL = requestURL;
    if (!requestURL) requestURL = canonicalURL;

    let session = getSharedVariable('session');
    let userAgent = getSharedVariable('user-agent') || requestOptions.headers['user-agent'] || requestOptions.headers['User-agent'];
    if(!retainSession || !session){
        session = Date.now();
        userAgent = userAgents[Math.ceil(Math.random()*userAgents.length)];
        setSharedVariable('session', session);
        getSharedVariable('user-agent', userAgent);
    }
    userAgent && requestOptions.headers['user-agent', userAgent];
    return await fetchWithCookies(requestURL, requestOptions, "zone-g1-country-cl-session-"+session)
        // return await fetchWithCookies(requestURL, requestOptions, "no-proxy")
        .then(response => {
            return {
                canonicalURL,
                request: Object.assign({URL: requestURL}, requestOptions),
                response
            };
        });
}

const userAgents = [
    "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25",
    "Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.86 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; SM-A102U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.86 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.1; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/109.0 Mobile/15E148 Safari/605.1.15",
    "Mozilla/5.0 (iPad; CPU OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/109.0 Mobile/15E148 Safari/605.1.15",
    "Mozilla/5.0 (X11; CrOS armv7l 15236.66.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.94 Safari/537.36",
    "Mozilla/5.0 (X11; CrOS aarch64 15236.66.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.94 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/109.0",
    "Mozilla/5.0 (Android 13; Mobile; LG-M255; rv:109.0) Gecko/109.0 Firefox/109.0"
];

const sleepForSeconds = function (seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const getHome = async function ({headers}) {
    console.log("getHomeCorteSuprema");
    let customHeaders = {
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Pragma": "no-cache",
        "Referer": "https://juris.pjud.cl/busqueda/lista_buscadores",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = {method, headers: _headers};
    let requestURL = 'https://juris.pjud.cl/busqueda?Compendio_de_Salud_de_Corte_Suprema';
    let responsePage = await fetchPage({canonicalURL: requestURL, requestOptions});
    setSharedVariable('corte-home', true);
    //parse token and id buscador
    let html = await responsePage.response.text();
    const $ = cheerio.load(html);
    let match = /(var|let|const)\s+id_buscador_activo\s*=\s*([\d-_]+)/i.exec(html);
    let id_buscador_activo = match && match[2] || null;
    let token = $("input[name='_token']").val();
    console.log(JSON.stringify({id_buscador_activo, token, corte: "suprema"}, null, 4));
    setSharedVariable('corte-buscador', id_buscador_activo);
    setSharedVariable('corte-token', token);
    responsePage.response = new fetch.Response(html, responsePage.response);
    await sleepForSeconds(1);
    return responsePage;
};


const searchByDate = async function ({date, count = 50, page = 1, canonicalURL, headers}) {
    console.log(`searchCorteSupremaByDate - ${date.format("YYYY-MM-DD")} (page=${page}, count=${count}`);
    if (!getSharedVariable('corte-home') || page === 1) await getHome({headers});
    let customHeaders = {
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Origin": "https://juris.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://juris.pjud.cl/busqueda?Compendio_de_Salud_de_Corte_Suprema",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const body = new FormData();
    body.append('_token', getSharedVariable('corte-token'));
    body.append('id_buscador', getSharedVariable('corte-buscador'));
    body.append('filtros', `{"rol":"","era":"","fec_desde":"","fec_hasta":"","tipo_norma":"","num_norma":"","num_art":"","num_inciso":"","todas":"","algunas":"","excluir":"","literal":"","proximidad":"","distancia":"","analisis_s":"11","submaterias":"","facetas_seleccionadas":[{"nombre":"fec_sentencia_sup_dt","valores":["${date.format("YYYY-MM-DD")}"]}],"filtros_omnibox":[{"categoria":"TEXTO","valores":[""]}],"ids_comunas_seleccionadas_mapa":[]}`);
    body.append('numero_filas_paginacion', count);
    body.append('offset_paginacion', (page - 1) * count);
    body.append('orden', 'recientes');
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://juris.pjud.cl/busqueda/buscar_sentencias';
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions, retainSession: true});
    await validateSentenciaRequest({responsePage});
    return responsePage;
};

const validateSentenciaRequest = async function ({responsePage, isContent = false, canBeEmpty = false, option}) {
    if(responsePage.response.status === 500){
        responsePage.response.status = 404;
        return;
    }
    let json = await responsePage.response.text();

    class InvalidResponse extends Error {
        constructor(errorType) {
            super(`(${isContent ? "Content" : "JSON"}) Invalid ${errorType || "response"}: ${json}`);
        }
    }

    let jObject = null;
    try {
        jObject = JSON.parse(json);
        if (!/json/i.test(responsePage.response.headers.get('content-type'))) {
            responsePage.response.headers.set('content-type', 'application/json; charset=UTF-8');
        }
    } catch (e) {
        // throw new InvalidResponse();
        console.error(`Error parsing JSON: ${e.message} - "${json}"`);
    }
    if (200 < responsePage.response.status)
        throw new InvalidResponse(`status ${responsePage.response.status}`);
    if (canBeEmpty && (!json || !json.replace(/[\[\]\{\}\s]*/ig, "").trim())) {
        // tribunales tab can return empty response
        responsePage.response.status = 404;
    } else if (!jObject && !/json/i.test(responsePage.response.headers.get('content-type')))
        throw new InvalidResponse(`content-type ${responsePage.response.headers.get('content-type')}`);
    else if (/CSRF token/i.test(json) || (!isContent && !/"response":/i.test(json) || isContent && !/"(contenido|texto_sentencia)":|^\s*\[\s*\]\s*$/i.test(json)))
        throw new InvalidResponse();

    if (isContent && jObject && option) {
        if (!Array.isArray(jObject))
            ["responseHeader", "facet_counts", "highlighting", "grouped"].forEach(key => delete jObject[key]);

        //update pdf url
        let docs = jObject?.response?.docs || Array.isArray(jObject) && jObject || [];
        let changed = false;
        docs.forEach(doc => {
            if (doc?.crr_documento_id_i && doc.crr_documento_id_i>0) {
                let tipo = option === 1 ? "cs" : option === 2 ? "ca" : "ct";
                doc.custom_pdf_url = `https://juris.pjud.cl/busqueda/documentos?opcion=${option}&b64=0` +
                    `&id_sentencia=${doc.crr_documento_id_i}&tipo_instancia_id=${tipo}&tipo_instancia_a_cargar=${tipo}`
                changed = true;
            }
        });
        if (changed) json = JSON.stringify(jObject);
    }

    responsePage.response = new fetch.Response(json, responsePage.response);
    await sleepForSeconds(1);
};


const clickVerSentencia = async function ({id, canonicalURL, headers}) {
    //if (!getSharedVariable('corte-home'))
    await getHome({headers});
    console.log(`clickVerSentencia - ${id}`);
    let customHeaders = {
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Origin": "https://juris.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://juris.pjud.cl/busqueda?Compendio_de_Salud_de_Corte_Suprema",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const body = new FormData();
    body.append('_token', getSharedVariable('corte-token'));
    body.append('id_buscador', getSharedVariable('corte-buscador'));
    body.append('filtros', '{"id":"' + id + '"}');
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://juris.pjud.cl/busqueda/buscar_sentencias';
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions, retainSession: true});
    await validateSentenciaRequest({responsePage, isContent: true, option: 1});
    return [responsePage];



    //response should be json
    let _json = await responsePage.response.text();
    let json = JSON.parse(_json);
    // if (!json.response || !json.response.html) throw new Error(`Invalid response: ${JSON.stringify(json)}`);
    responsePage.response = new fetch.Response(_json, responsePage.response);
    //find datos from json.response.docs[0]
    let datos = json?.response?.docs[0];
    if (!datos) throw new Error(`Invalid response: ${JSON.stringify(_json)}`);
    //convert fec_sentencia_sup_dt to DD-MM-YYYY
    let date = moment(datos.fec_sentencia_sup_dt);
    datos.fec_sentencia_sup_dt = date.isValid() ? date.format("DD-MM-YYYY") : "";
    //if materias and normas_xml are not set, assign empty arrays
    datos.materias = datos.materias || [];
    datos.normas_xml = datos.normas_xml || [];


    //fetch content for cortes apelaciones
    let content = await clickTabCorteApelaciones({
        datos,
        headers,
        canonicalURL: canonicalURL + "&tab=corteApelaciones"
    });
    //fetch content2 for tribunales
    let content2 = await clickTabCorteSuprema({datos, headers, canonicalURL: canonicalURL + "&tab=corteSuprema"});
    return [responsePage, content, content2];
};


const clickTabCorteApelaciones = async function ({datos, canonicalURL, headers}) {
    console.log(`clickTabCorteSuprema - ${datos.id}`);
    let customHeaders = {
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Origin": "https://juris.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://juris.pjud.cl/busqueda?Compendio_de_Salud_de_Corte_Suprema",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const body = new FormData();
    body.append('_token', getSharedVariable('corte-token'));
    body.append('cod_ws', '6');
    body.append('datos', JSON.stringify(datos));
    // body.append('datos', '{"gls_sala_sup_s":"TERCERA, CONSTITUCIONAL","flg_reserva_i":0,"sent__organismo_s":"SIN INFORMACION","fec_sentencia_sup_dt":"04-01-2023","gls_corte_s":"C.A. de Antofagasta","sent__base_s":"Corte Suprema","cod_corte_i":15,"sent__categorizacion_s":"DERECHO CONSTITUCIONAL, Bienes nacionales de uso público, bienes fiscales y municipales, Ocupación","id_relator_i":0,"id_sala_sup_i":3,"rol_era_sup_s":"114967-2022","id_instancia":1,"era_sup_i":2022,"caratulado_s":"SANTANDER/DELEGACIÓN PRESIDENCIAL ANTOFAGASTA","cod_libro_sup_s":"1","crr_documento_id_i":5805349,"resultado_recurso_sup_s":"CONFIRMA SENTENCIA APELADA","id":"3175605","gls_relator_s":"Sin Relator ","rol_era_ape_s":"20650-2022","era_juz_i":1900,"gls_redactor_s":"Ministro no Identificado ","id_redactor_i":77,"cod_libro_corte_i":34,"analisis_s":"ConAnalisis","gls_tip_recurso_sup_s":"(CIVIL) APELACIÓN PROTECCIÓN","sent__motivo_exclusion_s":"-","id_tip_recurso_sup_s":"CV03","sent__fec_actualiza_dt":"2023-08-21T07:00:02Z","gls_libro_sup_s":"Civil","cod_juz_i":0,"rol_corte_i":20650,"era_corte_i":2022,"rol_juz_i":0,"rol_sup_i":114967,"id_submateria_ss":["1324"],"gls_ministro_ss":["Sergio Muñoz Gajardo","Juan Muñoz Pardo","Mario Carroza Espinosa","Enrique Alcalde Rodríguez","Jean Matus Acuña"],"id_voto_ss":["3","3","3","3","3"],"id_ministro_ss":["83","84","222","526","621"],"id_descriptor_ss":["2753","3225","3641","4336","4384","5579","6882","12386","12557","30061","32806","37159","39288","39486","66287"],"gls_descriptor_ss":["Vías de hecho","Ausencia de derecho indubitado","Plan regulador comunal","Ocupación","Ausencia de un acto arbitrario o ilegal","Requisitos del recurso de protección","Desalojo","Auxilio de la fuerza pública","Demolición de obra","Bienes nacionales de uso público, bienes fiscales y municipales","Delegación presidencial","Falta de autorización","Recurso de protección no constituye instancia de declaración de derechos","Asunto controvertido","Construcción en predio ajeno"],"tamano_archivo_i":24576,"sent__creator_s":"Sala 03 Corte Suprema","sent__word_count_i":390,"sent__author_s":"Sala 03 Corte Suprema","sent__autor_s":"Sala 03 Corte Suprema","sent__npages_i":3,"texto_sentencia":"Santiago, a cuatro de enero de dos mil veintitrés.<br/><br/>A los alegatos solicitados en autos, no ha lugar.<br/><br/>Vistos:<br/>Se reproduce la sentencia en alzada, con excepción de los considerandos quinto al décimo cuarto, que se eliminan.<br/><br/>Y se tiene además presente:<br/>Primero: Que en cuanto al fondo, y de conformidad al petitorio del recurso contenido en el libelo, se persigue por los actores que se deje sin efecto y disponer los procedimientos sancionatorios pertinentes por la dictación de la Resolución Exenta N° 660-2022, de 13 de julio de 2022, emanada de la Delegación Presidencial Regional de Antofagasta, por medio de la cual se les requirió la restitución de inmueble de propiedad fiscal ocupado por los primeros, bajo apercibimiento de desalojo con auxilio de la fuerza pública.<br/><br/>Segundo: Que, consta del mérito de los informes y antecedentes agregados al presente expediente digital, resultan hechos no controvertido por las partes, que: a) los actores no esgrimieron la existencia de título o autorización que habilite la ocupación atribuida; b) que tras la dictación y notificación de la resolución recurrida, se ejecutó con fecha 18 de agosto del año 2022 la orden de desalojo y demolición de las construcciones emplazadas en el inmueble objeto de la acción.<br/><br/>Tercero: Que de esta manera resulta evidente que, a la fecha, encontrándose consumado el apercibimiento contenido en la decisión reprochada, esta Corte no podría tomar medida alguna tendiente retrotraer las consecuencias de un hecho, que ya ha sido ejecutado, como es el desalojo y la demolición en el caso, y en congruencia con lo indicado, es posible concluir que no subsiste, una pretensión cautelar de urgencia susceptible de ser amparada por la presen vía, cuyo es el único objeto de la acción de tutela constitucional, por lo que el recurso deducido ha sido correctamente.<br/><br/>Cuarto: Que lo anteriormente razonado, lo es sin perjuicio de las demás acciones resarcitorias o infraccionales que pudieran corresponder a los afectados en el caso, pero teniendo presente que tales demandas, por su naturaleza, responden a una materia jurídica de lato conocimiento, no reparable por la presente vía, tal como se expuso.<br/><br/>Por estas consideraciones y de conformidad, además, con lo prevenido en el artículo 20 de la Constitución Política de la República y Auto Acordado de esta Corte sobre la materia, se confirma la sentencia apelada de doce de septiembre de dos mil veintidós, dictada por la Corte de Apelaciones de Antofagasta.<br/>Regístrese y devuélvase.<br/><br/>Rol Nº 114.967-2022.<br/><br/>","texto_sentencia_preview":"Santiago, a cuatro de enero de dos mil veintitrés.<br/><br/>A los alegatos solicitados en autos, no ha lugar.<br/><br/>Vistos:<br/>Se reproduce la sentencia en alzada, con excepción de los considerandos quinto al décimo cuarto, que se eliminan.<br/><br/>Y se tiene además presente:<br/>Primero: Que en cuanto al fondo, y de conformidad al petitorio del recurso contenido en el libelo, se persigue por los actores que se deje sin efecto y disponer los procedimientos sancionatorios pertinentes por la dictación de la Resolución Exenta N° 660-2022, de 13 de julio de 2022, emanada de la Delegación Presidencial Regional de Antofagasta, por medio de la cual se les requirió la restitución de inmueble de propiedad fiscal ocupado por los primeros, bajo apercibimiento de desalojo con auxilio de la fuerza pública.<br/><br/>Segundo: Que, consta del mérito de los informes y antecedentes agregados al presente expediente digital, resultan hechos no controvertido por las partes, que: a) los actores no esgrimieron la existencia de título o a","sent__page_count_i":3,"tipo_archivo_s":"application/msword","sent__character_count_i":2147,"num_norma_ss":["19175","19175","100","1939","100"],"id_tiponorma_ss":["1","1","2","15","2"],"tipo_num_ss":["LEY 19175","LEY 19175","DECRETO 100","DECRETO LEY 1939","DECRETO 100"],"id_norma_ss":["30542","30542","242302","6778","242302"],"id_parte_ss":["8500399","8500402","8563609","8739316","8563489"],"gls_usocomun_ss":["LEY 19175","LEY 19175","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE","DECRETO LEY 1939","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE"],"norma_articulo_ss":["LEY 19175\\\\tART. 2","LEY 19175\\\\tART. 4","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE\\\\tART. 116","DECRETO LEY 1939\\\\tART. 19","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE\\\\tART. 20"],"gls_tituloparte_ss":["Art. 2","Art. 4","Art. 116","Art. 19","Art. 20"],"gls_tiponorma_ss":["Ley","Ley","Decreto","Decreto Ley","Decreto"],"inciso_ss":["letras b), c) y o)","letra h)"],"gls_titulonorma_ss":["LEY ORGANICA CONSTITUCIONAL SOBRE GOBIERNO Y ADMINISTRACION REGIONAL","LEY ORGANICA CONSTITUCIONAL SOBRE GOBIERNO Y ADMINISTRACION REGIONAL","FIJA EL TEXTO REFUNDIDO, COORDINADO Y SISTEMATIZADO DE LA CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE","NORMAS SOBRE ADQUISICION, ADMINISTRACION Y DISPOSICION DE BIENES DEL ESTADO","FIJA EL TEXTO REFUNDIDO, COORDINADO Y SISTEMATIZADO DE LA CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE"],"id_normativa_ss":["14680","14062","25384","11376","981"],"tip_causa_juz_i":" ","TEXTO_ETIQUETADO_t":["<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\ <Sentencia>\ <Metadatos>\ <CorrelativoDocumentoId>5805349</CorrelativoDocumentoId>\ <Sala>TERCERA, CONSTITUCIONAL</Sala>\ <Rol>114967</Rol>\ <Era>2022</Era>\ <Fecha_Sentencia>2023-01-04 00:00:00</Fecha_Sentencia>\ <Caratulado>SANTANDER/DELEGACIÓN PRESIDENCIAL ANTOFAGASTA</Caratulado>\ <TipoRecurso>(Civil) Apelación Protección</TipoRecurso>\ <ResultadoRecurso>CONFIRMA SENTENCIA APELADA</ResultadoRecurso>\ <Organizaciones><Organizacion id=\\"org-1\\" organizacionId=\\"\\" etiqueta=\\"\\" uri=\\"\\">Antofagasta</Organizacion><Organizacion id=\\"org-2\\" organizacionId=\\"\\" etiqueta=\\"\\" uri=\\"\\">Corte de Apelaciones de Antofagasta</Organizacion></Organizaciones><Lugares><Lugar id=\\"lug-1\\" url=\\"http://servicios.cendoc.pjud/recurso/cl/lugar/santiago\\">Santiago</Lugar></Lugares><Documentos><Documento id=\\"doc-1\\" uri=\\"http://servicios.cendoc.pjud/recurso/cl/sentencia/660-2022\\" control_calidad=\\"1\\" tipo=\\"2\\" tipoDocumento=\\"Jurisprudencia\\">Resolución Exenta N° 660-2022</Documento><Documento id=\\"doc-3\\" sentenciaId=\\"375871\\" uri=\\"http://servicios.cendoc.pjud/recurso/cl/sentencia/114967-2022\\" tipo=\\"2\\" tipoDocumento=\\"Jurisprudencia\\">Rol Nº 114.967-2022</Documento></Documentos></Metadatos>\ <ContenidoSentencia><FechaSentencia><Lugar id=\\"lug-1\\">Santiago</Lugar>, a <Fecha>cuatro de enero de dos mil</Fecha> veintitrés.</FechaSentencia><Otro>\ \ A los alegatos solicitados en autos, no ha lugar.\ \ </Otro><CuerpoSentencia><ParteExpositiva>Vistos:\ \ Se reproduce la sentencia en alzada, con excepción de los considerandos quinto al décimo cuarto, que se eliminan.\ \ Y se tiene además presente:\ \ Primero: Que en cuanto al fondo, y de conformidad al petitorio del recurso contenido en el libelo, se persigue por los actores que se deje sin efecto y disponer los procedimientos sancionatorios pertinentes por la dictación de la <Documento id=\\"doc-1\\">Resolución Exenta N° 660-2022</Documento>, de <Fecha>13 de julio de 2022</Fecha>, emanada de la Delegación Presidencial Regional de <Organizacion>Antofagasta</Organizacion>, por medio de la cual se les requirió la restitución de inmueble de propiedad fiscal ocupado por los primeros, bajo apercibimiento de desalojo con auxilio de la fuerza pública.\ \ Segundo: Que, consta del mérito de los informes y antecedentes agregados al presente expediente digital, resultan hechos no controvertido por las partes, que: a) los actores no esgrimieron la existencia de título o autorización que habilite la ocupación atribuida; b) que tras la dictación y notificación de la resolución recurrida, se ejecutó con fecha <Fecha>18 de agosto del año 2022</Fecha> la orden de desalojo y demolición de las construcciones emplazadas en el inmueble objeto de la acción.\ \ Tercero: Que de esta manera resulta evidente que, a la fecha, encontrándose consumado el apercibimiento contenido en la decisión reprochada, esta Corte no podría tomar medida alguna tendiente retrotraer las consecuencias de un hecho, que ya ha sido ejecutado, como es el desalojo y la demolición en el caso, y en congruencia con lo indicado, es posible concluir que no subsiste, una pretensión cautelar de urgencia susceptible de ser amparada por la presen vía, cuyo es el único objeto de la acción de tutela constitucional, por lo que el recurso deducido ha sido correctamente.\ \ Cuarto: Que lo anteriormente razonado, lo es sin perjuicio de las demás acciones resarcitorias o infraccionales que pudieran corresponder a los afectados en el caso, pero teniendo presente que tales demandas, por su naturaleza, responden a una materia jurídica de lato conocimiento, no reparable por la presente vía, tal como se expuso.\ \ </ParteExpositiva><ParteResolutiva>Por estas consideraciones y de conformidad, además, con lo prevenido en el <Documento>artículo 20 de la Constitución Política de la República</Documento> y Auto Acordado de esta Corte sobre la materia, se confirma la sentencia apelada de <Fecha>doce de septiembre de dos mil</Fecha> veintidós, dictada por la <Organizacion>Corte de Apelaciones de Antofagasta</Organizacion>.\  </ParteResolutiva></CuerpoSentencia><Registrese>\ Regístrese y devuélvase.\ </Registrese>\ <Documento id=\\"doc-3\\">Rol Nº 114.967-2022</Documento>.\ </ContenidoSentencia>\ <formatOutput>1</formatOutput></Sentencia>\ "],"_version_":1774839541599830000,"url_acceso_sentencia":"https://juris.pjud.cl/busqueda/pagina_detalle_sentencia/?k=eWhBTldqYURQcHlZYVFQcHBJMm9IUT09","url_corta_acceso_sentencia":"https://juris.pjud.cl/busqueda/u?b0ygw","cita_bibliografica":"SANTANDER/DELEGACIÓN PRESIDENCIAL ANTOFAGASTA: 04-01-2023 ((CIVIL) APELACIÓN PROTECCIÓN), Rol N° 114967-2022. En Buscador Jurisprudencial de la Corte Suprema (https://juris.pjud.cl/busqueda/u?b0ygw). Fecha de consulta: 27-09-2023","id_obj_sentencia_guardada":"","materias":[],"normas_xml":[]}');
    body.append('numero_pestanna', '2');
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://juris.pjud.cl/busqueda/webservices';
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions, retainSession: true});
    await validateSentenciaRequest({responsePage, isContent: true, option: 2});
    return responsePage;
};

const clickTabCorteSuprema = async function ({datos, canonicalURL, headers}) {
    console.log("clickTabTribunales");
    let customHeaders = {
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Origin": "https://juris.pjud.cl",
        "Pragma": "no-cache",
        "Referer": "https://juris.pjud.cl/busqueda?Compendio_de_Salud_de_Corte_Suprema",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);
    const body = new FormData();
    body.append('_token', getSharedVariable('corte-token'));
    body.append('cod_ws', '6');
    body.append('datos', JSON.stringify(datos));
    // body.append('datos', '{"gls_sala_sup_s":"TERCERA, CONSTITUCIONAL","flg_reserva_i":0,"sent__organismo_s":"SIN INFORMACION","fec_sentencia_sup_dt":"04-01-2023","gls_corte_s":"C.A. de Antofagasta","sent__base_s":"Corte Suprema","cod_corte_i":15,"sent__categorizacion_s":"DERECHO CONSTITUCIONAL, Bienes nacionales de uso público, bienes fiscales y municipales, Ocupación","id_relator_i":0,"id_sala_sup_i":3,"rol_era_sup_s":"114967-2022","id_instancia":1,"era_sup_i":2022,"caratulado_s":"SANTANDER/DELEGACIÓN PRESIDENCIAL ANTOFAGASTA","cod_libro_sup_s":"1","crr_documento_id_i":5805349,"resultado_recurso_sup_s":"CONFIRMA SENTENCIA APELADA","id":"3175605","gls_relator_s":"Sin Relator ","rol_era_ape_s":"20650-2022","era_juz_i":1900,"gls_redactor_s":"Ministro no Identificado ","id_redactor_i":77,"cod_libro_corte_i":34,"analisis_s":"ConAnalisis","gls_tip_recurso_sup_s":"(CIVIL) APELACIÓN PROTECCIÓN","sent__motivo_exclusion_s":"-","id_tip_recurso_sup_s":"CV03","sent__fec_actualiza_dt":"2023-08-21T07:00:02Z","gls_libro_sup_s":"Civil","cod_juz_i":0,"rol_corte_i":20650,"era_corte_i":2022,"rol_juz_i":0,"rol_sup_i":114967,"id_submateria_ss":["1324"],"gls_ministro_ss":["Sergio Muñoz Gajardo","Juan Muñoz Pardo","Mario Carroza Espinosa","Enrique Alcalde Rodríguez","Jean Matus Acuña"],"id_voto_ss":["3","3","3","3","3"],"id_ministro_ss":["83","84","222","526","621"],"id_descriptor_ss":["2753","3225","3641","4336","4384","5579","6882","12386","12557","30061","32806","37159","39288","39486","66287"],"gls_descriptor_ss":["Vías de hecho","Ausencia de derecho indubitado","Plan regulador comunal","Ocupación","Ausencia de un acto arbitrario o ilegal","Requisitos del recurso de protección","Desalojo","Auxilio de la fuerza pública","Demolición de obra","Bienes nacionales de uso público, bienes fiscales y municipales","Delegación presidencial","Falta de autorización","Recurso de protección no constituye instancia de declaración de derechos","Asunto controvertido","Construcción en predio ajeno"],"tamano_archivo_i":24576,"sent__creator_s":"Sala 03 Corte Suprema","sent__word_count_i":390,"sent__author_s":"Sala 03 Corte Suprema","sent__autor_s":"Sala 03 Corte Suprema","sent__npages_i":3,"texto_sentencia":"Santiago, a cuatro de enero de dos mil veintitrés.<br/><br/>A los alegatos solicitados en autos, no ha lugar.<br/><br/>Vistos:<br/>Se reproduce la sentencia en alzada, con excepción de los considerandos quinto al décimo cuarto, que se eliminan.<br/><br/>Y se tiene además presente:<br/>Primero: Que en cuanto al fondo, y de conformidad al petitorio del recurso contenido en el libelo, se persigue por los actores que se deje sin efecto y disponer los procedimientos sancionatorios pertinentes por la dictación de la Resolución Exenta N° 660-2022, de 13 de julio de 2022, emanada de la Delegación Presidencial Regional de Antofagasta, por medio de la cual se les requirió la restitución de inmueble de propiedad fiscal ocupado por los primeros, bajo apercibimiento de desalojo con auxilio de la fuerza pública.<br/><br/>Segundo: Que, consta del mérito de los informes y antecedentes agregados al presente expediente digital, resultan hechos no controvertido por las partes, que: a) los actores no esgrimieron la existencia de título o autorización que habilite la ocupación atribuida; b) que tras la dictación y notificación de la resolución recurrida, se ejecutó con fecha 18 de agosto del año 2022 la orden de desalojo y demolición de las construcciones emplazadas en el inmueble objeto de la acción.<br/><br/>Tercero: Que de esta manera resulta evidente que, a la fecha, encontrándose consumado el apercibimiento contenido en la decisión reprochada, esta Corte no podría tomar medida alguna tendiente retrotraer las consecuencias de un hecho, que ya ha sido ejecutado, como es el desalojo y la demolición en el caso, y en congruencia con lo indicado, es posible concluir que no subsiste, una pretensión cautelar de urgencia susceptible de ser amparada por la presen vía, cuyo es el único objeto de la acción de tutela constitucional, por lo que el recurso deducido ha sido correctamente.<br/><br/>Cuarto: Que lo anteriormente razonado, lo es sin perjuicio de las demás acciones resarcitorias o infraccionales que pudieran corresponder a los afectados en el caso, pero teniendo presente que tales demandas, por su naturaleza, responden a una materia jurídica de lato conocimiento, no reparable por la presente vía, tal como se expuso.<br/><br/>Por estas consideraciones y de conformidad, además, con lo prevenido en el artículo 20 de la Constitución Política de la República y Auto Acordado de esta Corte sobre la materia, se confirma la sentencia apelada de doce de septiembre de dos mil veintidós, dictada por la Corte de Apelaciones de Antofagasta.<br/>Regístrese y devuélvase.<br/><br/>Rol Nº 114.967-2022.<br/><br/>","texto_sentencia_preview":"Santiago, a cuatro de enero de dos mil veintitrés.<br/><br/>A los alegatos solicitados en autos, no ha lugar.<br/><br/>Vistos:<br/>Se reproduce la sentencia en alzada, con excepción de los considerandos quinto al décimo cuarto, que se eliminan.<br/><br/>Y se tiene además presente:<br/>Primero: Que en cuanto al fondo, y de conformidad al petitorio del recurso contenido en el libelo, se persigue por los actores que se deje sin efecto y disponer los procedimientos sancionatorios pertinentes por la dictación de la Resolución Exenta N° 660-2022, de 13 de julio de 2022, emanada de la Delegación Presidencial Regional de Antofagasta, por medio de la cual se les requirió la restitución de inmueble de propiedad fiscal ocupado por los primeros, bajo apercibimiento de desalojo con auxilio de la fuerza pública.<br/><br/>Segundo: Que, consta del mérito de los informes y antecedentes agregados al presente expediente digital, resultan hechos no controvertido por las partes, que: a) los actores no esgrimieron la existencia de título o a","sent__page_count_i":3,"tipo_archivo_s":"application/msword","sent__character_count_i":2147,"num_norma_ss":["19175","19175","100","1939","100"],"id_tiponorma_ss":["1","1","2","15","2"],"tipo_num_ss":["LEY 19175","LEY 19175","DECRETO 100","DECRETO LEY 1939","DECRETO 100"],"id_norma_ss":["30542","30542","242302","6778","242302"],"id_parte_ss":["8500399","8500402","8563609","8739316","8563489"],"gls_usocomun_ss":["LEY 19175","LEY 19175","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE","DECRETO LEY 1939","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE"],"norma_articulo_ss":["LEY 19175\\\\tART. 2","LEY 19175\\\\tART. 4","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE\\\\tART. 116","DECRETO LEY 1939\\\\tART. 19","CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE\\\\tART. 20"],"gls_tituloparte_ss":["Art. 2","Art. 4","Art. 116","Art. 19","Art. 20"],"gls_tiponorma_ss":["Ley","Ley","Decreto","Decreto Ley","Decreto"],"inciso_ss":["letras b), c) y o)","letra h)"],"gls_titulonorma_ss":["LEY ORGANICA CONSTITUCIONAL SOBRE GOBIERNO Y ADMINISTRACION REGIONAL","LEY ORGANICA CONSTITUCIONAL SOBRE GOBIERNO Y ADMINISTRACION REGIONAL","FIJA EL TEXTO REFUNDIDO, COORDINADO Y SISTEMATIZADO DE LA CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE","NORMAS SOBRE ADQUISICION, ADMINISTRACION Y DISPOSICION DE BIENES DEL ESTADO","FIJA EL TEXTO REFUNDIDO, COORDINADO Y SISTEMATIZADO DE LA CONSTITUCION POLITICA DE LA REPUBLICA DE CHILE"],"id_normativa_ss":["14680","14062","25384","11376","981"],"tip_causa_juz_i":" ","TEXTO_ETIQUETADO_t":["<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\ <Sentencia>\ <Metadatos>\ <CorrelativoDocumentoId>5805349</CorrelativoDocumentoId>\ <Sala>TERCERA, CONSTITUCIONAL</Sala>\ <Rol>114967</Rol>\ <Era>2022</Era>\ <Fecha_Sentencia>2023-01-04 00:00:00</Fecha_Sentencia>\ <Caratulado>SANTANDER/DELEGACIÓN PRESIDENCIAL ANTOFAGASTA</Caratulado>\ <TipoRecurso>(Civil) Apelación Protección</TipoRecurso>\ <ResultadoRecurso>CONFIRMA SENTENCIA APELADA</ResultadoRecurso>\ <Organizaciones><Organizacion id=\\"org-1\\" organizacionId=\\"\\" etiqueta=\\"\\" uri=\\"\\">Antofagasta</Organizacion><Organizacion id=\\"org-2\\" organizacionId=\\"\\" etiqueta=\\"\\" uri=\\"\\">Corte de Apelaciones de Antofagasta</Organizacion></Organizaciones><Lugares><Lugar id=\\"lug-1\\" url=\\"http://servicios.cendoc.pjud/recurso/cl/lugar/santiago\\">Santiago</Lugar></Lugares><Documentos><Documento id=\\"doc-1\\" uri=\\"http://servicios.cendoc.pjud/recurso/cl/sentencia/660-2022\\" control_calidad=\\"1\\" tipo=\\"2\\" tipoDocumento=\\"Jurisprudencia\\">Resolución Exenta N° 660-2022</Documento><Documento id=\\"doc-3\\" sentenciaId=\\"375871\\" uri=\\"http://servicios.cendoc.pjud/recurso/cl/sentencia/114967-2022\\" tipo=\\"2\\" tipoDocumento=\\"Jurisprudencia\\">Rol Nº 114.967-2022</Documento></Documentos></Metadatos>\ <ContenidoSentencia><FechaSentencia><Lugar id=\\"lug-1\\">Santiago</Lugar>, a <Fecha>cuatro de enero de dos mil</Fecha> veintitrés.</FechaSentencia><Otro>\ \ A los alegatos solicitados en autos, no ha lugar.\ \ </Otro><CuerpoSentencia><ParteExpositiva>Vistos:\ \ Se reproduce la sentencia en alzada, con excepción de los considerandos quinto al décimo cuarto, que se eliminan.\ \ Y se tiene además presente:\ \ Primero: Que en cuanto al fondo, y de conformidad al petitorio del recurso contenido en el libelo, se persigue por los actores que se deje sin efecto y disponer los procedimientos sancionatorios pertinentes por la dictación de la <Documento id=\\"doc-1\\">Resolución Exenta N° 660-2022</Documento>, de <Fecha>13 de julio de 2022</Fecha>, emanada de la Delegación Presidencial Regional de <Organizacion>Antofagasta</Organizacion>, por medio de la cual se les requirió la restitución de inmueble de propiedad fiscal ocupado por los primeros, bajo apercibimiento de desalojo con auxilio de la fuerza pública.\ \ Segundo: Que, consta del mérito de los informes y antecedentes agregados al presente expediente digital, resultan hechos no controvertido por las partes, que: a) los actores no esgrimieron la existencia de título o autorización que habilite la ocupación atribuida; b) que tras la dictación y notificación de la resolución recurrida, se ejecutó con fecha <Fecha>18 de agosto del año 2022</Fecha> la orden de desalojo y demolición de las construcciones emplazadas en el inmueble objeto de la acción.\ \ Tercero: Que de esta manera resulta evidente que, a la fecha, encontrándose consumado el apercibimiento contenido en la decisión reprochada, esta Corte no podría tomar medida alguna tendiente retrotraer las consecuencias de un hecho, que ya ha sido ejecutado, como es el desalojo y la demolición en el caso, y en congruencia con lo indicado, es posible concluir que no subsiste, una pretensión cautelar de urgencia susceptible de ser amparada por la presen vía, cuyo es el único objeto de la acción de tutela constitucional, por lo que el recurso deducido ha sido correctamente.\ \ Cuarto: Que lo anteriormente razonado, lo es sin perjuicio de las demás acciones resarcitorias o infraccionales que pudieran corresponder a los afectados en el caso, pero teniendo presente que tales demandas, por su naturaleza, responden a una materia jurídica de lato conocimiento, no reparable por la presente vía, tal como se expuso.\ \ </ParteExpositiva><ParteResolutiva>Por estas consideraciones y de conformidad, además, con lo prevenido en el <Documento>artículo 20 de la Constitución Política de la República</Documento> y Auto Acordado de esta Corte sobre la materia, se confirma la sentencia apelada de <Fecha>doce de septiembre de dos mil</Fecha> veintidós, dictada por la <Organizacion>Corte de Apelaciones de Antofagasta</Organizacion>.\  </ParteResolutiva></CuerpoSentencia><Registrese>\ Regístrese y devuélvase.\ </Registrese>\ <Documento id=\\"doc-3\\">Rol Nº 114.967-2022</Documento>.\ </ContenidoSentencia>\ <formatOutput>1</formatOutput></Sentencia>\ "],"_version_":1774839541599830000,"url_acceso_sentencia":"https://juris.pjud.cl/busqueda/pagina_detalle_sentencia/?k=eWhBTldqYURQcHlZYVFQcHBJMm9IUT09","url_corta_acceso_sentencia":"https://juris.pjud.cl/busqueda/u?b0ygw","cita_bibliografica":"SANTANDER/DELEGACIÓN PRESIDENCIAL ANTOFAGASTA: 04-01-2023 ((CIVIL) APELACIÓN PROTECCIÓN), Rol N° 114967-2022. En Buscador Jurisprudencial de la Corte Suprema (https://juris.pjud.cl/busqueda/u?b0ygw). Fecha de consulta: 27-09-2023","id_obj_sentencia_guardada":"","materias":[],"normas_xml":[]}');
    body.append('numero_pestanna', '3');
    let method = "POST";
    let requestOptions = {method, body, headers: _headers};
    let requestURL = 'https://juris.pjud.cl/busqueda/webservices';
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions, retainSession: true});
    //TODO: validate tribunales option number and pdf link parameter attributes values
    await validateSentenciaRequest({responsePage, isContent: true, canBeEmpty: true, option: 3});
    return responsePage;
};

const downloadPdf = async function ({canonicalURL, headers}) {
    let customHeaders = {
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Pragma": "no-cache",
        "Referer": "https://juris.pjud.cl/busqueda?Compendio_de_Salud_de_Corte_Suprema",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "Accept-Encoding": "gzip, deflate, br"
    };
    let _headers = Object.assign(customHeaders, headers);

    let method = "GET";
    let requestOptions = {method, headers: _headers};
    let requestURL = canonicalURL + '&_=' + Date.now();
    let responsePage = await fetchPage({canonicalURL, requestURL, requestOptions, retainSession: true});
    let type = responsePage.response.headers.get('content-type');
    //throw type;
    if (/octet/i.test(type)) {
        let name = responsePage.response.headers.get('content-disposition');
        let newtype = /\.pdf/i.test(name) ? "application/pdf" : /\.docx/i.test(name) ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : /\.doc/i.test(name) ? "application/msword" : null;
        console.log('disposition:', type, name);
        if (newtype) {
            responsePage.response.headers.set('content-type', newtype);
            type = newtype;
            type && console.log(`TYPE = ${type}`);
        }
    }
    type && console.log(`TYPE = ${type}`);
    if (responsePage.response.ok && /pdf|word/i.test(type)) {//Make sure your binary fileType is permitted by this regex
        let contentSize = parseInt(responsePage.response.headers.get('content-length') || "-1");
        let buffer = await responsePage.response.buffer();
        let bufferLength = buffer.length;
        //throw JSON.stringify({contentSize, bufferLength, type})
        if (contentSize < 0 && bufferLength || bufferLength === contentSize) {
            responsePage.response = new fetch.Response(buffer, responsePage.response);
        } else if (contentSize <= 0 || bufferLength == 0) {//empty response
            responsePage.response.ok = false;
            responsePage.response.status = 404;
            responsePage.response.statusText = `Empty ${type} document download: ${contentSize} > ${bufferLength}\n`.toUpperCase();
            responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
        } else {
            responsePage.response.ok = false;
            responsePage.response.status = 504;
            responsePage.response.statusText = `incomplete ${type} document download: ${contentSize} > ${bufferLength}\n`.toUpperCase();
            responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
        }
    } else if (responsePage.response.ok && !/pdf|word/i.test(type)) {
        responsePage.response.ok = false;
        responsePage.response.statusText = `either not pdf, or request did not succeed: ${responsePage.response.status} && ${type}\n`.toUpperCase();
        responsePage.response.status = 505;
        responsePage.response = new fetch.Response(responsePage.response.statusText, responsePage.response);
    }

    //not else if
    if(type && /empty/i.test(type)){
        console.log(`EMPTY CONTENTS: ${responsePage.response.status} && ${type}\n`.toUpperCase())
        responsePage.response.ok = false;
        responsePage.response.statusText = `either not pdf, or request did not succeed: ${responsePage.response.status} && ${type}\n`.toUpperCase();
        responsePage.response.status = 505;
    }
    return responsePage;
};

async function fetchURL({canonicalURL, headers}) {
    if (/https?:.*https?:/i.test(canonicalURL)) {
        console.error("Rejecting URL", canonicalURL, `returning [];`);
        return [];
    }
    const match = canonicalURL.match(/[\?&]date=(\d{4}-\d{2}-\d{2})(&page=(\d+))?$/i);
    const idMatch = canonicalURL.match(/[\?&]id=([^&]+)$/i);

    if (match) {
        let date = moment(match[1]);
        let page = match[2] ? parseInt(match[2]) : 1;
        return [await searchByDate({date, page, canonicalURL, headers})]
    } else if (idMatch) {
        let id = idMatch[1];
        return await clickVerSentencia({id, canonicalURL, headers});
    } else if (/\/documentos\?opcion=/i.test(canonicalURL)) {
        //throw 'pdf'
        return [await downloadPdf({canonicalURL, headers})];
    } else {
        //return defaultFetchURL({canonicalURL, headers});
        throw `UnExpected URL: ${canonicalURL}`;
    }
}
