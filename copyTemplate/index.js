let templateID = document.getElementById("templateID");
let templateVersion = document.getElementById("templateVersion");
let templateIDDest = document.getElementById("templateIDDest");
let environment = document.getElementById("area");
let environmentDest = document.getElementById("areaDest");
let authorizationHeader = document.getElementById("authorizationHeader");
let authorizationHeaderStg = document.getElementById("authorizationHeaderStg");
let statusBar = document.getElementById("statusBar");
let saveInfoButton = document.getElementById("saveInfoButton");
let checkButton = document.getElementById("checkButton");
let progressBar = document.getElementById("progressBar");
let publishVersion = "";
let templateLMT = {};
let isSaveTemplate
let diffInTemplates = [];

document.getElementById("getInfoButton").addEventListener("click", getWidgets);
saveInfoButton.addEventListener("click", function() { isSaveTemplate = true; saveTemplate(); });
checkButton.addEventListener("click", function() { isSaveTemplate = false; saveTemplate(); });
document.getElementById("clipboardButton").addEventListener("click", function() {getConfigFromClipboard(true);});
document.getElementById("clipboardButtonStg").addEventListener("click", function() {getConfigFromClipboard(false);});
document.getElementById("templateID").addEventListener("change", () => {templateVersion.value = "";});
document.getElementById("area").addEventListener("change", () => {templateVersion.value = "";});


async function getConfigFromClipboard(isProd) {
    if (isProd) {
        authorizationHeader.value = await navigator.clipboard.readText();
    } else {
        authorizationHeaderStg.value = await navigator.clipboard.readText();
    }
    showAlertText(`Токен успешно вставлен в поле ввода "authorization ${isProd ? "PROD" : "STG"}"`, 'light');
}

async function getServiceName(widget) {
    let serviceName = "";
    let data = {
        "limit": 10,
        "searchData": {
            "searchFilter": {
                "platforms": [
                    templateLMT.platform
                ]
            },
            "searchCustom": {
                "verticals": [
                    widget.vertical
                ]
            },
            "searchQuery": {
                "query": widget.name
            }
        }
    };
    let result = await postLayoutApiData(`http://layout-api.${(environmentDest.value != "prod" ? "stg" : "prod")}.a.o3.ru:80/admin/v1/widget-search-list`, data)
    if (!result.error) {
        if (!result.answer?.data?.code) {
            const items = result.answer.widgets;
            if (items && items.length != 0) {
                for (let item of items) {
                    if (widget.name == item.name && widget.vertical == item.vertical && widget.version == item.version) {
                        serviceName = item.serviceName;
                        break;
                    }
                }
            }
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }

    return serviceName;
}

async function getPublishVersions(isSetValue, isSource) {
    if (isSource == undefined) {
        isSource = true;
    }
    let versions = await getTemplateVersions(isSource ? templateID.value : templateIDDest.value, isSource ? environment.value : environmentDest.value);
    
    if (!versions.error) {
        if (!versions.answer?.data?.code) {
            versions = versions.answer.versions;
            publishVersion = versions.find(element => element.status == 'publish').version;
            if (isSetValue) {
                templateVersion.value = publishVersion;
            }
            return true;
        }
        else {
            showAlertText(versions.answer?.data?.message, 'danger');
            return false;
        }
    }
    else {
        showAlertText(versions.error, 'danger');
        return false;
    }
}

async function getLayoutApiData(layoutApiURL, isComboBox, currentEnvironment) {
    let errorText;
        
    const answer = await fetch(layoutApiURL, {
        method: 'GET',
        headers: {
            'Authorization': `${isComboBox ? currentEnvironment : await navigator.clipboard.readText()}`,
            'accept': 'application/json'
        }
        }).then((res) => res.json()).catch(error => {
            errorText = error;
    });
    
    return {"answer": answer, "error": errorText};
}

async function postLayoutApiData(layoutApiURL, data) {
    let errorText;
        
    const answer = await fetch(layoutApiURL, {
        method: 'POST',
        headers: {
            'Authorization': `${(environmentDest.value != "prod" ? authorizationHeaderStg.value : authorizationHeader.value)}`,
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        }).then((res) => res.json()).catch(error => {
            errorText = error;
    });
    
    return {"answer": answer, "error": errorText};
}

async function getTemplateVersions(templateID, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/admin/layout/versions/v1/${templateID}`, true, (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function saveTemplateToLMT(data) {
    return await postLayoutApiData(`http://layout-api.${(environmentDest.value != "prod" ? "stg" : "prod")}.a.o3.ru:80/admin/layout/save/v1`, data)
}

async function saveConfigToLMT(data) {
    return await postLayoutApiData(`http://layout-api.${(environmentDest.value != "prod" ? "stg" : "prod")}.a.o3.ru:80/proxy/composer-sdk/v1/config`, data)
}

async function getLayoutDetail(templateID, version, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/admin/layout/detail/v1/${templateID}?version=${version}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getConfigInfo(name, widgetVersion, vertical, version, serviceName, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(environment.value != "prod" ? "stg" : "prod")}.a.o3.ru:80/proxy/composer-sdk/v1/config?name=${name}&widgetVersion=${widgetVersion}&vertical=${vertical}&version=${version}&serviceName=${serviceName}`, true, (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getLayoutPartInfo(query, platform, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/admin/layout/parts/list/v1?q=${encodeURIComponent(query)}&platform=${platform}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getLayoutPartInfoByKey(key, platform, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/admin/layout/parts/list/v1?key=${key}&platform=${platform}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getLayoutConditionInfo(query, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/condition/get/query?q=${encodeURIComponent(query)}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getLayoutConditionInfoByKey(key, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/condition/get/query?key=${key}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getDataSourceInfo(widget, query, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/v1/admin/config/items/for/datasource/${widget}?q=${encodeURIComponent(query)}&platform=${templateLMT.platform}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getDataSourceInfoByKey(widget, key, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/v1/admin/config/items/for/datasource/${widget}?key=${key}&platform=${templateLMT.platform}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getDesignTypeInfo(widget, query, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/v1/admin/config/items/for/designtype/${widget}?q=${encodeURIComponent(query)}&platform=${templateLMT.platform}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getDesignTypeInfoByKey(widget, key, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/v1/admin/config/items/for/designtype/${widget}?key=${key}&platform=${templateLMT.platform}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

async function getConfigItemByKey(key, currentEnvironment) {
    return await getLayoutApiData(`http://layout-api.${(currentEnvironment != "prod" ? "stg" : "prod")}.a.o3.ru:80/v2/admin/config/item/detail?id=${key}`, true,  (currentEnvironment != "prod" ? authorizationHeaderStg.value : authorizationHeader.value))
}

function drawtemplate() {
    while (accordionParent.firstChild) {
        accordionParent.firstChild.remove();
    }
    drawItem(accordionParent, templateLMT.components, true, "components", "0");
}
async function getWidgets() {
    progressBar.style.setProperty('width', '0%');
    progressBar.innerHTML = "";
    this.innerHTML = "&#8987;";
    saveInfoButton.disabled = false;
    checkButton.disabled = false;
    if (templateVersion.value == "") {
        if (!await getPublishVersions(true)) {
            while (accordionParent.firstChild) {
                accordionParent.firstChild.remove();
            }
            saveInfoButton.disabled = true;
            checkButton.disabled = true;
            
            this.innerHTML = "Получить";
            progressBar.innerHTML = "100%";
            progressBar.style.setProperty('width', '100%');
            return
        }
    }
    const template = await getLayoutDetail(templateID.value, templateVersion.value, environment.value);
    console.log(template)
    if (!template.error) {
        if (!template.answer?.data?.code) {
            templateLMT = template.answer.layout;
            showAlertText('Информация о шаблоне получена.', 'light');
            drawtemplate();
        }
        else {
            showAlertText(template.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(template.error, 'danger');
    }
    progressBar.style.setProperty('width', '100%');
    progressBar.innerHTML = "100%";
    this.innerHTML = "Получить";
}

async function saveTemplate() {
    if (isSaveTemplate) {
        saveInfoButton.innerHTML = "&#8987;";
    } else {
        checkButton.innerHTML = "&#8987;";
    }
    saveInfoButton.disabled = true;;
    checkButton.disabled = true;
    diffInTemplates = [];
    progressBar.style.setProperty('width', '0%');
    progressBar.innerHTML = "";
    if (await getPublishVersions(false, false)) {
        const template = await getLayoutDetail(templateIDDest.value, publishVersion, environmentDest.value);
        newTemplate = {};
        newTemplate.latestVersion = publishVersion
        newTemplate.layout = template.answer.layout
        if (isSaveTemplate) {
            removeIdAndRevision(templateLMT.components)
        }
        await removeOrChangePartAndCondition(templateLMT.components)
        newTemplate.layout.components = templateLMT.components
        newTemplate.updatedVersionResponse = "warn"

        while (accordionParent.firstChild) {
            accordionParent.firstChild.remove();
        }
        
        if (isSaveTemplate) {
            const result = await saveTemplateToLMT(newTemplate);
            if (!result.error) {
                if (!result.answer?.data?.code) {
                    showAlertText(`Шаблон ${templateIDDest.value} с версией ${result.answer?.layout?.version} успешно сохранён`, 'light');
                    
                }
                else {
                    showAlertText(result.answer?.data?.message, 'danger');
                }
            }
            else {
                showAlertText(result.error, 'danger');
            }
        } else {
            let differs = document.createElement('div');
            differs.innerHTML = "Список замен: <br>";
            for (const [index, value] of diffInTemplates.entries()) {
                differs.innerHTML += `<b style='color: ${value.invisible ? "rgba(173, 173, 173, 1)": "black"};'>${index + 1}. ${value.type} - ${value.idWidget}</b><br>`;
                differs.innerHTML += `<span style='color: ${value.invisible ? "rgba(199, 223, 195, 1)": "green"};'>${environment.value.toUpperCase()}: ${value.idOld} - ${value.titleOld}</span><br>`;
                tempValue = " - ";
                if (value.error == 1) {
                    tempValue = `${value.id} - ${value.title}`;
                }
                differs.innerHTML += `<span style='color: ${value.invisible ? "rgba(223, 195, 195, 1)": "red"};'>${environmentDest.value.toUpperCase()}: ${tempValue}</span><br><br>`;
            }
            accordionParent.appendChild(differs);

        }
    }
    progressBar.style.setProperty('width', '100%');
    progressBar.innerHTML = "100%";
    console.log(diffInTemplates)
    if (isSaveTemplate) {
        saveInfoButton.innerHTML = "Сохранить";
    } else {
        checkButton.innerHTML = "Проверить";
    }
}

function getTextOfParams(widget) {
    let labelCondition = {'name': '', 'operation': '', 'value': ''};
    let labelSavedCondition = '';
    let isSavedCondition = false;
    if (widget.params) {
        for (let param of widget.params) {
            if (param.name == 'useSavedConditions' && param.bool == true) {
                isSavedCondition = true;
                continue;
            }
            if (param.name == 'conditionId') {
                labelSavedCondition = param.dsTitle;
                continue;
            }
            labelCondition[param.name] = param.text
        }
    }

    if (isSavedCondition)
        return labelSavedCondition;
    else
        return Object.values(labelCondition).join(' ');
}

function addTextToButton(widget, property, accordionButton, isBold) {
    let text = widget[property];
    if (property == 'dsTitle') {
        text = getTextOfParams(widget)
    }
    else {
        if (property == 'view') {
            text = widget?.view?.vertical + '.' + widget?.view?.name + '.' + widget?.view?.version
        }
    }

    if ((property == 'name' && isBold == false) || property == 'vertical' || property == 'version' || property == 'view')
        text = text.toUpperCase()
    switch (property) {
        case 'version': {
            text = 'V.' + text
            break;
        }
        case 'id': {
            text = 'ID: ' + text
            break;
        }
        case 'config': {
            text = 'CONFIG: ' + text
            break;
        }
        case 'view': {
            text = 'VIEW: ' + text
            break;
        }
    }
    if (isBold)
        if (property == 'dsTitle')
            accordionButton.innerHTML += `<span class='cutText'>${text}</span><br>`;
        else
            accordionButton.innerHTML += `<b class='cutText'>${text}</b><br>`;
    else
        accordionButton.innerHTML += `<span class='cutText'>${text} </span>`;
}

function addToTemplate(tempT, indexArray, newWidget, tempIndex, isRemove){
    if (indexArray.length == 1) {
        if (tempIndex < 0) {
            if (tempT?.components?.[indexArray[0]]?.name == 'switchCase') {
                tempT.components[indexArray[0]].placeholders = [...newWidget, ...tempT.components[indexArray[0]].placeholders];
            }
            else {
                if (tempT.placeholders) {
                    if (!tempT.placeholders[indexArray[0]].components) {
                        tempT.placeholders[indexArray[0]].components = []
                    }
                    tempT.placeholders[indexArray[0]].components = [...newWidget, ...tempT.placeholders[indexArray[0]].components];
                }
                else {
                    if (!tempT.components[indexArray[0]].placeholders[0].components) {
                        tempT.components[indexArray[0]].placeholders[0].components = []
                    }
                    tempT.components[indexArray[0]].placeholders[0].components = [...newWidget, ...tempT.components[indexArray[0]].placeholders[0].components];
                }
            }
        }
        else {
            if (tempT.components){
                if (isRemove) {
                    tempT.components.splice(parseInt(indexArray[0]), 1);
                } else {
                    tempT.components.splice(parseInt(indexArray[0]) + tempIndex, 0, ...newWidget);
                }
            }
            else {
                if (isRemove) {
                    tempT.placeholders.splice(parseInt(indexArray[0]), 1);
                } else {
                    tempT.placeholders.splice(parseInt(indexArray[0]) + tempIndex, 0, ...newWidget);
                }
            }
        }
        return tempT;
    }
    const firstElement = indexArray.shift();
    if (tempT.components){
        tempT.components[firstElement] = addToTemplate(tempT.components[firstElement], indexArray, newWidget, tempIndex, isRemove);
    }
    else {
        tempT.placeholders[firstElement] = addToTemplate(tempT.placeholders[firstElement], indexArray, newWidget, tempIndex, isRemove);
    }
    
    return tempT;
}

function removeIdAndRevision(widgets){
    for (let [index, widget] of widgets.entries()) {
        progressBar.style.setProperty('width', (index * 100 / widgets.length) + '%');
        delete widget.revision;
        delete widget.id;
        
        if (widget.components) {
            removeIdAndRevision(widget.components)
        }
        if (widget.placeholders) {
            removeIdAndRevision(widget.placeholders)
        }
    }
}

async function removeOrChangePartAndCondition(widgets, isParentVisible){
    for (let [index, widget] of widgets.entries()) {
        progressBar.style.setProperty('width', (index * 100 / widgets.length) + '%');
        if (widget.vertical == "layout" && widget.name == "ghost" && widget.version == "1") {
            diffInTemplates.push({"type": "Виджет " + widget.name, "idWidget": widget.id, "error": 2, "titleOld": "Данный виджет будет заменён на версию 2!", "idOld": "", "invisible": isParentVisible || widget.invisible});
            widget.version = "2";
            let newParams = [];
            newParams.push(widget.params[getParamsIndex(widget.params, "state", 4)]);
            let titleGhost = widget.params[getParamsIndex(widget.params, "vertical", 1)].text + ".";
            titleGhost += widget.params[getParamsIndex(widget.params, "name", 0)].text + ".";
            titleGhost += widget.params[getParamsIndex(widget.params, "version", 2)].int;
            newParams.push({"isSet": true, "name": "view", "dsTitle": titleGhost, "text": titleGhost});
            widget.params = newParams;
            continue;
        }
        if (widget.name?.includes("layoutPart")) {
            const intPart = widget.params[0].int || "0";
            const result0 = await getLayoutPartInfoByKey(intPart, widget.name.replace("layoutPart", "").toLowerCase(), environment.value)
            let titlePart = widget.params[0].dsTitle
            let tempTitlePart = titlePart || "-- Нет парта --";
            if (!result0.error) {
                if (!result0.answer?.data?.code) {
                    titlePart = result0.answer.items[0].title;
                    if (!(tempTitlePart == "-- Нет парта --" && intPart == "0")) {
                        tempTitlePart = titlePart;
                    }
                }
                else {
                    //showAlertText(result0.answer?.data?.message, 'danger');
                    //return
                }
            }
            else {
                showAlertText(result0.error, 'danger');
                //return;
            }

            const result = await getLayoutPartInfo(titlePart, widget.name.replace("layoutPart", "").toLowerCase(), environmentDest.value)
            if (!result.error) {
                if (!result.answer?.data?.code) {
                    const items = result.answer.items;
                    if (items && items.length != 0) {
                        const findIndex = getIndexInArray(items, titlePart);
                        widget.params[0].dsTitle = items[findIndex].title;
                        widget.params[0].int = items[findIndex].value;
                        diffInTemplates.push({"type": "Виджет " + widget.name, "idWidget": widget.id, "error": 1, "title": items[findIndex].title, "id": items[findIndex].value, "titleOld": tempTitlePart, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                    } else {
                        diffInTemplates.push({"type": "Виджет " + widget.name, "idWidget": widget.id, "error": 0, "titleOld": tempTitlePart, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                        widget.params.forEach(function(item){ delete item.dsTitle; delete item.int; });
                    }
                }
                else {
                    showAlertText(result.answer?.data?.message, 'danger');
                }
            }
            else {
                showAlertText(result.error, 'danger');
            }
        } else if (widget.name == "condition" && widget.params[getParamsIndex(widget.params, "useSavedConditions", 0)]?.bool == true) {
            let indexConditionId = getParamsIndex(widget.params, "conditionId", 4);
            
            const intPart = widget.params[indexConditionId].int || "0";
            const result0 = await getLayoutConditionInfoByKey(intPart, environment.value)
            let titleCondition = widget.params[indexConditionId].dsTitle
            let tempTileCondition = titleCondition || "-- Нет условия --";
            if (!result0.error) {
                if (!result0.answer?.data?.code) {
                    titleCondition = result0.answer.items[0].title;
                    if (!(tempTileCondition == "-- Нет условия --" && intPart == "0")) {
                        tempTileCondition = titleCondition;
                    }
                }
                else {
                    //showAlertText(result0.answer?.data?.message, 'danger');
                    //return
                }
            }
            else {
                showAlertText(result0.error, 'danger');
                //return;
            }
            
            const result = await getLayoutConditionInfo(titleCondition, environmentDest.value)
            if (!result.error) {
                if (!result.answer?.data?.code) {
                    const items = result.answer.items;
                    if (items && items.length != 0) {
                        const findIndex = getIndexInArray(items, titleCondition);
                        widget.params[indexConditionId].dsTitle = items[findIndex].title;
                        widget.params[indexConditionId].int = items[findIndex].value;
                        diffInTemplates.push({"type": "Виджет condition", "idWidget": widget.id, "error": 1, "title": items[findIndex].title, "id": items[findIndex].value, "titleOld": tempTileCondition, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                    } else {
                        diffInTemplates.push({"type": "Виджет condition", "idWidget": widget.id, "error": 0, "titleOld": tempTileCondition, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                        widget.params.forEach(function(item){ delete item.dsTitle; delete item.int; });
                    }
                }
                else {
                    showAlertText(result.answer?.data?.message, 'danger');
                }
            }
            else {
                showAlertText(result.error, 'danger');
            }
        } else if (widget?.params?.[0]?.name == "configIdDataSource") {
            console.log(widget)
            const intPart = widget.params[0].int || "0";
            const result0 = await getConfigItemByKey(intPart, environment.value)
            console.log(result0)
            let titleCondition = widget.params[0].dsTitle
            let tempTileCondition = titleCondition || "-- Нет DataSource --";
            let entityName = ""
            if (!result0.error) {
                if (!result0.answer?.data?.code) {
                    titleCondition = result0.answer.item.title;
                    entityName = result0.answer.item.entityName;
                    if (!(tempTileCondition == "-- Нет DataSource --" && intPart == "0")) {
                        tempTileCondition = titleCondition;
                    }
                }
                else {
                    //showAlertText(result0.answer?.data?.message, 'danger');
                    //return
                }
            }
            else {
                showAlertText(result0.error, 'danger');
                //return;
            }
            
            const result = await getDataSourceInfo(getFullName(widget), titleCondition, environmentDest.value)
            if (!result.error) {
                if (!result.answer?.data?.code) {
                    const items = result.answer.items;
                    if (items && items.length != 0) {
                        const findIndex = getIndexInArray(items, titleCondition, true);
                        widget.params[0].dsTitle = items[findIndex].title;
                        widget.params[0].int = items[findIndex].value;
                        diffInTemplates.push({"type": "Виджет " + getFullName(widget) + " DataSource", "idWidget": widget.id, "error": 1, "title": items[findIndex].title, "id": items[findIndex].value, "titleOld": intPart + " | " + entityName + " / " + tempTileCondition, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                    } else {
                        diffInTemplates.push({"type": "Виджет " + getFullName(widget) + " DataSource", "idWidget": widget.id, "error": 0, "titleOld": intPart + " | " + entityName + " / " + tempTileCondition, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                        widget.params.forEach(function(item){ if ( item.name == "configIdDataSource" ) { delete item.dsTitle; delete item.int; } });
                    }
                }
                else {
                    showAlertText(result.answer?.data?.message, 'danger');
                }
            }
            else {
                showAlertText(result.error, 'danger');
            }
            
            if (widget?.params?.[1]?.name == "configIdDesignType") {
                const intPart = widget.params[1].int || "0";
                const result0 = await getConfigItemByKey(intPart, environment.value)
                let titleCondition = widget.params[1].dsTitle
                let tempTileCondition = titleCondition || "-- Нет DesignType --";
                let entityName = ""
                if (!result0.error) {
                    if (!result0.answer?.data?.code) {
                        titleCondition = result0.answer.item.title;
                        entityName = result0.answer.item.entityName;
                        if (!(tempTileCondition == "-- Нет DesignType --" && intPart == "0")) {
                            tempTileCondition = titleCondition;
                        }
                    }
                    else {
                        //showAlertText(result0.answer?.data?.message, 'danger');
                        //return
                    }
                }
                else {
                    showAlertText(result0.error, 'danger');
                    //return;
                }
                
                const result = await getDesignTypeInfo(getFullName(widget), titleCondition, environmentDest.value)
                if (!result.error) {
                    if (!result.answer?.data?.code) {
                        const items = result.answer.items;
                        if (items && items.length != 0) {
                            const findIndex = getIndexInArray(items, titleCondition, true);
                            widget.params[1].dsTitle = items[findIndex].title;
                            widget.params[1].int = items[findIndex].value;
                            diffInTemplates.push({"type": "Виджет " + getFullName(widget) + " DesignType", "idWidget": widget.id, "error": 1, "title": items[findIndex].title, "id": items[findIndex].value, "titleOld": intPart + " | " + entityName + " / " + tempTileCondition, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                        } else {
                            diffInTemplates.push({"type": "Виджет " + getFullName(widget) + " DesignType", "idWidget": widget.id, "error": 0, "titleOld": intPart + " | " + entityName + " / " + tempTileCondition, "idOld": intPart, "invisible": isParentVisible || widget.invisible});
                            widget.params.forEach(function(item){ if ( item.name == "configIdDesignType" ) { delete item.dsTitle; delete item.int; } });
                        }
                    }
                    else {
                        showAlertText(result.answer?.data?.message, 'danger');
                    }
                }
                else {
                    showAlertText(result.error, 'danger');
                }
            }
        } else if (widget.config) {
            if (await getServiceName(widget) != "") {
                const result = await getConfigInfo(widget.name, widget.version, widget.vertical, widget.config, await getServiceName(widget), environment.value)
                if (!result.error) {
                    if (!result.answer?.data?.code) {
                        let widgetConfig = result.answer.config;
                        let tempWidgetConfig = JSON.parse(widgetConfig)
                        
                        await updateConfig(tempWidgetConfig, widget.id, "conditionId", getFullName(widget), isParentVisible || widget.invisible);
                        widgetConfig = JSON.stringify(tempWidgetConfig);
                        
                        let newConfig = {}
                        newConfig.name = widget.name;
                        newConfig.widgetVersion = widget.version;
                        newConfig.vertical = widget.vertical;
                        newConfig.version = "";
                        newConfig.serviceName = await getServiceName(widget);
                        newConfig.config = widgetConfig;
                        
                        const result2 = await saveConfigToLMT(newConfig);
                        
                        if (!result2.error) {
                            if (!result2.answer?.data?.code) {
                                widget.config = result2.answer?.version
                            }
                            else {
                                diffInTemplates.push({"type": "Виджет " + widget.name, "idWidget": widget.id, "error": 1, "titleOld": "конфиг не может быть сохранён", "title": result2.answer.data.message, "id": "", "idOld": widget.config, "invisible": isParentVisible || widget.invisible});
                                //showAlertText(result2.answer?.data?.message, 'danger');
                            }
                        }
                        else {
                            showAlertText(result2.error, 'danger');
                        }
                        
                    }
                    else {
                        showAlertText(result.answer?.data?.message, 'danger');
                    }
                } else {
                    showAlertText(result.error, 'danger');
                }
            } else {
                diffInTemplates.push({"type": "Виджет " + widget.name, "idWidget": widget.id, "error": 0, "titleOld": "конфиг", "idOld": widget.config, "invisible": isParentVisible || widget.invisible});
            }
        }
        
        
        if (widget.components) {
            await removeOrChangePartAndCondition(widget.components, isParentVisible || widget.invisible)
        }
        if (widget.placeholders) {
            await removeOrChangePartAndCondition(widget.placeholders, isParentVisible || widget.invisible)
        }
    }
}

function getFullName(widget) {
    return widget.vertical + "." + widget.name + "." + widget.version;
}

function getParamsIndex(params, paramName, defaultIndex) {
    let indexConditionId = defaultIndex;
    for (let [index, param] of params.entries()) {
        if (param.name == paramName) {
            indexConditionId = index;
            break;
        }
    }
    return indexConditionId;
}

function getIndexInArray(items, title, split) {
    let index = 0;
    if (split == undefined) {
        split = false
    }
    for (let [i, item] of items.entries()) {
        let itemTitle = item.title
        if (split) {
            itemTitle = itemTitle.split(" | ")[1]
        }
        if (itemTitle.trim() == title.trim()) {
            index = i;
            break;
        }
    }
    return index;
}

async function updateConfig(config, widgetId, findName, typeSuffix, isParentVisible) {
    if (config instanceof Object) {
        if (config instanceof Array) {
            for (let item of config) {
                await updateConfig(item, widgetId, findName, typeSuffix, isParentVisible);
            }
        } else {
            if (findName in config && config[findName] != 0) {
                const result0 = await getLayoutConditionInfoByKey(config[findName], environment.value)
                let titleCondition = ""
                if (!result0.error) {
                    if (!result0.answer?.data?.code) {
                        titleCondition = result0.answer.items[0].title;
                    }
                    else {
                        showAlertText(result0.answer?.data?.message, 'danger');
                    }
                }
                else {
                    showAlertText(result0.error, 'danger');
                }
                
                const result = await getLayoutConditionInfo(titleCondition, environmentDest.value)
                if (!result.error) {
                    if (!result.answer?.data?.code) {
                        const items = result.answer.items;
                        if (items && items.length != 0) {
                            const findIndex = getIndexInArray(items, titleCondition);
                            diffInTemplates.push({"type": "Условие в виджите " + typeSuffix, "idWidget": widgetId, "error": 1, "title": items[findIndex].title, "id": items[findIndex].value, "titleOld": titleCondition, "idOld": config[findName], "invisible": isParentVisible});
                            config[findName] = items[findIndex].value;
                        } else {
                            diffInTemplates.push({"type": "Условие в виджите " + typeSuffix, "idWidget": widgetId, "error": 0, "titleOld": titleCondition, "idOld": config[findName], "invisible": isParentVisible});
                        }
                    }
                    else {
                        showAlertText(result.answer?.data?.message, 'danger');
                    }
                }
                else {
                    showAlertText(result.error, 'danger');
                }
            }
            for (let property in config) {
                await updateConfig(config[property], widgetId, findName, typeSuffix, isParentVisible);
            }
        }
    }
}

async function drawItem(parent, widgets, isComponent, path, index)
{
    let countIndex = 0;
    for (let [ind, widget] of widgets.entries()) {
        progressBar.style.setProperty('width', (ind * 100 / widgets.length) + '%');
        let dataBsTarget = "widget" + ((widget.id) ? widget.id : "") + (new Date().valueOf() + Math.floor(Math.random() * 1000000));
        let accordion = document.createElement('div');
        accordion.setAttribute('class', 'accordion');
        parent.appendChild(accordion);
        let accordionItem = document.createElement('div');
        let accordionButton = document.createElement('button');
        accordionItem.setAttribute('class', 'accordion-item ' + ((isComponent) ? "" : " containerLMT"));
        accordionItem.setAttribute('id', index + '-' + countIndex);
        accordionItem.addEventListener("mousedown", async (event) => {
            if (!(event.target.parentElement.parentElement.parentElement.parentElement == event.currentTarget || event.target.parentElement.parentElement == event.currentTarget || event.target.parentElement.parentElement.parentElement == event.currentTarget)) return;
            if (!isComponent && accordionButtonContent.innerHTML != '<b>Контейнер</b> ') {
                if (event.button == 0 && !event.shiftKey) {
                    currentWidgetID = [];
                    currentWidget = [];
                }
                if (event.button != 2)
                    return;
            }
        });
        accordion.appendChild(accordionItem);
        let accordionHeader = document.createElement('h2');
        accordionHeader.setAttribute('class', 'accordion-header');
        accordionItem.appendChild(accordionHeader);
        if (!isComponent && widgets.length == 1 && widget?.name == 'default') {
            accordionButton.setAttribute('class', 'accordion-button position-relative accordion-disabled accordion-button-small');
            accordionButton.setAttribute("disabled", "");
        } else {
            accordionButton.setAttribute('class', 'accordion-button position-relative');
        }
        accordionButton.setAttribute('type', 'button');
        accordionButton.setAttribute('data-bs-toggle', 'collapse');
        accordionButton.setAttribute('data-bs-target', '#' + dataBsTarget);
        accordionButton.setAttribute('aria-expanded', 'true');
        accordionButton.setAttribute('aria-controls', dataBsTarget);
        accordionButton.setAttribute('style', 'white-space: pre; font-size: 0.45em;');

        if (widget?.invisible) {
            accordionButton.className += ' collapsed';
            accordionButton.style.background = '#e9ecef';
        }
        
        let accordionButtonContent = document.createElement('div');
        accordionButton.appendChild(accordionButtonContent);
        accordionButtonContent.innerHTML = '';
        
        if (widget.label) {
            addTextToButton(widget, 'label', accordionButtonContent, true)
        }
        
        if (widget.name) {
            if (!widget.label) {
                addTextToButton(widget, 'name', accordionButtonContent, true)
                if (widget?.name == 'condition') {
                    addTextToButton(widget, 'dsTitle', accordionButtonContent, true)
                }
            }
            else {
                if (widget?.name == 'condition') {
                    addTextToButton(widget, 'dsTitle', accordionButtonContent, true)
                }
                addTextToButton(widget, 'name', accordionButtonContent, false)
            }
        }
        if (widget.vertical) {
            addTextToButton(widget, 'vertical', accordionButtonContent, false)
        }
        if (widget.version) {
            addTextToButton(widget, 'version', accordionButtonContent, false)
        }
        
        
        if (widget.id) {
            addTextToButton(widget, 'id', accordionButtonContent, false)
        }
        if (widget.config) {
            addTextToButton(widget, 'config', accordionButtonContent, false)
        }
        if (widget.view) {
            addTextToButton(widget, 'view', accordionButtonContent, false)
        }

        if (!isComponent) {
            accordionButtonContent.innerHTML = '<b>Контейнер</b> ' + accordionButtonContent.innerHTML;
        }
        
        if (!isComponent && widgets.length == 1 && widget?.name == 'default') {
            accordionButtonContent.innerHTML = '';
        }

        accordionButton.className += ' cutText';
        accordionHeader.appendChild(accordionButton);
        
        if (widget.components || widget.placeholders) {
            let accordionBodyParent = document.createElement('div');
            if (widget?.invisible) {
                accordionBodyParent.setAttribute('class', 'ccordion-collapse collapse');
            }
            else {
                accordionBodyParent.setAttribute('class', 'ccordion-collapse collapse show');
            }
            accordionBodyParent.setAttribute('id', dataBsTarget);
            accordionItem.appendChild(accordionBodyParent);
            let accordionBody = document.createElement('div');
            accordionBody.setAttribute('class', 'accordion-body');
            accordionBodyParent.appendChild(accordionBody);
            
            if (widget.components) {
                drawItem(accordionBody, widget.components, true, path + `.components`, index + '-' + countIndex);
            }
            
            if (widget.placeholders) {
                drawItem(accordionBody, widget.placeholders, false, path + `.placeholders`, index + '-' + countIndex);
            }
        } else if (!isComponent && !widget.components && !widget.placeholders) {
            let accordionBodyParent = document.createElement('div');
            accordionBodyParent.setAttribute('class', 'ccordion-collapse collapse show');
            accordionItem.appendChild(accordionBodyParent);
            let accordionBody = document.createElement('div');
            accordionBody.setAttribute('class', 'accordion-body accordion-body-empty');
            accordionBodyParent.appendChild(accordionBody);
            accordionButton.classList.add('accordion-without-arrow');
        } else {
            accordionButton.className += ' dropdown-toggle';
        }
        
        countIndex++;
    }
}

function showAlertText(text, typeMessage) {
    statusBar.removeAttribute("class");
    statusBar.setAttribute("class", `alert alert-${typeMessage}`);
    statusBar.innerHTML = `<div>${text}</div>`;
    setTimeout(() => {
        statusBar.removeAttribute("class");
        statusBar.setAttribute("class", "alert alert-light");
        statusBar.innerHTML = '';
    }, 2000);
}


