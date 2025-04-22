compareButton.addEventListener("click", compareWidgets);
configClipboardButton.addEventListener("click", getConfigFromClipboard);
swapButton.addEventListener("click", swapConfig);

let oldConfig = document.getElementById("valueOld");
let newConfig = document.getElementById("valueNew");
let bodyContainer = document.getElementsByTagName('body')[0];
let verticalArray = {}

widgetName.addEventListener('click', async (event) => {
    if (Object.keys(verticalArray).length < 1) {
        const tempArray = await getWidgetList(environment.value);
        const optionArray = [];
        for (let item of tempArray) {
            const itemName = item.vertical + '.' + item.name + '.V' + item.version;
            verticalArray[itemName] = {vertical: item.vertical, name: item.name, version: item.version, serviceName: item.serviceName }
            optionArray.push(itemName)
        }
        optionArray.sort();
        
        for (let item of optionArray) {
            let option = createHTMLElement('option', {'value': `${item}`});
            option.innerHTML = item;
            widgetName.appendChild(option)
        }
        
        let params = new URL(document.location.toString()).searchParams;
        if (params?.get("name")) {
            widgetName.value = params.get("name");
        }
    }
});

document.addEventListener('DOMContentLoaded', async() => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
         get: (searchParams, prop) => searchParams.get(prop),
    });

    if (params.environment) {
        environment.value = params.environment;
    }
    if (params.token) {
        let token64;
        token64 = params.token.slice(0, -2);
        token64 = token64.split("").reverse().join("");
        token64 = atob(token64)
        authorizationHeader.value = token64;
    }
    if (params.name) {
        await widgetName.click();
        //widgetName.value = params.name;
    }
    
    if (params.config1) {
        oldConfig.value = params.config1;
    }
    if (params.config2) {
        newConfig.value = params.config2;
    }
}, false);

async function getConfigFromClipboard() {
    const clipboardText = await navigator.clipboard.readText();
    const regex = /\d+-\d+/g;
    const found = clipboardText.match(regex);
    if (found?.length == 2) {
        [oldConfig.value, newConfig.value] = found;
    }
}
        
function createParentDiv() {
    let parentDiv = document.getElementById("compareDiv");
    if (parentDiv != null) {
        parentDiv.remove();
    }
    parentDiv = document.createElement('div');
    parentDiv.className="container-fluid shadow p-3 mb-5 bg-body-tertiary rounded"
    parentDiv.id = "compareDiv";
    parentDiv.innerHTML = "<strong>Результат:</strong><br>"
    bodyContainer.appendChild(parentDiv);
    return parentDiv;
}
        
async function compareWidgets() {
    let nameWidget = verticalArray[document.getElementById('widgetName').value]

    const postOld = await getConfigFromLMT(environment.value, {'name': nameWidget.name, 'vertical': nameWidget.vertical, 'version': nameWidget.version}, oldConfig.value);
    const postNew = await getConfigFromLMT(environment.value, {'name': nameWidget.name, 'vertical': nameWidget.vertical, 'version': nameWidget.version}, newConfig.value);
    console.log(postOld)
    console.log(postNew)
    
    while (accordionParent.firstChild) {
        accordionParent.firstChild.remove();
    }
    accordionParent.appendChild(drawResult(JSON.parse(postOld), JSON.parse(postNew), "Старый Config", "Новый Config"));
}

function drawResult(postOld, postNew, nameOld, nameNew) {
    let differs = document.createElement('div');
    differs.classList.add("indent");
    differs.innerHTML = "";
    if (postOld instanceof Object || postNew instanceof Object) {
        if (postOld instanceof Array || postNew instanceof Array) {
            if (JSON.stringify(postOld) != JSON.stringify(postNew) || !showChanges.checked) {
                if (nameOld == nameNew) {
                    if (nameOld) {
                        differs.innerHTML += `<span style='color:black;'><b>${nameOld}: </b></span><br>`
                    }
                } else {
                    if (nameOld) {
                        differs.innerHTML += `<span style='color:green;'><b>${nameOld}, </b></span><span style='color:red;'><b>${nameNew}: </b></span><br>`
                    }
                }
            }
            if (postOld?.length == postNew?.length) {
                for (let i = 0; i < postOld?.length; i++) {
                    if (JSON.stringify(postOld[i]) != JSON.stringify(postNew[i]) || !showChanges.checked) {
                        differs.innerHTML += `<span style='color:black;'><b>${i + 1}: </b></span><br>`
                    }
                    differs.appendChild(drawResult(postOld[i], postNew[i]));
                }
            } else if (postOld?.length && postNew?.length) {
                for (let i = 0; i < Math.min(postOld.length, postNew.length); i++) {
                    if (JSON.stringify(postOld[i]) != JSON.stringify(postNew[i]) || !showChanges.checked) {
                        differs.innerHTML += `<span style='color:black;'><b>${i + 1}: </b></span><br>`
                    }
                    differs.appendChild(drawResult(postOld[i], postNew[i], "", ""));
                }
                if (postOld.length > postNew.length) {
                    for (let i = Math.min(postOld.length, postNew.length); i < postOld.length; i++) {
                        if (JSON.stringify(postOld[i]) != JSON.stringify(postNew[i]) || !showChanges.checked) {
                            differs.innerHTML += `<span style='color:black;'><b>${i + 1}: </b></span><br>`
                        }
                        differs.appendChild(drawResult(postOld[i], undefined, "", ""));
                    }
                } else {
                    for (let i = Math.min(postOld.length, postNew.length); i < postNew.length; i++) {
                        if (JSON.stringify(postOld[i]) != JSON.stringify(postNew[i]) || !showChanges.checked) {
                            differs.innerHTML += `<span style='color:black;'><b>${i + 1}: </b></span><br>`
                        }
                        differs.appendChild(drawResult(undefined, postNew[i], "", ""));
                    }
                }
            } else if (postOld?.length) {
                for (let i = 0; i < postOld.length; i++) {
                    if (!showChanges.checked) {
                        differs.innerHTML += `<span style='color:black;'><b>${i + 1}: </b></span><br>`
                    }
                    differs.appendChild(drawResult(postOld[i], undefined, "", ""));
                }
            } else if (postNew?.length) {
                for (let i = 0; i < postNew.length; i++) {
                    if (!showChanges.checked) {
                        differs.innerHTML += `<span style='color:black;'><b>${i + 1}: </b></span><br>`
                    }
                    differs.appendChild(drawResult(undefined, postNew[i], "", ""));
                }
            }
        } else {
            if (JSON.stringify(postOld) != JSON.stringify(postNew) || !showChanges.checked) {
                if (nameOld == nameNew) {
                    if (nameOld) {
                        differs.innerHTML += `<span style='color:black;'><b>${nameOld}: </b></span><br>`
                    }
                } else {
                    if (nameOld) {
                        differs.innerHTML += `<span style='color:green;'><b>${nameOld}, </b></span><span style='color:red;'><b>${nameNew}: </b></span><br>`
                    }
                }
            }
            for (let key of new Set(Object.keys(postOld || {}).concat(Object.keys(postNew || {})))) {
                if (key in (postOld || {}) && key in (postNew || {})) {
                    differs.appendChild(drawResult(postOld[key], postNew[key], key, key));
                } else {
                    if (key in (postOld || {})) {
                        differs.appendChild(drawResult(postOld[key], undefined, key, ""));
                    } else if (key in (postNew || {})) {
                        differs.appendChild(drawResult(undefined, postNew[key], "", key));
                    }
                    
                }
                
            }
        }
    } else {
        if (postOld != undefined && postNew != undefined) {
            if (nameOld == nameNew && postOld == postNew) {
                if (!showChanges.checked) {
                    differs.innerHTML += `<span style='color:black;'><b>${nameOld}: </b> ${postOld}</span><br>`
                }
            } else {
                if (nameOld == nameNew) {
                    differs.innerHTML += `<span style='color:black;'><b>${nameOld}: </b></span><span style='color:green;'>${postOld}</span> - <span style='color:red;'>${postNew}</span><br>`
                } else {
                    differs.innerHTML += `<span style='color:green;'><b>${nameOld}: </b> ${postOld}</span> - <span style='color:red;'><b>${nameNew}: </b> ${postNew}</span><br>`
                }
            }
        } else {
            if (postOld != undefined) {
                differs.innerHTML += `<span style='color:green;'><b>${nameOld}: </b> ${postOld}</span><br>`
            } else if (postNew != undefined) {
                differs.innerHTML += `<span style='color:red;'><b>${nameNew}: </b> ${postNew}</span><br>`
            }
        }
    }
    return differs
}
