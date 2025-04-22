let templateLMT = {};
let latestVersion = 0;
let currentWidget = []
let currentWidgetID = []
let clipboardWidget = []
let clipboardWidgetID = []
let widgetConfig = ""

getInfoButton.addEventListener("click", getWidgets);
saveInfoButton.addEventListener("click", saveTemplate);
document.addEventListener("contextmenu", function (e){
    e.preventDefault();
}, false);
templateID.addEventListener("change", () => {templateVersion.value = "";});
environment.addEventListener("change", () => {templateVersion.value = "";});

document.addEventListener('click', function(event){
    contextMenu.style.display = 'none';
    if (!event.shiftKey) {
        elements = document.getElementsByClassName('accordion-button');
        for (let j = 0; j < elements.length; j++) {
            if (elements[j].style.border == "4px solid blue" && elements[j].parentElement.parentElement.id != currentWidgetID) {
                elements[j].style.border = "";
            }
        }
    }
});


document.getElementById("copyWidget").addEventListener("click", function() {copyWidget(true);});
cutWidget.addEventListener("click", function() {copyWidget(false);});
pasteWidgetUp.addEventListener("click", function() {pasteWidget(0, false);});
pasteWidgetDown.addEventListener("click", function() {pasteWidget(1, false);});
pasteWidgeInto.addEventListener("click", function() {pasteWidget(-1, false);});
deleteWidget.addEventListener("click", function() {pasteWidget(0, true);});
document.getElementById("updateConfig").addEventListener("click", updateConfig);

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

async function removeGhostV1(widgets){
    for (let [index, widget] of widgets.entries()) {
        if (widget.vertical == "layout" && widget.name == "ghost" && widget.version == "1") {
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
        if (widget.components) {
            await removeGhostV1(widget.components)
        }
        if (widget.placeholders) {
            await removeGhostV1(widget.placeholders)
        }
    }
}

async function copyWidget(isCopy) {
    if (currentWidget) {
        let tempObj = {};
        removeGhostV1(currentWidget)
        tempObj.clipboardWidget = currentWidget;
        tempObj.clipboardWidgetID = currentWidgetID;
        tempObj.isCopy = isCopy
        console.log(tempObj)
        localStorage.setItem('clipboardLMTWidgets', JSON.stringify(tempObj));
        
        if (currentWidget.length == 1) {
            showAlertText(`Скопирован <b>${currentWidget[0].name?currentWidget[0].name:"контейнер"}</b> элемент`, 'light');
        } else {
            showAlertText(`Скопированы <b>${currentWidget.length}</b> элемен${getSuffix(currentWidget.length)}`, 'light');
        }
        
        if (!isCopy) {
            pasteWidget(0, true);
        }
        currentWidget = [];
        currentWidgetID = [];
    }
}

async function updateConfig() {
    if (widgetConfig) {
        let newConfig = {}
        newConfig.name = currentWidget[0].name;
        newConfig.widgetVersion = currentWidget[0].version;
        newConfig.vertical = currentWidget[0].vertical;
        newConfig.version = "";
        newConfig.serviceName = (await getServiceName(environment.value, currentWidget[0], [templateLMT.platform]));
        newConfig.config = widgetConfig;

        const result = await saveConfigToLMT(environment.value, newConfig);
        if (result?.version) {
            showAlertText(`Конфиг с версией ${result?.version} успешно сохранён`, 'light');
            let indexArray = currentWidgetID[0].split('-');
            indexArray.shift();
            templateLMT = newConfigToWidget(templateLMT, indexArray, result?.version)
            drawtemplate();
        }
    }
    else {
        showAlertText("Ошибка обновления кофига", 'danger');
    }
}

function getClipboardInfo(name) {
    let returnValue = JSON.parse(localStorage.getItem('clipboardLMTWidgets'));
    returnValue = returnValue?.[name];
    if (returnValue == undefined) {
        returnValue = [];
    }
    
    return returnValue;
}

async function pasteWidget(tempIndex, isRemove) {
    if (currentWidgetID) {
        indexArray = currentWidgetID[0].split('-');
        indexArray.shift();
        let newWidget = [];
        if (!isRemove) {
            newWidget = getClipboardInfo("clipboardWidget");
            if (getClipboardInfo('isCopy')) {
                removeIdAndRevision(newWidget)
            }
            else {
                let tempObj = JSON.parse(localStorage.getItem('clipboardLMTWidgets'))
                tempObj.isCopy = true
                localStorage.setItem('clipboardLMTWidgets', JSON.stringify(tempObj));
            }
            templateLMT = addToTemplate(templateLMT, indexArray, newWidget, tempIndex, isRemove)
            if (newWidget.length == 1) {
                showAlertText(`Добавлен <b>${newWidget[0].name?newWidget[0].name:"контейнер"}</b> элемент`, 'light');
            } else {
                showAlertText(`Добавлены <b>${newWidget.length}</b> элемен${getSuffix(newWidget.length)}`, 'light');
            }
        } else {
            tempArrayOfIndex = [...currentWidgetID]
            tempArrayOfIndex.sort();
            tempArrayOfIndex.reverse()
            for (let i = 0; i < tempArrayOfIndex.length; i++) {
                indexArray = tempArrayOfIndex[i].split('-');
                indexArray.shift();
                templateLMT = addToTemplate(templateLMT, indexArray, newWidget, tempIndex, isRemove)
            }
            if (tempArrayOfIndex.length == 1) {
                showAlertText(`Удалён <b>${currentWidget[0].name?currentWidget[0].name:"контейнер"}</b> элемент`, 'light');
            } else {
                showAlertText(`Удалёны <b>${tempArrayOfIndex.length}</b> элемен${getSuffix(tempArrayOfIndex.length)}`, 'light');
            }
        }
        drawtemplate()
    }
}

async function getPublishVersions() {
    let versions = await getTemplateVersions(environment.value, templateID.value);
    
    if (versions.length) {
        templateVersion.value = versions.find(element => element.status == 'publish').version;
        return true;
    }
    else {
        return false;
    }
}

async function getLatestVersions() {
    let versions = await getTemplateVersions(environment.value, templateID.value);
    
    if (versions.length) {
        latestVersion = Math.max(...versions.map(element => parseInt(element.version)));
        return true;
    }
    else {
        return false;
    }
}

function drawtemplate() {
    while (accordionParent.firstChild) {
        accordionParent.firstChild.remove();
    }
    drawItem(accordionParent, templateLMT.components, true, "components", "0");
}
async function getWidgets() {
    this.innerHTML = "&#8987;";
    if (templateVersion.value == "") {
        if (!await getPublishVersions()) {
            this.innerHTML = "Получить";
            return
        }
    }
    const template = await getLayoutDetail(environment.value, templateID.value, templateVersion.value);
    console.log(template)
    if (template?.components) {
        templateLMT = template;
        drawtemplate();
    }
    this.innerHTML = "Получить";
}

async function saveTemplate() {
    this.innerHTML = "&#8987;";
    if (await getLatestVersions(templateID.value)) {
        newTemplate = {}
        if (templateVersion.value == "") {
            newTemplate.latestVersion = latestVersion
        }
        else {
            newTemplate.latestVersion = templateVersion.value
        }
        newTemplate.layout = templateLMT
        newTemplate.updatedVersionResponse = "warn"
        const result = await saveTemplateToLMT(environment.value, newTemplate);
        if (result?.version) {
            templateVersion.value = result?.version;
            await getWidgets();
            showAlertText(`Шаблон ${templateID.value} с версией ${result?.version} успешно сохранён`, 'light');
        }
    }
    this.innerHTML = "Сохранить";
}

function newConfigToWidget(tempT, indexArray, newConfig){
    if (indexArray.length == 1) {
        if (tempT.components){
            tempT.components[indexArray[0]].config = newConfig;
        }
        
        return tempT;
    }
    
    const firstElement = indexArray.shift();
    if (tempT.components){
        tempT.components[firstElement] = newConfigToWidget(tempT.components[firstElement], indexArray, newConfig);
    }
    else {
        tempT.placeholders[firstElement] = newConfigToWidget(tempT.placeholders[firstElement], indexArray, newConfig);
    }
    
    return tempT;
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
    for (let widget of widgets) {
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

function checkContainerSwitchCase() {
    for (let widget of getClipboardInfo("clipboardWidget")) {
        if (widget?.name == undefined) {
            return true;
        }
    }
    return false;
}

function checkNotContainerSwitchCase() {
    for (let widget of getClipboardInfo("clipboardWidget")) {
        if (widget?.name != undefined) {
            return true;
        }
    }
    return false;
}

async function drawItem(parent, widgets, isComponent, path, index)
{
    let countIndex = 0;
    for (let widget of widgets) {
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
                
            if (event.button == 0) {
                accordionButton.style.border = "4px solid blue";
                if (event.shiftKey) {
                    if (!currentWidgetID.includes(accordionItem.id)) {
                        currentWidgetID.push(accordionItem.id);
                        currentWidget.push(Object.assign({}, widget));
                    }
                } else {
                    currentWidgetID = [accordionItem.id];
                    currentWidget = [Object.assign({}, widget)];
                }
            } else if (event.button == 1) {
                ;
            } else if (event.button == 2) {
                if (!currentWidgetID.includes(accordionItem.id)) {
                    elements = document.getElementsByClassName('accordion-button');
                    for (let j = 0; j < elements.length; j++) {
                        if (elements[j].style.border == "4px solid blue") {
                            elements[j].style.border = "";
                        }
                    }
                    currentWidgetID = [];
                    currentWidget = [];
                }
                accordionButton.style.border = "4px solid blue";
                document.getElementById("copyWidget").classList.remove("disabled");
                cutWidget.classList.remove("disabled");
                deleteWidget.classList.remove("disabled");
                pasteWidgeInto.classList.remove("disabled");
                pasteWidgetUp.classList.remove("disabled");
                pasteWidgetDown.classList.remove("disabled");
                document.getElementById("updateConfig").classList.remove("disabled");
                
                if ((getClipboardInfo("clipboardWidget").length == 0 && getClipboardInfo("clipboardWidgetID").length == 0) || currentWidget.length > 1) {
                    pasteWidgetUp.classList.add("disabled");
                    pasteWidgetDown.classList.add("disabled");
                    document.getElementById("updateConfig").classList.add("disabled");
                } else {
                    pasteWidgetUp.classList.remove("disabled");
                    pasteWidgetDown.classList.remove("disabled");
                }
                
                if (!isComponent || widget?.name == 'switchCase' || (widget?.placeholders?.length == 1 && widget?.placeholders?.[0]?.name == 'default')) {
                    pasteWidgeInto.classList.remove("disabled");
                    if (!isComponent && widget?.name != undefined) {
                        pasteWidgetUp.classList.add("disabled");
                        pasteWidgetDown.classList.add("disabled");
                        document.getElementById("copyWidget").classList.add("disabled");
                        cutWidget.classList.add("disabled");
                        deleteWidget.classList.add("disabled");
                    }
                }
                else {
                    pasteWidgeInto.classList.add("disabled");
                }
                
                if (checkContainerSwitchCase()) {
                    pasteWidgeInto.classList.add("disabled");
                    pasteWidgetUp.classList.add("disabled");
                    pasteWidgetDown.classList.add("disabled");
                    
                    if (widget?.name == 'switchCase') {
                        pasteWidgeInto.classList.remove("disabled");
                    }
                    
                    if (widget?.name == undefined) {
                        pasteWidgetUp.classList.remove("disabled");
                        pasteWidgetDown.classList.remove("disabled");
                    }
                    
                    if (checkNotContainerSwitchCase()) {
                        if (widget?.name == 'switchCase') {
                            pasteWidgeInto.classList.add("disabled");
                        }
                        
                        if (widget?.name == undefined) {
                            pasteWidgetUp.classList.add("disabled");
                            pasteWidgetDown.classList.add("disabled");
                        }
                    }
                }
                else {
                    if (widget?.name == 'switchCase') {
                        pasteWidgeInto.classList.add("disabled");
                    }
                    
                    if (widget?.name == undefined) {
                        pasteWidgetUp.classList.add("disabled");
                        pasteWidgetDown.classList.add("disabled");
                    }
                }
                
                contextMenu.style.left = `${event.pageX}px`;
                contextMenu.style.top = `${event.pageY}px`;
                contextMenu.style.display = 'block';
                if (currentWidget.length < 2) {
                    currentWidget = [Object.assign({}, widget)];
                    currentWidgetID = [accordionItem.id];
                    
                    if (currentWidget[0].config) {
                        const result = await getConfigFromLMT(environment.value, {'name': currentWidget[0].name, 'vertical': currentWidget[0].vertical, 'version': currentWidget[0].version}, currentWidget[0].config, false);
                        if (result) {
                            document.getElementById("updateConfig").classList.add("disabled");
                            //widgetConfig = "";
                        } else {
                            const result2 = await getConfigFromLMT(environment.value, {'name': currentWidget[0].name, 'vertical': currentWidget[0].vertical, 'version': currentWidget[0].version}, currentWidget[0].config, false, false);
                            if (result2) {
                                widgetConfig = result2;
                            } else {
                                document.getElementById("updateConfig").classList.add("disabled");
                                //widgetConfig = "";
                            }
                        }
                    }
                    else {
                        document.getElementById("updateConfig").classList.add("disabled");
                    }
                }
                if (currentWidget.length < 2) {
                    let endOfString = `<b>${currentWidget[0].name?currentWidget[0].name:"контейнер"}</b> элемент`
                    document.getElementById("copyWidget").innerHTML = `Копировать  ${endOfString}`;
                    cutWidget.innerHTML = `Вырезать  ${endOfString}`;
                    if (getClipboardInfo("clipboardWidget").length < 1) {
                        pasteWidgetUp.innerHTML = `Вставить`
                    } if (getClipboardInfo("clipboardWidget").length == 1) {
                        pasteWidgetUp.innerHTML = `Вставить <b>${getClipboardInfo("clipboardWidget")[0].name?getClipboardInfo("clipboardWidget")[0].name:"контейнер"}</b> элемент`
                    } else {
                        pasteWidgetUp.innerHTML = `Вставить <b>${getClipboardInfo("clipboardWidget").length}</b> элемен${getSuffix(getClipboardInfo("clipboardWidget").length)}`
                    }
                    pasteWidgetDown.innerHTML = pasteWidgetUp.innerHTML;
                    pasteWidgeInto.innerHTML = pasteWidgetUp.innerHTML;
                    pasteWidgetUp.innerHTML += ` до ${endOfString}а`;
                    pasteWidgeInto.innerHTML += ` в ${endOfString}`;
                    pasteWidgetDown.innerHTML += ` после ${endOfString}а`;
                    deleteWidget.innerHTML = `Удалить ${endOfString}`;
                } else {
                    let endOfString = `<b>${currentWidget.length}</b> элемен${getSuffix(currentWidget.length)}`
                    document.getElementById("copyWidget").innerHTML = `Копировать ${endOfString}`;
                    cutWidget.innerHTML = `Вырезать ${endOfString}`;
                    pasteWidgetUp.innerHTML = `Вставить до элемента`;
                    pasteWidgeInto.innerHTML = `Вставить в элемент`;
                    pasteWidgetDown.innerHTML = `Вставить после элемента`;
                    deleteWidget.innerHTML = `Удалить ${endOfString}`;
                    
                }
                
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
            addTextToButtonV2(widget, 'label', accordionButtonContent, true)
        }
        
        if (widget.name) {
            if (!widget.label) {
                addTextToButtonV2(widget, 'name', accordionButtonContent, true)
                if (widget?.name == 'condition') {
                    addTextToButtonV2(widget, 'dsTitle', accordionButtonContent, true)
                }
            }
            else {
                if (widget?.name == 'condition') {
                    addTextToButtonV2(widget, 'dsTitle', accordionButtonContent, true)
                }
                addTextToButtonV2(widget, 'name', accordionButtonContent, false)
            }
        }
        if (widget.vertical) {
            addTextToButtonV2(widget, 'vertical', accordionButtonContent, false)
        }
        if (widget.version) {
            addTextToButtonV2(widget, 'version', accordionButtonContent, false)
        }
        
        
        if (widget.id) {
            addTextToButtonV2(widget, 'id', accordionButtonContent, false)
        }
        if (widget.config) {
            addTextToButtonV2(widget, 'config', accordionButtonContent, false)
        }
        if (widget.view) {
            addTextToButtonV2(widget, 'view', accordionButtonContent, false)
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

function getSuffix(arrayLength) {
    let suffix = "т";
    if ((arrayLength >= 11 && arrayLength <= 14) || (arrayLength % 10 >= 5 && arrayLength % 10 <= 9 ) || arrayLength % 10 == 0){
        suffix = "тов"
    }
    else {
        if (arrayLength % 10 >= 2 && arrayLength % 10 <= 4) {
            suffix = "та"
        }
    }
    return suffix
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


