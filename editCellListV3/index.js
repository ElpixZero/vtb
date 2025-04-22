let templateLMT = {};
let latestVersion = 0;
let currentWidget = []
let currentConfig = "";
let currentCell = -1;
let currentCells = [];
let currentWidgetID = ""

getInfoButton.addEventListener("click", getWidgets);
saveInfoButton.addEventListener("click", saveTemplate);

templateID.addEventListener("change", () => {templateVersion.value = "";});
environment.addEventListener("change", () => {templateVersion.value = "";});

document.addEventListener("contextmenu", function (e){
    e.preventDefault();
}, false);

document.addEventListener('click', function(event){
    contextMenu.style.display = 'none';
});

document.getElementById("copyWidget").addEventListener("click", function() { copyWidget(); });
pasteWidgetUp.addEventListener("click", function() { pasteWidget(0); });
pasteWidgetDown.addEventListener("click", function() { pasteWidget(1); });
deleteWidget.addEventListener("click", function() { pasteWidget(-1); });

function checkCells() {
    if (JSON.stringify(JSON.parse(currentConfig).cells) != JSON.stringify(currentCells)) {
        saveButton.disabled = false;
        cancelButton.disabled = false;
    }
}

async function copyWidget() {
    if (currentCell != - 1) {
        let tempObj = {};
        
        tempObj.cell = currentCells[currentCell];
        localStorage.setItem('clipboardLMTCells', JSON.stringify(tempObj));
        
        showAlertText(`Скопирована ячейка с номером ${currentCell + 1}`, 'light');
        currentCell = -1;
        checkCells();
    }
}

async function pasteWidget(mode) {
    if (currentCell != - 1) {
        if (mode == -1) {
            currentCells.splice(currentCell, 1)
            showAlertText(`Удалена ячейка под номером ${currentCell + 1}`, 'light');
        } else {
            let returnValue = localStorage.getItem('clipboardLMTCells') ?? "";
            if (returnValue) {
                currentCells.splice(currentCell + mode, 0, JSON.parse(returnValue).cell)
                showAlertText(`Добавлена ячейка под номером ${currentCell + mode + 1}`, 'light');
            }
        }
        
        document.getElementById("editPanel").innerHTML = "";
        document.getElementById("editPanel").classList.add("edit-panel");
        currentCell = -1;
        drawCells(currentCells)
        checkCells();
    }
}

async function updateConfig() {
    let newConfig = {}
    newConfig.name = currentWidget.name;
    newConfig.widgetVersion = currentWidget.version;
    newConfig.vertical = currentWidget.vertical;
    newConfig.version = currentWidget.config;
    newConfig.serviceName = (await getServiceName(environment.value, currentWidget, [templateLMT.platform]));
    let tempConfig = JSON.parse(currentConfig);
    tempConfig.cells = currentCells
    newConfig.config = JSON.stringify(tempConfig);

    const result = await saveConfigToLMT(environment.value, newConfig);
    if (result?.version) {
        showAlertText(`Конфиг с версией ${result?.version} успешно сохранён`, 'light');
        let indexArray = currentWidgetID.split('-');
        indexArray.shift();
        templateLMT = newConfigToWidget(templateLMT, indexArray, result?.version)
        saveButton.disabled = true;
        cancelButton.disabled = true;
        drawtemplate();
    }
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

async function drawCells(cells) {
    let buttonsPanel = document.createElement('div');
    buttonsPanel.setAttribute('class', 'edit-panel');
    document.getElementById("editPanel").appendChild(buttonsPanel);
    let saveButton = document.createElement('button');
    saveButton.setAttribute('class', 'btn btn-primary');
    saveButton.textContent = 'Сохранить';
    saveButton.style.margin = '0 0 1em 1em';
    saveButton.disabled = true;
    saveButton.id = "saveButton";
    saveButton.addEventListener("click", () => {
        updateConfig();
    });
    
    buttonsPanel.appendChild(saveButton);
    let cancelButton = document.createElement('button');
    cancelButton.setAttribute('class', 'btn btn-primary');
    cancelButton.textContent = 'Сбросить';
    cancelButton.style.float = 'right';
    cancelButton.style.margin = '0 1em 1em 0';
    cancelButton.disabled = true;
    cancelButton.id = "cancelButton";
    cancelButton.addEventListener("click", () => {
        currentCells = JSON.parse(currentConfig).cells;
        document.getElementById("editPanel").innerHTML = "";
        document.getElementById("editPanel").classList.add("edit-panel");
        drawCells(currentCells)
    });
    buttonsPanel.appendChild(cancelButton);
    
    let accordion = document.createElement('div');
    accordion.setAttribute('class', 'accordion');
    document.getElementById("editPanel").appendChild(accordion);
    
    for (let [ind, cell] of cells.entries()) {
        let dataBsTarget = "cell" + (ind) + (new Date().valueOf() + Math.floor(Math.random() * 1000000));
        let accordionItem = document.createElement('div');
        let accordionButton = document.createElement('button');
        accordionItem.setAttribute('class', 'accordion-item');
        accordionItem.setAttribute('id', "cell" + '-' + ind);
        accordionItem.addEventListener("mousedown", async (event) => {
            if (event.button == 2) {
                contextMenu.style.display = 'block';
                contextMenu.style.left = window.innerWidth < event.pageX + contextMenu.offsetWidth + 10? `${window.innerWidth - contextMenu.offsetWidth - 10}px`: `${event.pageX}px`;
                contextMenu.style.top = `${event.pageY}px`;
                currentCell = ind;
                
                let returnValue = localStorage.getItem('clipboardLMTCells') ?? "";
                if (returnValue) {
                    pasteWidgetUp.classList.remove("disabled");
                    pasteWidgetDown.classList.remove("disabled");
                } else {
                    pasteWidgetUp.classList.add("disabled");
                    pasteWidgetDown.classList.add("disabled");
                }
            }
        });
        accordion.appendChild(accordionItem);
        
        let accordionHeader = document.createElement('h2');
        accordionHeader.setAttribute('class', 'accordion-header');
        accordionItem.appendChild(accordionHeader);
        accordionButton.setAttribute('class', 'accordion-button position-relative dropdown-toggle');

        accordionButton.setAttribute('type', 'button');
        accordionButton.setAttribute('data-bs-toggle', 'collapse');
        accordionButton.setAttribute('data-bs-target', '#' + dataBsTarget);
        accordionButton.setAttribute('aria-expanded', 'true');
        accordionButton.setAttribute('aria-controls', dataBsTarget);
        
        let accordionButtonContent = document.createElement('div');
        accordionButton.appendChild(accordionButtonContent);
        let image = document.createElement('img');
        image.style.height = '48px';
        image.style.float = 'left';
        image.style.marginRight = "10px";
        image.src = cell?.leftBlock?.image?.image ?? "https://ir-2.ozone.ru/s3/cms/bd/t23/image.png";
        accordionButtonContent.appendChild(image);
        let accordionButtonContentContent = document.createElement('div');
        accordionButtonContentContent.setAttribute('class', 'row');
        accordionButtonContentContent.style.padding = "3px 0";
        let title = document.createElement('input');
        title.setAttribute('class', 'form-control cell-input');
        title.value = cell?.centerBlock?.title?.text ?? ""
        title.addEventListener("change", () => {
            cell.centerBlock.title.text = title.value;
            checkCells();
        });
        accordionButtonContentContent.appendChild(title);
        accordionButtonContentContent.appendChild(document.createElement('br'));
        let subTitle = document.createElement('input');
        subTitle.setAttribute('class', 'form-control cell-input');
        subTitle.value = cell?.centerBlock?.subtitle?.text ?? ""
        subTitle.addEventListener("change", () => {
            cell.centerBlock.subtitle.text = subTitle.value;
            checkCells();
        });
        accordionButtonContentContent.appendChild(subTitle);
        accordionButtonContent.appendChild(accordionButtonContentContent)
        accordionHeader.appendChild(accordionButton);
    }
}

async function drawItem(parent, widgets, isComponent, path, index)
{
    let countIndex = 0;
    for (let [ind, widget] of widgets.entries()) {
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
            if (document.getElementById("saveButton")?.disabled == false) return;
            document.getElementById("editPanel").innerHTML = "";
            document.getElementById("editPanel").classList.add("edit-panel");
            if (widget.name.toLowerCase() == "celllist" && widget.version.toLowerCase() == "3" && widget.config) {
                currentWidget = widget;
                const result = await getConfigFromLMT(environment.value, {'name': currentWidget.name, 'vertical': currentWidget.vertical, 'version': currentWidget.version}, currentWidget.config, false);
                currentCell = -1;
                currentCells = [];
                if (result) {
                    currentConfig = result
                    currentCells = JSON.parse(currentConfig).cells
                    currentWidgetID = accordionItem.id;
                    await drawCells(currentCells)
                    window.scrollTo(0,0);
                } else {
                    currentConfig = "";
                    currentWidget = undefined;
                }
            } else {
                currentWidget = undefined;
                currentConfig = ""
                currentCell = -1;
                currentCells = [];
                document.getElementById("editPanel").classList.remove("edit-panel");
            }
            if (event.button == 0) {
                [...document.getElementsByClassName('accordion-button')].forEach((e) => {
                    if (e.style.border == "4px solid blue") {
                        e.style.border = "";
                    }
                });
                accordionButton.style.border = "4px solid blue";
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
