let verticalArray = [];
let widgets = [];
let widgetsCount = 0;
let maxPage = 1;
let widgetVersion = '';

buttonMinus.addEventListener("click", () => {
    let number = Number(pageIndex.value);
    if (isNaN(number)) {
        number = 1;
    }
    number--;
    if (number <= 1) {
        number = 1;
        buttonMinus.disabled = true;
    } else {
        buttonMinus.disabled = false;
    }
    if (number < maxPage) {
        buttonPlus.disabled = false;
    }
    pageIndex.value = number;
    getElements(number - 1, false);
});

buttonPlus.addEventListener("click", () => {
    let number = Number(pageIndex.value);
    if (isNaN(number)) {
        number = 1;
    }
    number++;
    if (number >= maxPage) {
        number = maxPage;
        buttonPlus.disabled = true;
    } else {
        buttonPlus.disabled = false;
    }
    if (number > 1) {
        buttonMinus.disabled = false;
    }
    pageIndex.value = number;
    getElements(number - 1, false);
});

verticalName.addEventListener('click', async (event) => {
    if (verticalArray.length <= 1) {
        verticalArray = await getVerticalList(environment.value);
        
        for (let item of verticalArray) {
            let option = createHTMLElement('option', {'value': `${item.value}`});
            option.innerHTML = item.title;
            verticalName.appendChild(option)
        }
    }
});

verticalName.addEventListener('change', async function() { await searchElements(); });

widgetID.addEventListener('input', async function() { await searchElements(); });

[isActive, desktop, mobile].forEach(async function(element) {
    element.addEventListener("click", async function(event) {
        await searchElements();
    });
});

async function searchElements() {
    if (widgetID.value == "") {
        return;
    }
    getElements(0, true)
}

async function getElements(page, removeVersion) {
    let isActive = document.getElementById("isActive").getAttribute("aria-pressed").toLowerCase() == 'true';
    let platform = '';
    let isMobile = mobile.getAttribute("aria-pressed").toLowerCase() == 'true';
    let isDesktop = desktop.getAttribute("aria-pressed").toLowerCase() == 'true';
    if (isDesktop && !isMobile) {
        platform = 'desktop';
    }
    if (!isDesktop && isMobile) {
        platform = 'mobile';
    }
    let answer = await adminSearchV1(environment.value, verticalName.value, widgetID.value, platform, isActive, page);
    
    widgets = [];
    
    if (answer.count > 0) {
        widgets = answer.results;
        console.log(widgets)
        widgetVersion = '';
        if (removeVersion) {
            widgetsCount = answer.count;
            maxPage = Math.ceil(Number(widgetsCount) / 100.0);
            pageIndex.value = 1;
            buttonMinus.disabled = true;
            if (maxPage > 1) {
                buttonPlus.disabled = false;
            } else {
                buttonPlus.disabled = true;
            }
        }
        showWidgets(removeVersion);
    }
}

exportCSV.addEventListener('click', async (event) => {
    let isActive = document.getElementById("isActive").getAttribute("aria-pressed").toLowerCase() == 'true';
    let platform = '';
    let isMobile = mobile.getAttribute("aria-pressed").toLowerCase() == 'true';
    let isDesktop = desktop.getAttribute("aria-pressed").toLowerCase() == 'true';
    if (isDesktop && !isMobile) {
        platform = 'desktop';
    }
    if (!isDesktop && isMobile) {
        platform = 'mobile';
    }
    
    let content = await adminSearchV1(environment.value, verticalName.value, widgetID.value, platform, isActive, 0, false);
    
    content = content.csvString;
    if (widgetVersion != '') {
        let tempContent = content.split('\n');
        content = [];
        for (const item of tempContent) {
            if (item.includes("WidgetID")) {
                content.push(item);
                continue;
            }
            let tempItem = item.split(';')
            if (tempItem?.[6] ==  widgetVersion) {
                content.push(item);
            }
        }
        content = content.join('\n')
    }
    
    const link = document.createElement("a");
    const file = new Blob([content], { type: 'data:text/csv;charset=utf-8' });
    link.href = URL.createObjectURL(file);
    link.download = "export.csv";
    link.click();

    URL.revokeObjectURL(link.href);
});

function showWidgets(removeVersion) {
    while (accordionParent.firstChild) {
        accordionParent.firstChild.remove();
    }
    
    while (versionsGroup.children.length > 2) {
        versionsGroup.children[2].remove();
    }

    let isMobile = mobile.getAttribute("aria-pressed").toLowerCase() == 'true';
    
    let divParent = document.createElement('div');
    divParent.innerHTML = `Найдено: ${widgetsCount}<br>`;
    divParent.innerHTML += `<hr class="solid">`;
    let versions = [];
    for (const item of widgets) {
        if (widgetVersion != '' && widgetVersion != item.widgetVersion) {
            continue;
        }
        let aWidget = createHTMLElement('a', {'class': 'mainLink', 'href': `https://lmt.o3.ru/#/template/edit/${item.template.id}/?widgetId=${item.id}`});
        let divWidget = document.createElement('div');
        divWidget.innerHTML = `<b style='color: "black";'>${item.vertical}.${item.name}  ${item.label? ' - "' + item.label + '"' : ""}</b><br>`;
        divWidget.innerHTML += `<span style='color: "black"; font-size: 14px;'>id: ${item.id}  version: ${item.widgetVersion} Виджет для ${item.platform}</span><br>`;
        divWidget.innerHTML += `<span style='color: "black"; font-size: 14px;'>${(item.template.type == "layout")?"Шаблон":"Парт"}: <a href="https://lmt.o3.ru/#/template/edit/${item.template.id}">${item.template.name}</a>, ID: ${item.template.id}</span><br>`;
        divWidget.innerHTML += `<hr class="solid">`;
        versions.push(item.widgetVersion);
        aWidget.appendChild(divWidget);
        divParent.appendChild(aWidget);
    }
    accordionParent.appendChild(divParent);
    
    versions = Array.from(new Set(versions));
    versions.sort();
    for (const item of versions) {
        let option = createHTMLElement('button', {'class': `btn btn-light btn-sm ${widgetVersion == item?'active':''}`, 'data-bs-toggle': 'button', 'aria-pressed':` ${widgetVersion == item?'true':'false'}`, 'id': 'ver' + item});
        option.innerHTML = item;
        option.addEventListener("click", function() {
            for (const child of versionsGroup.children) {
                child.classList.remove("active");
                child.setAttribute("aria-pressed", "false");
            }
            this.classList.add('active');
            this.setAttribute("aria-pressed", "true");
            widgetVersion = this.innerHTML;
            showWidgets(false);
        });
        versionsGroup.appendChild(option)
    }
        
    if (widgetVersion != '') {
        allVersions.classList.remove("active");
        allVersions.setAttribute("aria-pressed", "false");
    } else {
        allVersions.classList.add('active');
        allVersions.setAttribute("aria-pressed", "true");
    }
    allVersions.addEventListener("click", function() {
        for (const child of versionsGroup.children) {
            child.classList.remove("active");
            child.setAttribute("aria-pressed", "false");
        }
        this.classList.add('active');
        this.setAttribute("aria-pressed", "true");
        widgetVersion = '';
        showWidgets(false);
    });
}
