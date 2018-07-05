(function () {
    let storage = chrome.storage.local;
    function getStorage(detail, fun, showDuplicate) {
        storage.get([detail], (e) => { fun(e, showDuplicate) });
    }
    function handleValue(value, showDuplicate) {
        let data = value.data;
        if (data.length <= 0) {
            let wholeElement = `<h1 class='alert'>You have no links</h1>`;
            document.querySelector("div.container").insertAdjacentHTML('beforeend', wholeElement);
            updateLinkCount(0,0,0)
        } else {
            let wholeElement = '',
                filteredValue = [];
            let dupe = [], linkClass, duplicate;
            if (showDuplicate === false) {
                filteredValue = duplicateMin();
                duplicate = data.length - filteredValue.length;
                updateLinkCount(filteredValue.length, data.length, duplicate);
            } else {
                let filLen = 0;
                filteredValue = duplicateMin();
                filLen = filteredValue.length;
                duplicate = data.length - filLen;
                filteredValue = data;
                updateLinkCount(filLen, filLen, duplicate);
            }
            function duplicateMin() {
                return data.reduce(function (a, b, i) {
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
    getStorage("data", handleValue, false);
    // add delete event lisener 
    function updateLinkCount(shownValue, total, duplicates) {
        document.querySelector("span.duplicates").innerText = duplicates;
        document.querySelector("span.shownLink").innerText = shownValue;
        document.querySelector("span.linkNum").innerText = total;
    }
    handleDelete();
    function handleDelete() {
        let div = document.querySelector("div.container");
        div.addEventListener("click", ev => {
           let clickedOn = ev.target;
            if (clickedOn.tagName === "BUTTON" || clickedOn.tagName ==="I") {
                if (clickedOn.tagName === "BUTTON"){
                    if (clickedOn.classList.contains("bin") === false){
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
                function delData(val) {
                    console.log(val);
                    let data = val.data.map(e => e);
                    data.splice(id, 1);
                    storage.set({ data }, e => {
                        if (e === undefined) removeList(cBoxStatus);
                    });
                }
                getStorage("data", delData, cBoxStatus);
            }
        });
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
        getStorage("data", handleValue, showDuplicate);
    }
    //manage copy action
    let copyBtn = document.querySelector("button.copyButton");
    copyBtn.addEventListener("click", handleCopy);
    function handleCopy() {
        storage.get(["data"], copyToClipboard);
        function copyToClipboard(text) {
            if(text.data.length===0){
                swal("No links","You have no links available","info");
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
    let delDuplicate = document.querySelector("button.delDuplicate");
    delDuplicate.addEventListener("click", handleDupeDel);
    function handleDupeDel(e) {
        storage.get(['data'], value => {
            let filteredValue = value.data.reduce(function (a, b, i) {
                if (i !== 0) {
                    let links = [];
                    a.forEach(e => {
                        links.push(e.href);
                    });
                    if (links.indexOf(b.href) < 0) { a.push(b) }
                    return a;
                } else {
                    a.push(b);
                    return a;
                }
            }, []);
            if (value.data.length === filteredValue.length) {
                swal("No duplicates", "You have no duplicates for deleting", "info");
            } else {
                storage.set({ data: filteredValue }, error => {
                    swal("Success", "Duplicates deleted", "success");
                    removeList(false);
                });
            }

        })
    }
    let searchBox = document.querySelector("input#filter");
    searchBox.addEventListener("keyup", handleSearch);
    function handleSearch(e) {
        let links = document.querySelectorAll("a.link"), value = searchBox.value.trim().toLowerCase();
        valueForReg = value;
        valueForReg = valueForReg.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
        if (value == "") { if (e.keyCode !== 8) return; };
        let i, len = links.length;
        for (i = 0; i < len; i++) {
            link = links[i];
            linkCon = link.parentElement, clsList = linkCon.classList;
            clsList.remove("hideLinkCon", "showThis");
            if (RegExp(valueForReg, 'i').test(link.innerText) === false) {
                clsList.add("hideLinkCon");
            } else {
                clsList.add("showThis");
                valueForLink = link.innerText.replace(RegExp(valueForReg, 'gi'), `<span class='lightup'>${value}</span>`);
                link.innerText = "";
                link.insertAdjacentHTML("beforeend", valueForLink);
            }
        }
        let putNum = document.getElementsByClassName("div.showThis");
        let n, plen = putNum.length;
        for (n = 0; n < plen; n++) {
            putNum[n].firstElementChild.innerText = n + 1;
        }
    }
})()