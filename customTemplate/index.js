getInfoButton.addEventListener("click", getWidgets);
getLastButton.addEventListener("click", getLastVersion);
getPublishedButton.addEventListener("click", getPublishedVersion);
getFullButton.addEventListener("click", getQueryParams);
templateID.addEventListener("change", () => {templateVersion.value = "";});
showAll.addEventListener("change", getWidgets);

let lmtParts = [];
let lmtPartsID = {};
let partsInfoArray = [];

async function getLastVersion() {
    this.innerText = "\u231B";
    let versions = await getVersions(templateID.value, 'Последняя версия шаблона получена');
    
    if (versions?.lastVersion) {
        templateVersion.value = versions.lastVersion;
    }
    this.innerText = "\u21bb \u{1F3C1}";
}

async function getPublishedVersion() {
    this.innerText = "\u231B";
    let versions = await getVersions(templateID.value, 'Опубликованная версия шаблона получена');
    
    if (versions?.publishedVersion) {
        templateVersion.value = versions.publishedVersion;
    }
    this.innerText = "\u21bb \u2713";
}

async function getVersions(value, text) {
    let versions = await getTemplateVersions(environment.value, value);
    
    if (versions.length) {
        let publishedVersion = versions.find(element => element.status == 'publish').version;
        let lastVersion = Math.max(...versions.map(element => parseInt(element.version)))
        
        if (text) {
            showAlertText(text, 'light');
        }
        return {"publishedVersion": publishedVersion, "lastVersion": lastVersion}
    }
    else {
        return {}
    }
}
   
async function getWidgets() {
    const templateInfo = await getLayoutDetail(environment.value, templateID.value, templateVersion.value);
          
    if (templateInfo?.components) {
        getInfoButton.innerText = "\u231B";
        lmtParts = [];
        lmtPartsID = {};
        partsInfoArray = [];
        
        while (document.getElementsByTagName('tbody')[0].children.length) {
            document.getElementsByTagName('tbody')[0].children[0].remove();
        }
        
        findParts(templateInfo.components);
        partsTable.parentNode.classList.add("scroll-div");
        emptyState.style.display='none';
        for (let part of new Set(lmtParts)) {
            let versions = await getVersions(part, "");
            if (versions) {
                let publishedVersion = versions.publishedVersion;
                let lastVersion = versions.lastVersion;
                let partInfo = await getLayoutDetail(environment.value, part, lastVersion);
                if (partInfo?.title) {
                    let partVersion = (publishedVersion != lastVersion) ? lastVersion : "";
                    if (showAll.checked || partVersion) {
                        drawNewRow(part, lastVersion, publishedVersion != lastVersion, partInfo.title)
                        partsInfoArray.push({"id": part, "version": partVersion})
                    }
                }
            }
        }

        if (partsInfoArray.length == 0) {
            partsTable.parentNode.classList.remove("scroll-div");
            emptyState.style.display='block';
            if (lmtParts.length == 0) {
                textEmptyState.innerText = "Шаблон не содержит парты";
            }
            else {
                textEmptyState.innerText = "Парты, содержащие изменения, отсутсвуют в шаблоне";
            }
        }
            
        getInfoButton.innerText = "Получить";
    }
}

function findParts(widgets) {
    for (let widget of widgets) {
        if (widget?.name == 'layoutPartMobile' || widget?.name == 'layoutPartDesktop') {
            if (!(widget.params[0].int in lmtPartsID)) {
                lmtPartsID[widget.params[0].int] = []
            }
            lmtPartsID[widget.params[0].int].push({"label": widget.label, "id": widget.id});
            lmtParts.push(widget.params[0].int);
        }
        
        if (widget.components) {
            findParts(widget.components);
        }
        
        if (widget.placeholders) {
            findParts(widget.placeholders);
        }
    }
}

function drawNewRow(idStr, versionStr, state, title) {
    let body = document.getElementsByTagName("tbody")[0];
    let row = body.insertRow();
    
    let inputVersion = createHTMLElement('input', {'type': 'text', 'class': 'form-control'})
    inputVersion.title = title;
    inputVersion.value = versionStr;
    
    let checkPart = createHTMLElement('input', {'type': 'checkbox', 'class': 'form-check-input', ...(state) && {'checked': true}})
    checkPart.addEventListener("change", function() {
        if (checkPart.checked)
            partsInfoArray[row.rowIndex - 1].version = inputVersion.value
        else
            partsInfoArray[row.rowIndex - 1].version = ""
    });
    row.insertCell().appendChild(checkPart);
    
    let inputID = createHTMLElement('label', {'class': 'form-check-label'});
    inputID.title = title;
    inputID.innerText = idStr;
    row.insertCell().appendChild(inputID);
    
    inputVersion.addEventListener("change", function() {
        if (checkPart.checked)
            partsInfoArray[row.rowIndex - 1].version = this.value
    });
    row.insertCell().appendChild(inputVersion);
    
    let selectID = createHTMLElement('select', {'class': 'form-select', 'size': '1'});
    for (let info of lmtPartsID[idStr]) {
        let option = createHTMLElement('option')
        option.value = `${info.id}`;
        option.innerText = `${info.id} - ${info.label == undefined ? "без названия" : info.label}`;
        selectID.appendChild(option);
    }
    selectID.addEventListener("click", function(e) {
        navigator.clipboard.writeText(this.value);
    });
    selectID.addEventListener("change", function() {
        navigator.clipboard.writeText(this.value);
    });
    row.insertCell().appendChild(selectID);
    
    let td = row.insertCell();
    let button = createHTMLElement('button', {'class': 'btn btn-primary'});
    button.innerText = "\u21bb";
    button.addEventListener("click", async () => {
        let versions = await getVersions(idStr, 'Последняя версия парта получена');
        if (versions) {
            inputVersion.value = versions.lastVersion;
            if (checkPart.checked)
                partsInfoArray[row.rowIndex - 1].version = inputVersion.value;
        }
    });
    td.appendChild(button)
}

function getLayoutCustom(){
    let result = {};
    for (const part of partsInfoArray){
        if (part.id && part.version)
            result[part.id] = part.version;
    }
    return result
}

function getQueryParams() {
    let layoutId = templateID.value;
    let layoutVersion = templateVersion.value;
    let layoutCustom = btoa(JSON.stringify(getLayoutCustom()))
    const queryParams = ["layoutId=", "layoutVersion=", "layoutCustom="]
    let fullList = [layoutId, layoutVersion, layoutCustom].map((value, index) => {
      if (value != "") {
        return queryParams[index] + value
      }
    });
    navigator.clipboard.writeText("?" + fullList.filter(Boolean).join("&"));
    showAlertText('Значение скопировано в буфер', 'light')
}
