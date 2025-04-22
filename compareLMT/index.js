compareButton.addEventListener("click", compareWidgets);
swapButton.addEventListener("click", swapConfig);
newLastButton.addEventListener("click", getActualAndLastVersions);

let oldConfig = document.getElementById("valueOld");
let newConfig = document.getElementById("valueNew");
let bodyContainer = document.getElementsByTagName('body')[0];
let templateOld, templateNew;
let numberOfDifferences = [];

async function getActualAndLastVersions() {
    let versions = await getTemplateVersions(environment.value, templateID.value);
    
    if (versions.length) {
        oldConfig.value = versions.find(element => element.status == 'publish').version;
        newConfig.value = Math.max(...versions.map(element => parseInt(element.version)))
        showAlertText('Необходимые версии шаблона получены', 'light');
    }
}
        
async function compareWidgets() {
    const templateOld = await getLayoutDetail(environment.value, templateID.value, oldConfig.value);
    const templateNew = await getLayoutDetail(environment.value, templateID.value, newConfig.value);
          
    if (templateOld?.components || templateNew?.components) {
        while (accordionParent.firstChild) {
            accordionParent.firstChild.remove();
        }
                
        while (accordionParentNew.firstChild) {
            accordionParentNew.firstChild.remove();
        }
                
        numberOfDifferences = [];
                
        let labelOld = document.createElement('div');
        labelOld.innerHTML = `<br><b>${templateOld.title}<br>ID: ${templateOld.id} - Version:  ${templateOld.version}</b>`;
        accordionParent.appendChild(labelOld);
                
        let labelNew = document.createElement('div');
        labelNew.innerHTML = `<br><b>${templateNew.title}<br>ID: ${templateNew.id} - Version:  ${templateNew.version}</b>`;
        accordionParentNew.appendChild(labelNew);
                
        await drawItem(accordionParent, templateOld.components, true, "components", templateNew, 'red');
        await drawItem(accordionParentNew, templateNew.components, true, "components", templateOld, 'blue');
        
        labelOld.innerHTML = `<b>Количество изменений: ${numberOfDifferences.length}</b>` + labelOld.innerHTML;
    }
}

function compareConfigWidgets(config1, config2, name) {
    let newToken = btoa(authorizationHeader.value);
    newToken = newToken.split("").reverse().join("");
    newToken += "==";
    window.open(`../compareAllConfig/index.html?environment=${environment.value}&config1=${config1}&config2=${config2}&name=${name}&token=${newToken}`, "_blank");
}

function compareConditionWidgets(params1, params2, color) {
    document.getElementById("modalBody").textContent = color;
}

function findPath(widgets, objKey, objValue, path) {
    let result = false;

    for (let widget of (widgets ?? [])) {
        if (widget?.[objKey] == objValue) {
            return [path, true];
        }
        if (widget.components || widget.placeholders) {
            if (widget.components) {
                let temp = findPath(widget.components, objKey, objValue, path + '.components');
                if (temp[1]) {
                    path = temp[0];
                    result = temp[1];
                    return [path, true];
                }
            }
            
            if (widget.placeholders) {
                let temp = findPath(widget.placeholders, objKey, objValue, path + '.placeholders');
                if (temp[1]) {
                    path = temp[0];
                    result = temp[1];
                    return [path, true];
                }
            }
        }
        
        if (result) break;
    }
    
    return [path, result];
}

function getNestedObj(obj, key, value) {
  let foundObj;
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[key] === value) {
      foundObj = nestedValue;
    }
    return nestedValue;
  });
  return foundObj;
};

function getPropertyByPath(obj, path) {
    return path.split('.').reduce((accumulator, currentValue) => {
        if (currentValue.includes('[')) {
            const regex = /\[(\d+)\]/g;
            const index = regex.exec(currentValue);

            return accumulator?.[currentValue.split("[")[0]]?.[index[1]];
        }
        else {
            return accumulator?.[currentValue];
        }
        
    },
    JSON.parse(JSON.stringify(obj)));
  }


function getTypeOfCondition(widget) {
    let isSavedCondition = false;
    if (widget.params) {
        for (let param of widget.params) {
            if (param.name == 'useSavedConditions' && param.bool == true) {
                isSavedCondition = true;
                break;
            }
        }
    }

    return isSavedCondition;
}

function getConditionId(widget) {
    let conditionID = 0;
    if (widget.params) {
        for (let param of widget.params) {
            if (param.name == 'conditionId') {
                conditionID = param.int;
                break;
            }
        }
    }

    return conditionID;
}

function addTextToButton(widget, tempWidget, property, tempColor, accordionButton, isBold) {
    let text = widget[property];
    if (property == 'dsTitle') {
        text = getTextOfParams(widget)
        if (text == getTextOfParams(tempWidget))
            tempColor = 'black'
    }
    else {
        if (property == 'view') {
            text = widget?.view?.vertical + '.' + widget?.view?.name + '.' + widget?.view?.version
            if (text == tempWidget?.view?.vertical + '.' + tempWidget?.view?.name + '.' + tempWidget?.view?.version)
                tempColor = 'black'
        }
        else
            if (widget[property] == tempWidget?.[property])
                tempColor = 'black'
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
            accordionButton.innerHTML += `<span class='cutText' style='color: ${tempColor};'>${text}</span><br>`;
        else
            accordionButton.innerHTML += `<b class='cutText' style='color: ${tempColor};'>${text}</b><br>`;
    else
        accordionButton.innerHTML += `<span class='cutText' style='color: ${tempColor};'>${text} </span>`;
}

function getProperties(widget, widget2, color) {
    let colors = {'red': 'yellow', 'blue': 'cyan' }
    let text = '';
    for (let key of Object.keys(widget)) {
        let tempColor = 'white'
        if (key == 'components' || key == 'placeholders')
            continue
        if (key == 'params') {
            text += `<u style='color: white; float:left;'>${key}: </u><br>`
            for (let key2 = 0; key2 < widget[key].length; key2++) {
                text += `<i style='color: white; float:left;'>  ${key2}: </i><br>`
                for (let key3 of Object.keys(widget[key][key2])) {
                    let tempColor = 'white'
                    if (typeof (widget[key][key2][key3]) !== 'object') {
                        if (widget[key][key2][key3] != widget2?.[key]?.[key2]?.[key3])
                            tempColor = color
                        text += `<span style='color: ${colors[tempColor]}; float:left;'>     ${key3}: ${widget[key][key2][key3]}</span><br>`
                    }
                }
            }
        }
        else {
            if (typeof (widget[key]) !== 'object') {
                if (widget[key] != widget2?.[key])
                    tempColor = color
                text += `<span style='color: ${colors[tempColor]}; float:left;'>${key}: ${widget[key]}</span><br>`
            }
            else {
                text += `<u style='color: white; float:left;'>${key}: </u><br>`
                for (let key2 of Object.keys(widget[key])) {
                    let tempColor = 'white'
                    if (typeof (widget[key][key2]) !== 'object') {
                        if (widget[key][key2] != widget2?.[key]?.[key2])
                            tempColor = color
                        text += `<span style='color: ${colors[tempColor]}; float:left;'>   ${key2}: ${widget[key][key2]}</span><br>`
                    }
                }
            }
        }
    }
    return text;
}

async function drawItem(parent, widgets, isComponent, path, anotherObject, color) {
    for (let widget of (widgets ?? [])) {
        let dataBsTarget = "widget" + ((widget.id) ? widget.id : "") + (new Date().valueOf() + Math.floor(Math.random() * 1000000));
        let accordion = document.createElement('div');
        accordion.setAttribute('class', 'accordion');
        parent.appendChild(accordion);
        let accordionItem = document.createElement('div');
        accordionItem.setAttribute('class', 'accordion-item ' + ((isComponent) ? "" : " containerLMT"));
        accordion.appendChild(accordionItem);
        let accordionHeader = document.createElement('h2');
        accordionHeader.setAttribute('class', 'accordion-header');
        accordionItem.appendChild(accordionHeader);
        let accordionButton = document.createElement('button');
        accordionButton.setAttribute('class', 'accordion-button position-relative');
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
        accordionButtonContent.setAttribute('class', 'myTooltip');
        let accordionButtonTooltip = document.createElement('div');
        accordionButtonTooltip.setAttribute('class', 'myTooltiptext');
        
        accordionButton.appendChild(accordionButtonContent);
        accordionButtonTooltip.innerHTML = '';
        accordionButtonContent.innerHTML = '';
        
        let tempWidget = JSON.parse(JSON.stringify(widget));
        delete tempWidget?.['components'];
        delete tempWidget?.['placeholders'];
        tempWidget = JSON.stringify(tempWidget)
        
        let tempColor = 'black';
        let widget2 = {};
        if (JSON.parse(tempWidget)?.['id']) {
            let tempId = JSON.parse(tempWidget)?.['id'];
            let tempAnotherWidget = getNestedObj(anotherObject, 'id', tempId);
            let tempPath = findPath(anotherObject.components, 'id', tempId, 'components')[0];
            
            let tempAnotherWidget2 = {};
            if (tempAnotherWidget)
                tempAnotherWidget2 = JSON.parse(JSON.stringify(tempAnotherWidget))
            
            delete tempAnotherWidget2?.['components'];
            delete tempAnotherWidget2?.['placeholders'];
            tempAnotherWidget2 = JSON.stringify(tempAnotherWidget2)
            widget2 = JSON.parse(tempAnotherWidget2)

            if (!(tempAnotherWidget2 == tempWidget && tempPath == path)) {
                accordionItem.style.borderColor = color;
                if (widget2?.id == JSON.parse(tempWidget).id)
                    accordionItem.style.borderColor = 'orange';
                accordionItem.style.borderWidth = 'medium';
                tempColor = color;
                if (!numberOfDifferences.includes(tempId))
                    numberOfDifferences.push(tempId)
            }
        }
        
        if (!isComponent) {
            if (parent.parentElement.parentElement.firstChild.firstChild.style.color == "red" || parent.parentElement.parentElement.firstChild.firstChild.style.color == "blue" || parent.parentElement.parentElement.firstChild.firstChild.style.color == "orange") {
                accordionItem.style.borderColor = parent.parentElement.parentElement.firstChild.firstChild.style.color;
                accordionItem.style.borderWidth = 'medium';
                tempColor = color;
            }
        }
        
        if (widget.label) {
            addTextToButton(widget, widget2, 'label', tempColor, accordionButtonContent, true)
        }

        if (widget.name) {
            if (!widget.label) {
                addTextToButton(widget, widget2, 'name', tempColor, accordionButtonContent, true)
                if (widget?.name == 'condition') {
                    addTextToButton(widget, widget2, 'dsTitle', tempColor, accordionButtonContent, true)
                }
            }
            else {
                if (widget?.name == 'condition') {
                    addTextToButton(widget, widget2, 'dsTitle', tempColor, accordionButtonContent, true)
                }
                addTextToButton(widget, widget2, 'name', tempColor, accordionButtonContent, false)
            }
        }
        if (widget.vertical) {
            addTextToButton(widget, widget2, 'vertical', tempColor, accordionButtonContent, false)
        }
        if (widget.version) {
            addTextToButton(widget, widget2, 'version', tempColor, accordionButtonContent, false)
        }
        if (widget.id) {
            addTextToButton(widget, widget2, 'id', tempColor, accordionButtonContent, false)
            if (numberOfDifferences.indexOf(widget.id) >= 0) {
                let accordionButtonCounter = document.createElement('span');
                accordionButtonCounter.setAttribute('class', 'badge rounded-pill bg-secondary');
                accordionButtonCounter.textContent = numberOfDifferences.indexOf(widget.id) + 1;
                accordionButton.appendChild(accordionButtonCounter);
            }
        }
        if (widget.config) {
            addTextToButton(widget, widget2, 'config', tempColor, accordionButtonContent, false)
        }
        if (widget.view) {
            addTextToButton(widget, widget2, 'view', tempColor, accordionButtonContent, false)
        }

        if (accordionButtonContent.innerHTML == '' && !isComponent) {
            accordionButtonContent.innerHTML = '<b>Контейнер</b>';
        }

        accordionButton.className += ' cutText';
        accordionHeader.appendChild(accordionButton);
        accordionButtonTooltip.innerHTML = getProperties(widget, widget2, color);
        if (accordionItem.style.borderColor == 'orange' || accordionItem.style.borderColor == 'blue' || accordionItem.style.borderColor == 'red') {
            accordionButtonContent.appendChild(accordionButtonTooltip);
            if (widget.config != widget2.config && widget.config && widget2.config) {
                accordionButton.innerHTML += '<br>'
                let oldPanel = true;
                let tempAccordionButton = accordionButton.parentNode;
                while (tempAccordionButton) {
                    if (tempAccordionButton.id == "accordionParent") {
                        oldPanel = true;
                        break;
                    } else if (tempAccordionButton.id == "accordionParentNew") {
                        oldPanel = false;
                        break;
                    }
                    tempAccordionButton = tempAccordionButton.parentNode;
                }
                let compareButton = document.createElement('button');
                compareButton.setAttribute('class', 'btn btn-primary btn-sm');
                compareButton.setAttribute('style', 'margin-left:auto;');
                compareButton.textContent = 'Сравнить CONFIG';
                compareButton.addEventListener("click", (e) => {compareConfigWidgets((oldPanel ? widget.config : widget2.config), (oldPanel ? widget2.config : widget.config), widget.vertical + '.' + widget.name + '.V' + widget.version, e);});
                accordionButton.appendChild(compareButton);
            }
            
            if (JSON.stringify(widget.params) != JSON.stringify(widget2.params) && getTypeOfCondition(widget)) {
                accordionButton.innerHTML += '<br>'
                let conditionButton = document.createElement('button');
                conditionButton.setAttribute('class', 'badge bg-primary');
                conditionButton.textContent = 'Условие';
                conditionButton.addEventListener("click", (e) => {compareConditionWidgets(widget.params, widget2.params, color, e);});
                accordionButton.appendChild(conditionButton);
                
                const condition = await getConditionGet(environment.value, getConditionId(widget));
              
                if (condition?.subConditions) {
                    let conditionButtonContent = document.createElement('div');
                    conditionButtonContent.setAttribute('class', 'myTooltip');
                    let conditionButtonTooltip = document.createElement('div');
                    conditionButtonTooltip.setAttribute('class', 'myTooltiptext');
                    
                    conditionButton.appendChild(conditionButtonContent);
                    conditionButtonContent.innerHTML = '';
                    let allConditions = {}
                    for (let subCondition of condition.subConditions) {
                        let operation = subCondition.operation;
                        if (subCondition.type == 'semVersion') {
                            switch (subCondition.operation) {
                                case 'semVerGreaterOrEqual': {
                                    operation = ">=";
                                    break;
                                }
                                case 'semVerGreater': {
                                    operation = ">";
                                    break;
                                }
                                case 'semVerLessOrEqual': {
                                    operation = "<=";
                                    break;
                                }
                                case 'semVerLess': {
                                    operation = "<";
                                    break;
                                }
                                case 'semVerEqual': {
                                    operation = "=";
                                    break;
                                }
                            }
                        }
                        if (operation == '==')
                            operation = '=';
                        allConditions[subCondition.id] = `${subCondition.name} ${operation} ${subCondition.value}`
                    }
                    let refCondition = condition.refCondition.split(' ');
                    refCondition = refCondition.map((name) => {
                        if (allConditions[name]) {
                         return `${allConditions[name]}`
                        }
                        switch (name) {
                            case '&&': {
                                name = 'and';
                                break;
                            }
                            case '||': {
                                name = 'or';
                                break;
                            }
                            case '!': {
                                name = 'not';
                                break;
                            }
                        }
                        return name;
                    });
                    conditionButtonTooltip.innerHTML = refCondition.join(' ');
                    conditionButtonContent.appendChild(conditionButtonTooltip);
                    
                }
                else {
                    let conditionButtonContent = document.createElement('div');
                    conditionButtonContent.setAttribute('class', 'myTooltip');
                    let conditionButtonTooltip = document.createElement('div');
                    conditionButtonTooltip.setAttribute('class', 'myTooltiptext');
                    conditionButton.appendChild(conditionButtonContent);
                    conditionButtonContent.innerHTML = '';
                    conditionButtonTooltip.innerHTML = 'Условие не найдено';
                    conditionButtonContent.appendChild(conditionButtonTooltip);
                }
            }
        }
        
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
                await drawItem(accordionBody, widget.components, true, path + `.components`, anotherObject, color);
            }
            
            if (widget.placeholders) {
                await drawItem(accordionBody, widget.placeholders, false, path + `.placeholders`, anotherObject, color);
            }
        } else {
            accordionButton.className += ' dropdown-toggle';
        }
    }
}
