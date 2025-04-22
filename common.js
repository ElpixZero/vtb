let environment = document.getElementById("area");

clipboardButton.addEventListener("click", getConfigFromClipboard);

async function getConfigFromClipboard() {
    authorizationHeader.value = await navigator.clipboard.readText();
    showAlertText(`Токен успешно вставлен в поле ввода "authorization"`, 'light');
}

function swapConfig() {
    [oldConfig.value, newConfig.value] = [newConfig.value, oldConfig.value];
}

async function getVerticalList(environment) {
    const result = await getLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/v1/widget-vertical-list`, false);

    if (!result.error) {
        if (!result.answer?.data?.code) {
            return result.answer.items;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }
    return []
}

async function getWidgetList(environment) {
    const result = await getLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/widget/list/v1`, false);

    if (!result.error) {
        if (!result.answer?.data?.code) {
            return result.answer.widgets;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }
    return []
}

async function getTemplateVersions(environment, templateID) {
    let answer = [];
    const result = await getLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/layout/versions/v1/${templateID}`)

    if (!result.error) {
        if (!result.answer?.data?.code) {
            answer = result.answer.versions;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }
    return answer
}

async function getLayoutDetail(environment, templateID, version) {
    let answer = {};
    const result = await getLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/layout/detail/v1/${templateID}${version ? "?version=" + version : ""}`)
    if (!result.error) {
        if (!result.answer?.data?.code) {
            answer = result.answer.layout;
            showAlertText('Информация по всем партам шаблона получена', 'light')
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }
    return answer
}

async function adminSearchV1(environment, vertical, query, platform, visible, page = 0, isSearch = true) {
    let data = {
        'entityType': 'widget',
        'limit': 100,
        'page': page,
        'searchData': {
            'searchCustom': {
                'visible': visible,
                'vertical': vertical,
                'onlyStable': false
            },
            'searchFilter': {
                'platform': platform,
                'favourite': false
            },
            'searchOrder': {
                'orderBy': 'date',
                'orderDirection': 'DESC'
            },
            'searchQuery': {
                'query': query
            }
        }
    }

    let answer = {};
    const result = await postLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/search/${isSearch ? "" : "csv/"}v1`, data);
    if (!result.error) {
        if (!result.answer?.data?.code) {
            answer = result.answer;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }

    return answer;
}

async function getServiceName(environment, widget, platform) {
    let serviceName = "";
    let data = {
        "limit": 10,
        "searchData": {
            "searchFilter": {
                "platforms": platform
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
    const result = await postLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/v1/widget-search-list`, data)

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

async function getConfigFromLMT(environment, widget, versionConfig, isShowAlert = true, isComboBox = true) {
    const service = await getServiceName(environment, widget, ['mobile', 'desktop'], isComboBox);
    if (!isComboBox) {
        environment = (environment == 'prod' ? 'stg' : 'prod')
    }

    let answer = undefined

    if (service) {
        const result = await getLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/proxy/composer-sdk/v1/config?name=${widget.name}&widgetVersion=${widget.version}&vertical=${widget.vertical}&version=${versionConfig}&serviceName=${service}`, isComboBox);
        if (!result.error) {
            if (!result.answer?.data?.code) {
                return result.answer.config;
                showAlertText('Информация по виджетам получена', 'light')
            }
            else {
                if (isShowAlert) {
                    showAlertText(result.answer?.data?.message, 'danger');
                }
            }
        }
        else {
            if (isShowAlert) {
                showAlertText(result.error, 'danger');
            }
        }
    }

    return answer
}

async function getConditionGet(environment, version) {
    let answer = {};
    const result = await getLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/condition/get/${version}`)

    if (!result.error) {
        if (!result.answer?.data?.code) {
            answer = result.answer.condition;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }
    return answer
}

async function saveTemplateToLMT(environment, data) {
    let answer = {};
    const result = await postLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/admin/layout/save/v1`, data);
    if (!result.error) {
        if (!result.answer?.data?.code) {
            answer = result.answer.layout;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }

    return answer;
}

async function saveConfigToLMT(environment, data) {
    let answer = {};
    const result = await postLayoutApiData(`https://layout-api.${environment}.a.o3.ru:80/proxy/composer-sdk/v1/config`, data);
    if (!result.error) {
        if (!result.answer?.data?.code) {
            answer = result.answer;
        }
        else {
            showAlertText(result.answer?.data?.message, 'danger');
        }
    }
    else {
        showAlertText(result.error, 'danger');
    }

    return answer;
}

async function getLayoutApiData(layoutApiURL, isComboBox = true) {
    let errorText;

    const answer = await fetch(layoutApiURL, {
        method: 'GET',
        headers: {
            'Authorization': `${isComboBox ? authorizationHeader.value : await navigator.clipboard.readText()}`,
            'accept': 'application/json'
        }
    }).then((res) => res.json()).catch(error => {
        errorText = error;
    });

    return { "answer": answer, "error": errorText };
}

async function postLayoutApiData(layoutApiURL, data) {
    let errorText;

    const answer = await fetch(layoutApiURL, {
        method: 'POST',
        headers: {
            'Authorization': `${authorizationHeader.value}`,
            'accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then((res) => res.json()).catch(error => {
        errorText = error;
    });

    return { "answer": answer, "error": errorText };
}

function showAlertText(text, typeMessage) {
    statusBar.removeAttribute("class");
    statusBar.setAttribute("class", `alert alert-${typeMessage}`);
    statusBar.innerText = `${text}`.replace(/[\n\r\t]/g, '');;
    setTimeout(() => {
        statusBar.removeAttribute("class");
        statusBar.setAttribute("class", "alert alert-light");
        statusBar.innerText = '';
    }, 2000);
}

function createHTMLElement(type, attributes) {
    let element = document.createElement(type);
    for (const [key, value] of Object.entries(attributes || {}))
        element.setAttribute(key, value);
    return element
}

function addTextToButtonV2(widget, property, accordionButton, isBold) {
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

function getTextOfParams(widget) {
    let labelCondition = { 'name': '', 'operation': '', 'value': '' };
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
