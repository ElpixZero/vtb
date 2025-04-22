compareButton.addEventListener("click", compareWidgets);
configClipboardButton.addEventListener("click", getConfigFromClipboard);
swapButton.addEventListener("click", swapConfig);
navigationBlocksWidget.addEventListener("change", (e)=>{changeWidget(e);});
menuWidget.addEventListener("change", (e)=>{changeWidget(e);});
sectionMenuWidget.addEventListener("change", (e)=>{changeWidget(e);});
sectionMenu2Widget.addEventListener("change", (e)=>{changeWidget(e);});
megadrawProgressWidget.addEventListener("change", (e)=>{changeWidget(e);});
naviBlocksWidget.addEventListener("change", (e)=>{changeWidget(e);});
cellList3Widget.addEventListener("change", (e)=>{changeWidget(e);});

let oldConfig = document.getElementById("valueOld");
let newConfig = document.getElementById("valueNew");
let bodyContainer = document.getElementsByTagName('body')[0];

document.addEventListener('DOMContentLoaded', async() => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
         get: (searchParams, prop) => searchParams.get(prop),
    });

    if (params.environment) {
        environment.value = params.environment;
    }
    if (params.name) {
        switch (params.name) {
            case "myProfile.navigationBlocks.2":
                navigationBlocksWidget.checked = true;
                break;
            case "myProfile.menu.2":
                menuWidget.checked = true;
                break;
            case "myProfile.sectionMenu.1":
                sectionMenuWidget.checked = true;
                break;
            case "myProfile.sectionMenu.2":
                sectionMenu2Widget.checked = true;
                break;
            case "myProfile.megadrawProgress.1":
                megadrawProgressWidget.checked = true;
                break;
            case "myProfile.naviBlocks.1":
                naviBlocksWidget.checked = true;
                break;
            case "favorites.menu.1":
                menuFavWidget.checked = true;
                break;
            case "cms.cellList.3":
                cellList3Widget.checked = true;
                break;
        }
    }
    
    if (params.config1) {
        oldConfig.value = params.config1;
    }
    if (params.config2) {
        newConfig.value = params.config2;
    }
    if (params.token) {
        let token64;
        token64 = params.token.slice(0, -2);
        token64 = token64.split("").reverse().join("");
        token64 = atob(token64)
        authorizationHeader.value = token64;
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
        
function changeWidget(src) {
    switch (src.target.id) {
        case "navigationBlocksWidget":
            [oldConfig.value, newConfig.value] = ["30-12", "30-13"];
            break;
        case "menuWidget":
            [oldConfig.value, newConfig.value]  = ["16-10", "17-7"];
            break;
        case "sectionMenuWidget":
            [oldConfig.value, newConfig.value]  = ["13-7", "13-11"];
            break;
        case "sectionMenu2Widget":
            [oldConfig.value, newConfig.value]  = ["129-2", "129-3"];
            break;
        case "megadrawProgressWidget":
            [oldConfig.value, newConfig.value]  = ["216-1", "217-1"];
            break;
        case "naviBlocksWidget":
            [oldConfig.value, newConfig.value]  = ["128-60", "128-70"];
            break;
        case "menuFavWidget":
            [oldConfig.value, newConfig.value]  = ["62-11", "62-14"];
            break;
        case "cellList3Widget":
            [oldConfig.value, newConfig.value]  = ["116067-15", "116067-17"];
            break;
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
    let currentWidget = Array.from(document.getElementsByName('radioGroup')).find((radio) => radio.checked).id;
    let nameWidget = Array.from(document.getElementsByName('radioGroup')).find((radio) => radio.checked).nextElementSibling.innerHTML;

    const postOld = await getConfigFromLMT(environment.value, {'name': nameWidget.split('.')[1], 'vertical': nameWidget.split('.')[0], 'version': nameWidget.split('.')[2].replace('v', '')}, oldConfig.value);
    const postNew = await getConfigFromLMT(environment.value, {'name': nameWidget.split('.')[1], 'vertical': nameWidget.split('.')[0], 'version': nameWidget.split('.')[2].replace('v', '')}, newConfig.value);
    console.log(postOld)
    console.log(postNew)
          
    if (postOld && postNew) {
        switch (currentWidget) {
            case "navigationBlocksWidget":
                drawNavigationBlocksWidget(JSON.parse(postOld).section.items, JSON.parse(postNew).section.items);
                break;
            case "menuWidget":
                drawMenuWidget(JSON.parse(postOld).myMenu, JSON.parse(postNew).myMenu, true, "items");
                break;
            case "sectionMenuWidget":
                drawMenuWidget(JSON.parse(postOld).items, JSON.parse(postNew).items, false);
                break;
            case "sectionMenu2Widget":
                drawMenuWidget(JSON.parse(postOld).items, JSON.parse(postNew).items, false);
                break;
            case "megadrawProgressWidget":
                drawMenuWidget(JSON.parse(postOld), JSON.parse(postNew), false);
                break;
            case "naviBlocksWidget":
                drawMenuWidget(JSON.parse(postOld), JSON.parse(postNew), false, "frames");
                break;
            case "menuFavWidget":
                drawMenuWidget(JSON.parse(postOld).items, JSON.parse(postNew).items, false);
                break;
            case "cellList3Widget":
                drawCellList3Widget(JSON.parse(postOld), JSON.parse(postNew));
                break;
        }
    }
}
        

        function drawMenuWidget(sectionsOld, sectionsNew, isSubList, extraItems) {
            let maxSize = Math.max(sectionsOld.length, sectionsNew.length);
            let parentDiv = createParentDiv();
            
            let ulItem = document.createElement('ul');
            ulItem.className="list-group";
            if (!maxSize) {
                let liItem = document.createElement('li');
                liItem.className="list-group-item list-group-item-info rounded-top-right-20 rounded-bottom-20";
                for (const [key, value] of Object.entries(sectionsOld)) {
                    if (key == extraItems)
                        continue;
                    if (value != sectionsNew[key]) {
                        liItem.innerHTML += `<span style='color: black;'><b>${key}:</b></span><br>`;
                        liItem.innerHTML += `<span style='color: red;'>${value}</span> &nbsp; - &nbsp; <span style='color: green;'> ${sectionsNew[key]}</span><br>`;
                    }
                }
                if (liItem.innerHTML != "")
                    ulItem.appendChild(liItem);
                sectionsOld = sectionsOld[extraItems]
                sectionsNew = sectionsNew[extraItems]
                if (extraItems)
                    maxSize = Math.max(sectionsOld.length, sectionsNew.length);
            }
            for (let i = 0; i < maxSize; i++) {
                let liItem = document.createElement('li');
                liItem.className="list-group-item list-group-item-info rounded-top-right-20 rounded-bottom-20";
                if (JSON.stringify(sectionsOld[i])===JSON.stringify(sectionsNew[i])) {
                    if (showChanges.checked) {
                        continue;
                    }
                    drawSimpleSection(liItem, sectionsOld[i], "black", i + 1, isSubList ? true : false);
                } else {
                    if (sectionsOld[i] == undefined || sectionsNew[i] == undefined) {
                            if (sectionsOld[i] == undefined) {
                                drawSimpleSection(liItem, sectionsNew[i], "green", i + 1, isSubList ? true : false);
                            }
                            else {
                                drawSimpleSection(liItem, sectionsOld[i], "red", i + 1, isSubList ? true : false);
                            }
                        }
                        else {
                            if (sectionsOld[i].title == sectionsNew[i].title) {
                                if (sectionsOld[i].isActive == sectionsNew[i].isActive) {
                                    drawSimpleSection(liItem, sectionsOld[i], "black", i + 1, false);
                                }
                                else {
                                    drawSimpleSection(liItem, sectionsOld[i], "black", i + 1, false, sectionsNew[i], "black");
                                }
                            } else {
                                drawSimpleSection(liItem, sectionsOld[i], "red", i + 1, false, sectionsNew[i], "green");
                            }
                            
                            
                            if (!(sectionsOld[i].title == sectionsNew[i].title &&
                                  sectionsOld[i].id == sectionsNew[i].id &&
                                  sectionsOld[i].isActive == sectionsNew[i].isActive &&
                                  sectionsOld[i].conditionId == sectionsNew[i].conditionId)) {
                                let div = document.createElement('div');
                                Object.getOwnPropertyNames(sectionsOld[i]).forEach((val, idx, array) => {
                                    if (val != "items") {
                                        if (sectionsOld[i][val] == sectionsNew[i][val]) {
                                            if (!showChanges.checked) {
                                                div.innerHTML += `<span style='color: black;'>${val}: ${sectionsOld[i][val]}</span><br>`;
                                            }
                                        }
                                        else {
                                            div.innerHTML += `<span style='color: black;'><b>${val}:</b></span><br>`;
                                            div.innerHTML += `<span style='color: red;'> ${sectionsOld[i][val]}</span> &nbsp; - &nbsp; <span style='color: green;'> ${sectionsNew[i][val]}</span><br>`;
                                        }
                                    }
                                });
                                div.className = 'boxed';
                                liItem.insertBefore(div, liItem.querySelector("br").nextSibling);
                            }
                            else {
                                let div = document.createElement('div');
                                for (const [key, value] of Object.entries(sectionsOld[i])) {
                                    if (key == "title" || key == extraItems)
                                        continue;
                                    
                                    if (value != sectionsNew[i][key]) {
                                        div.innerHTML += `<span style='color: black;'><b>${key}:</b></span><br>`;
                                        div.innerHTML += `<span style='color: red;'>${value}</span> &nbsp; - &nbsp; <span style='color: green;'> ${sectionsNew[i][key]}</span><br>`;
                                    }
                                }
                                div.className = 'boxed';
                                if (div.innerHTML != "")
                                    liItem.insertBefore(div, liItem.querySelector("br").nextSibling);
                            }
                            if (isSubList) {
                                drawComplexSection(liItem, sectionsOld[i], sectionsNew[i]);
                            }
                        }
                        
                }
                
                ulItem.appendChild(liItem);
            }
            parentDiv.appendChild(ulItem);
            
            function drawComplexSection(listItem, sectionOld, sectionNew) {
                const maxSizeOfItems = Math.max(sectionOld.items.length, sectionNew.items.length);
                
                let ulSubItem = document.createElement('ul');
                ulItem.className="list-group";
                
                for (let j = 0; j < maxSizeOfItems; j++) {
                    let liSubItem = document.createElement('li');
                    liSubItem.className = "list-group-item rounded-top-right-20 rounded-bottom-20";
                    if (j%2 != 0) {
                        liSubItem.className += " list-group-item-warning";
                    }
                    else {
                        liSubItem.className += " list-group-item-primary";
                    }
                    
                    if (JSON.stringify(sectionOld.items[j])===JSON.stringify(sectionNew.items[j])) {
                        liSubItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${j + 1}</span><span style='color: black; font-weight: bold;'> ${sectionOld.items[j].name}</span></li>`;
                        if (showChanges.checked) continue;
                    }
                    else {
                        if (sectionOld.items[j] == undefined || sectionNew.items[j] == undefined) {
                            if (sectionOld.items[j] == undefined) {
                                liSubItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${j + 1}</span><span style='color: green; font-weight: bold;'> ${sectionNew.items[j].name}</span></li>`;
                            }
                            else {
                                liSubItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${j + 1}</span><span style='color: red; font-weight: bold;'> ${sectionOld.items[j].name}</span></li>`;
                            }
                        }
                        else {
                            if (sectionOld.items[j].name == sectionNew.items[j].name &&
                                sectionOld.items[j].isActive == sectionNew.items[j].isActive) {
                                liSubItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${j + 1}</span><span style='color: black; font-weight: bold;'> ${sectionOld.items[j].name}</span><br></li>`;
                            }
                            else {
                                liSubItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${(j + 1)}</span><span style='color: ${selectColorOrDisabled(sectionOld.items[j].isActive, "red")};  font-weight: bold;'> ${sectionOld.items[j].name}</span><span style='color: ${selectColorOrDisabled(sectionNew.items[j].isActive, "green")}; font-weight: bold;'> ${sectionNew.items[j].name}</span><br></li>`;
                            }
                            
                            liSubItem.appendChild(drawDataRect(sectionOld.items[j], sectionNew.items[j]) );
                        }
                                
                    }
                    ulSubItem.appendChild(liSubItem);
                }

                listItem.appendChild(ulSubItem);
            }
        }
        
        const disabledColors = {"black": "lightgray", "red": "lightcoral", "green" : "mediumseagreen"};
        function selectColorOrDisabled(condition, color) {
            return (condition ? color : disabledColors[color]);
        }
        
        function drawSimpleSubList(section, color) {
            let ulSubItem = document.createElement('ul');
            ulSubItem.className="list-group";
            section.items.forEach((item, index) => {
                let liSubItem = document.createElement('li');
                liSubItem.className = "list-group-item rounded-top-right-20 rounded-bottom-20";
                if (index%2 != 0) {
                    liSubItem.className += " list-group-item-warning";
                }
                else {
                    liSubItem.className += " list-group-item-primary";
                }
                if (!item.isActive) {
                    liSubItem.className += ' disable';
                }
                liSubItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${index + 1}</span><span style='color: ${color}; font-weight: bold;'> ${item.name}</span><br></li>`;
                ulSubItem.appendChild(liSubItem);
            });
            
            return ulSubItem;
        }
        
        function drawSimpleSection(listItem, section, color, index, isEqual, ...sectionNew) {
            if (!section.isActive) {
                listItem.className += ' disable';
            }
            
            listItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${index}</span><span style='color: ${selectColorOrDisabled(section.isActive, color)}; font-weight: bold;'> ${section.title}</span>`;
            if (sectionNew.length > 0) {
                listItem.innerHTML += `<span style='color:${selectColorOrDisabled(sectionNew[0].isActive, sectionNew[1])}; font-weight: bold;'> ${sectionNew[0].title}</span>`;
            }
            listItem.innerHTML += `<br></li>`;
            
            if (isEqual) {
                listItem.appendChild(drawSimpleSubList(section, color));
            }
        }
        
        function drawDataRect(sectionOld, sectionNew) {
            let div = document.createElement('div');
            Object.getOwnPropertyNames(sectionOld).forEach((val, idx, array) => {
                if (sectionOld[val] == sectionNew[val]) {
                    if (!showChanges.checked) {
                        div.innerHTML += `<span style='color: black;'>${val}: ${sectionOld[val]}</span><br>`;
                    }
                }
                else {
                    div.innerHTML += `<span style='color: black;'><b>${val}:</b></span><br>`;
                    div.innerHTML += `<span style='color: ${selectColorOrDisabled(sectionOld.isActive, "red")};'> ${sectionOld[val]}</span> &nbsp; - &nbsp; <span style='color: ${selectColorOrDisabled(sectionNew.isActive, "green")};;'> ${sectionNew[val]}</span><br>`;
                }
            });
            div.className = 'boxed';
            return div;
        }
        
        function drawNavigationBlocksWidget(sectionsOld, sectionsNew) {
            const maxSize = Math.max(sectionsOld.length, sectionsNew.length);
            let parentDiv = createParentDiv();
            
            for (let i = 0; i < maxSize; i++) {
                let showNewLine = true;
                if (JSON.stringify(sectionsOld[i])===JSON.stringify(sectionsNew[i])) {
                    if (!showChanges.checked) {
                        drawOneLogo(sectionsOld[i], "black", i + 1);
                    }
                    else {
                        showNewLine = false;
                    }
                }
                else {
                    if (sectionsOld[i] == undefined || sectionsNew[i] == undefined) {
                        if (sectionsOld[i] == undefined) {
                            drawOneLogo(sectionsNew[i], "green", i + 1);
                        }
                        else {
                            drawOneLogo(sectionsOld[i], "red", i + 1);
                        }
                    }
                    else {
                        drawTwoLogosAndData(sectionsOld[i], sectionsNew[i], i + 1);
                    }
                }

                if (showNewLine) {
                    parentDiv.appendChild(document.createElement('br'));
                }
                
                function drawOneLogo(section, color, id) {
                    if (section != undefined) {
                        let image = document.createElement('img');
                        image.src = section.image;
                        image.style.height = '25px';
                        image.style.width = '25px';
                        let div = document.createElement('div');
                        div.className = 'roundedRect shadow-lg p-3 bg-body-tertiary rounded';
                        if (!section.isActive) {
                            div.className += ' disable';
                        }
                        div.innerHTML = `<br><span style='color: black; font-weight: bold;'>Логос ${id}</span><br><br>`;
                        div.appendChild(image);
                        div.innerHTML += `<br><span style='color: ${color};'>${section.title}</span><br>`;
                        div.innerHTML += `<br><span style='color: ${color}; font-size: small; opacity: 0.8'>${section.subtitle}</span><br>`;
                        parentDiv.appendChild(div);
                    }
                }
                
                function drawTwoLogosAndData(sectionOld, sectionNew, id) {
                    if (sectionOld.title == sectionNew.title &&
                        sectionOld.subtitle == sectionNew.subtitle &&
                        sectionOld.image == sectionNew.image) {
                            drawOneLogo(sectionOld, "black", id);
                            if (sectionOld.isActive != sectionNew.isActive) {
                                drawOneLogo(sectionNew, "black", id);
                            }
                    }
                    else {
                        drawOneLogo(sectionOld, "red", id);
                        drawOneLogo(sectionNew, "green", id);
                    }
                    
                    parentDiv.appendChild(drawDataRect(sectionOld, sectionNew));
                }
              
          }
      }


function drawCellList3Widget(sectionsOld, sectionsNew) {
    let parentDiv = createParentDiv();
    let ulItem = document.createElement('ul');
    ulItem.className="list-group";

    if (JSON.stringify(sectionsOld.options)!==JSON.stringify(sectionsNew.options) || !showChanges.checked) {
        parentDiv.innerHTML += "<b><i><ins>Настройки виджета:</ins></i></b><br>"
        drawCellListProperty(sectionsOld.options, sectionsNew.options, ulItem);
        
    }
    parentDiv.appendChild(ulItem);
    
    if (JSON.stringify(sectionsOld.cells)!==JSON.stringify(sectionsNew.cells) || !showChanges.checked) {
        parentDiv.innerHTML += "<b><i><ins>Cells:</ins></i></b><br>"
        const maxSize = Math.max(sectionsOld.cells.length, sectionsNew.cells.length);
        for (let i = 0; i < maxSize; i++) {
            if (JSON.stringify(sectionsOld.cells[i])!==JSON.stringify(sectionsNew.cells[i]) || !showChanges.checked) {
                let parentLiItem = document.createElement('li');
                parentLiItem.className = `list-group-item list-group-item-${(i % 2 == 0) ? "warning" : "secondary"} rounded-top-right-20 rounded-bottom-20`;
                parentLiItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${i}</span><br>`;
                for (let key in sectionsOld.cells.length > sectionsNew.cells.length ? sectionsOld.cells[i] : sectionsNew.cells[i]) {
                    if (JSON.stringify(sectionsOld.cells[i]?.[key])!==JSON.stringify(sectionsNew.cells[i]?.[key]) || !showChanges.checked) {
                        let color = "black";
                        if (sectionsOld.cells[i] == undefined) {
                            color = "green";
                        }
                        if (sectionsNew.cells[i] == undefined) {
                            color = "red";
                        }
                        parentLiItem.innerHTML += `&nbsp;&nbsp;&nbsp;&nbsp;<i><ins style='color: ${color};'>${key}:</ins></i><br>`
                        
                        ulItem = document.createElement('ul');
                        ulItem.className="list-group";
                        drawCellListProperty(sectionsOld.cells[i]?.[key], sectionsNew.cells[i]?.[key], ulItem);
                        
                        parentLiItem.appendChild(ulItem);
                    }
                }
                parentDiv.appendChild(parentLiItem);
            }
        }
    }
    
    function drawCellListProperty(sectionsOld, sectionsNew, ulItem) {
        let index = 0;
        for (let key in sectionsOld || sectionsNew) {
            index++;
            if (JSON.stringify(sectionsOld?.[key])!==JSON.stringify(sectionsNew?.[key]) || !showChanges.checked) {
                let liItem = document.createElement('li');
                if ((sectionsOld || sectionsNew)[key] instanceof Object) {
                    if (sectionsOld?.[key] != undefined && sectionsNew?.[key] != undefined) {
                        liItem.className="list-group-item list-group-item-info rounded-top-right-20 rounded-bottom-20";
                        liItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${index}</span><span style='color: black; font-weight: bold;'> ${key}</span><br>`;
                        liItem.appendChild(drawDataRect(sectionsOld[key], sectionsNew[key]));
                    } else {
                        let color = sectionsOld?.[key] == undefined ? "green" : "red";
                        liItem.className="list-group-item list-group-item-info rounded-top-right-20 rounded-bottom-20";
                        liItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${index}</span><span style='color: ${color}; font-weight: bold;'> ${key}</span><br>`;
                    }
                } else {
                    if (sectionsOld?.[key] != undefined && sectionsNew?.[key] != undefined) {
                        liItem.className="list-group-item list-group-item-info rounded-top-right-20 rounded-bottom-20";
                        liItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${index}</span><span style='color: black; font-weight: bold;'> ${key}</span><br>`;
                        if (sectionsOld?.[key] === sectionsNew?.[key]) {
                            liItem.innerHTML += `<span style='color: black;'>${sectionsOld?.[key]}</span>`;
                        } else {
                            liItem.innerHTML += `<span style='color: red;'>${sectionsOld?.[key]}</span> <span style='color: green;'>${sectionsNew?.[key]}</span>`;
                        }
                        liItem.innerHTML += `<br></li>`;
                    } else {
                        let color = sectionsOld?.[key] == undefined ? "green" : "red";
                        liItem.className="list-group-item list-group-item-info rounded-top-right-20 rounded-bottom-20";
                        liItem.innerHTML = `<span class='badge bg-primary rounded-pill'>${index}</span><span style='color: ${color}; font-weight: bold;'> ${key}</span><br>`;
                    }
                }
                if (liItem) {
                    ulItem.appendChild(liItem);
                }
            }
        }
    }
}
