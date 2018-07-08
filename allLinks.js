(function () {
    let storage = chrome.storage.local;
 
    function getStorage(fun, showDuplicate) {
        chrome.tabs.getCurrent(tab => {
            storage.get([""+tab.id], (e) => { fun(tab.id,e, showDuplicate);init(tab.id,e) });
        })
    }
    function duplicateMin(data) {
        let dupe = [], reduced = [];
        reduced = data.reduce(function (a, b, i) {
            if (i !== 0) {
                let links = [];
                a.forEach(e => {
                    links.push(e.href);
                });
                if (links.indexOf(b.href) < 0) { a.push(b) } else { dupe.push(b.href) }
                return a;
            } else {
                a.push(b);
                return a;
            }
        }, []);
        return [reduced, dupe];
    }
    function handleValue(tab,value, showDuplicate) {
        let data = value[tab].currentData;
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
                filteredValue = data;
                updateLinkCount(dLen, dLen);
            }
            filteredValue.forEach((element, i) => {
                dupe.indexOf(element.href) !== -1 ? linkClass = "dupe" : linkClass = "";
                wholeElement += `<div class="linkCon">
        <span class="numbers" data-id='${i + 1}'>${i + 1}</span>
        <div class="line"></div>
        <a href="${element.href}" class='link ${linkClass}'>${element.href}</a>
        <span class="aText">${isAvail(element.aText)}</span>
          <button class='bin'><i class="fa fa-trash" aria-hidden="true"></i></button>
        </div>`;
                function isAvail(val) {
                    return val.trim() === "" ? "No text available" : val;
                }
            });
            document.querySelector("div.container").insertAdjacentHTML('beforeend', wholeElement);
        }
    }

    getStorage(handleValue, false);
    // handleDelete();
    // function handleDelete() {
    //     let div = document.querySelector("div.container");
    //     div.addEventListener("click", ev => {
    //         let clickedOn = ev.target;
    //         if (clickedOn.tagName === "BUTTON" || clickedOn.tagName === "I") {
    //             if (clickedOn.tagName === "BUTTON") {
    //                 if (clickedOn.classList.contains("bin") === false) {
    //                     return false;
    //                 }
    //             }
    //             let cbDuplicate = document.querySelector("input#checkboxInput"),
    //                 cBoxStatus;
    //             cbDuplicate.checked ? cBoxStatus = true : cBoxStatus = false;
    //             let id, parent = clickedOn.parentElement;
    //             if (parent.tagName === "BUTTON") {
    //                 id = Number(parent.parentElement.querySelector("span.numbers").getAttribute('data-id'));
    //             } else {
    //                 id = Number(parent.querySelector("span.numbers").getAttribute('data-id'));
    //             }
    //             id = --id;
    //             function delData(val) {
    //                 console.log(val);
    //                 let data = val.currentData.map(e => e);
    //                 data.splice(id, 1);
    //                 storage.set({ data }, e => {
    //                     if (e === undefined) removeList(cBoxStatus);
    //                 });
    //             }
    //             getStorage("data", delData, cBoxStatus);
    //         }
    //     });
    // }
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
        storage.get(["data"], copyToClipboard);
        function copyToClipboard(text) {
            if (text.data.length === 0) {
                swal("No links", "You have no links available", "info");
                return;
            }
            let dataToCopy = '';
            text.data.forEach(e => {
                dataToCopy += `${e.href} \n`;
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

    }
    // let delDuplicate = document.querySelector("button.delDuplicate");
    // delDuplicate.addEventListener("click", handleDupeDel);
    // function handleDupeDel(e) {
    //     storage.get(['data'], value => {
    //         let filteredValue = value.data.reduce(function (a, b, i) {
    //             if (i !== 0) {
    //                 let links = [];
    //                 a.forEach(e => {
    //                     links.push(e.href);
    //                 });
    //                 if (links.indexOf(b.href) < 0) { a.push(b) }
    //                 return a;
    //             } else {
    //                 a.push(b);
    //                 return a;
    //             }
    //         }, []);
    //         if (value.data.length === filteredValue.length) {
    //             swal("No duplicates", "You have no duplicates for deleting", "info");
    //         } else {
    //             storage.set({ data: filteredValue }, error => {
    //                 swal("Success", "Duplicates deleted", "success");
    //                 removeList(false);
    //             });
    //         }

    //     })
    // }
     chrome.runtime.onMessage.addListener((request, sender, sendRes) => {
        chrome.storage.local.set({[request.tabId]: {currentData: request.data ,cURL: request.url,eLinkNum: request.eLinkNum}},error=>{
          console.log(error);
          getStorage(handleValue,false);
        })
    });
    function init(tab,data){
        document.querySelector("p.eLinkNum").innerText = data[tab].eLinkNum;
        document.querySelector("span.duplicates").innerText = data[tab].currentData.length - duplicateMin(data[tab].currentData)[0].length;
        document.title = "Links extracted from " + data[tab].cURL;
        document.querySelector("h2.headingTag").innerText = data[tab].cURL;
    }
})()
