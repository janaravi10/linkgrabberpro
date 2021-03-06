(function () {
    let storage = chrome.storage.local;
    function getStorage(fun, showDuplicate) {
        chrome.tabs.getCurrent(tab => {
            console.log(tab);
            chrome.storage.local.get(tab.id+"",value=>{
              if(value.length!==0){
                  storage.get(["" + tab.id], (e) => { fun(tab.id, e, showDuplicate); init(tab.id, e) });
              }else{
                  swal("Unknown Error!", "Sorry we are unable to fetch links :(", "error");
              }
            });
        });
    }
    function duplicateMin(data) {
        let dupe = [], reduced = [];
        reduced = data.reduce(function (prevVal, currentVal, index) {
            if (index !== 0) {
                let links = [];
                prevVal.forEach(e => {
                    links.push(e.href);
                });
                if (links.indexOf(currentVal.href) < 0) { currentVal.index = index;prevVal.push(currentVal); } else { dupe.push(currentVal.href) }
                return prevVal;
            } else {
                currentVal.index = index;
                prevVal.push(currentVal);
                return prevVal;
            }
        }, []);
        return [reduced, dupe];
    }
    function handleValue(tab,value, showDuplicate) {
        if(value.length===0){
            swal("Unknown Error:(", "Sorry we are unable to fetch links :(", "error");
            return;
        }
        let data;
        if(tab===null){
            data = value; 
        }else{
            data = value[tab].currentData;
        }
        if (data.length <= 0) {
            let wholeElement = `<h1 class='alert'>You have no links</h1>`;
            document.querySelector("div.container").insertAdjacentHTML('beforeend', wholeElement);
            updateLinkCount(0, 0)
        } else {
            let wholeElement = '',
                filteredValue = [],
                dupe = [], linkClass, dLen = data.length;
            returnedVal = duplicateMin(data);
            dupe = returnedVal[1];
            if (showDuplicate === false) {
                filteredValue = returnedVal[0];
                updateLinkCount(filteredValue.length, dLen);
            } else if (showDuplicate === true) {
                filteredValue = data.map((e,index)=>{e.index = index;return e;});
                updateLinkCount(dLen, dLen);
            }
            filteredValue.forEach((element, i) => {
                dupe.indexOf(element.href) !== -1 ? linkClass = "dupe" : linkClass = "";
                wholeElement += `<div class="linkCon">
        <span class="numbers" data-id='${element.index + 1}'>${i + 1}</span>
        <div class="line"></div>
        <a href="${element.href}" class='link ${linkClass}'>${element.href}</a>
        <span class="aText">${isAvail(element.aText)}</span>
          <button class='bin'><i class="demo-icon icon-trash"></i>
        </div>`;
                function isAvail(val) {
                    return val.trim() === "" ? "No text available" : val;
                }
            });
            document.querySelector("div.container").insertAdjacentHTML('beforeend', wholeElement);
        }
    }

    getStorage(handleValue, false);
    handleDelete();
    function handleDelete() {
        let div = document.querySelector("div.container");
        div.addEventListener("click", ev => {
            let clickedOn = ev.target;
            if (clickedOn.tagName === "BUTTON" || clickedOn.tagName === "I") {
                if (clickedOn.tagName === "BUTTON") {
                    if (clickedOn.classList.contains("bin") === false) {
                        return false;
                    }
                }
                let cbDuplicate = document.querySelector("input#checkboxInput"),
                    cBoxStatus;
                cbDuplicate.checked ? cBoxStatus = true : cBoxStatus = false;
                let id, parent = clickedOn.parentElement;
                if (parent.tagName === "BUTTON") {
                    id = Number(parent.parentElement.querySelector("span.numbers").getAttribute('data-id'));
                } else {
                    id = Number(parent.querySelector("span.numbers").getAttribute('data-id'));
                }
                id = --id;
                function delData(tab,val,showDuplicate) {
                    let data = val[tab].currentData.map(e => e),
                    otherVal = val[tab];
                    data.splice(id, 1);
                    otherVal.currentData = data;
                    storage.set({ [tab]:otherVal }, e => {
                        if (e === undefined) removeList(cBoxStatus);
                    });
                }
                getStorage(delData, cBoxStatus);
            }
        });
    }
    let sortBtn = document.querySelector("button.sortBtn");
    sortBtn.addEventListener("click", e => chrome.tabs.getCurrent(tab => {
        chrome.storage.local.get(["" + tab.id], (e) => { handleSort(tab.id, e) });
    }));

    function handleSort(tabId, data) {
        let { [tabId]: { currentData } } = data;
        let reg = /^https?:\/\/(\w{1,}\.)?(\w{1,}(\.\w{1,})?\.\w{1,})/i, domain, returned;
        function returnDomain(e) {
            returned = reg.exec(e);
            return returned === null ? e : returned[2];
        }
        let textA, textB;
        currentData.sort(function (a, b) {
            textA = returnDomain(a.href.toLowerCase());
            textB = returnDomain(b.href.toLowerCase());
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        let linkCon = document.querySelectorAll("div.linkCon"), i, len = linkCon.length;
        for (i = 0; i < len; i++) {
            linkCon[i].parentElement.removeChild(linkCon[i]);
        }
        handleValue(null,currentData,true);
    }
    function updateLinkCount(shownValue, total) {
        document.querySelector("span.shownLink").innerText = shownValue;
        document.querySelector("span.linkNum").innerText = total;
    }
    let cbDuplicate = document.querySelector("input[type='checkbox']#checkboxInput");
    cbDuplicate.addEventListener("change", e => {
        if (Number(document.querySelector("span.duplicates").innerText) > 0) { cbDuplicate.checked ? removeList(true) : removeList(false); }
    });
    function removeList(showDuplicate) {
        let linkCon = document.querySelectorAll("div.linkCon"), i, len = linkCon.length;
        for (i = 0; i < len; i++) {
            linkCon[i].parentElement.removeChild(linkCon[i]);
        }
        getStorage( handleValue, showDuplicate);
    }
    //manage copy action
    let copyBtn = document.querySelector("button.copyButton");
    copyBtn.addEventListener("click", handleCopy);
    function handleCopy() {
        let link = document.querySelectorAll("a.link"),
         i,len = link.length,currentData=[];
         if(link.length===0){
             swal("No links!", "sorry you have no links", "info");
             return;
         }
        for (i = 0; i < len; i++) {
        currentData.push(link[i].href);
        }
            let dataToCopy = '';
            currentData.forEach(e => {
                dataToCopy += `${e} \r\n`;
            });
            const input = document.createElement('input');
            input.setAttribute("style", `position: fixed;opacity:0;`);
            input.value = dataToCopy;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
            swal("Copied!", "Links copied successfully", "success");
    }
    let delDuplicate = document.querySelector("button.delDuplicate");
    delDuplicate.addEventListener("click", handleDupeDel);
    function handleDupeDel(e) {
        function delDupe(tab,val){
           let filteredValue = duplicateMin(val[tab].currentData)[0];
           console.log(`full ${val[tab].currentData.length} fill ${filteredValue.length}`)
            if (val[tab].currentData.length === filteredValue.length) {
                swal("No duplicates", "You have no duplicates for deleting", "info");
            } else {
                let otherVal = val[tab];
                otherVal.currentData = filteredValue;
                console.log(tab);
                storage.set({ [tab]: otherVal }, error => {
                    swal("Success", "Duplicates deleted", "success");
                    removeList(false);
                });
            }
        }
        chrome.tabs.getCurrent(tab => {
            storage.get(["" + tab.id], (e) => {delDupe(tab.id,e)});
        });
    }
     chrome.runtime.onMessage.addListener((request, sender, sendRes) => {
        chrome.storage.local.set({[request.tabId]: {currentData: request.data ,cURL: request.url,eLinkNum: request.eLinkNum}},error=>{
            if(chrome.runtime.lastError!==undefined){
                console.log(chrome.runtime.lastError);
            }
        })
    });
    function init(tab,data){
        document.querySelector("p.eLinkNum").innerText = data[tab].eLinkNum;
        document.querySelector("span.duplicates").innerText = data[tab].currentData.length - duplicateMin(data[tab].currentData)[0].length;
        document.title = "Links extracted from " + data[tab].cURL;
        document.querySelector("h2.headingTag").innerText = data[tab].cURL;
    }
})()
