(function () {
    let data = [], eLinks;
    let copyBtn = document.querySelector("button.copyButton");
    copyBtn.addEventListener("click", handleCopy);
    function handleCopy() {
        let dataForCopy;
        dataForCopy = cbDuplicate.checked === true ? data:duplicateMin()[0];
        if (dataForCopy.length === 0) {
            swal("No links", "You have no links available", "info");
            return;
        }
        let dataToCopy = '';
        dataForCopy.forEach(e => {
            dataToCopy += `${e.href} \n\r `;
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
    function updateLinkCount(shownValue, total) {
        document.querySelector("span.shownLink").innerText = shownValue;
        document.querySelector("span.linkNum").innerText = total;
    }
    function duplicateMin() {
        let dupe = [],reduced = [];
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
        return [reduced,dupe];
    }
    function handleValue(showDuplicate) {
        let wholeElement = '',
            filteredValue = [],
            dupe = [], linkClass, dLen = data.length;
            returnedVal = duplicateMin();
            dupe = returnedVal[1];
        if (showDuplicate === false) {
            filteredValue = returnedVal[0];
            updateLinkCount(filteredValue.length, dLen);
        } else if (showDuplicate === true) {
            filteredValue = data;
            updateLinkCount(dLen, dLen);
        }
        console.log(filteredValue);
        filteredValue.forEach((element, i) => {
            dupe.indexOf(element.href) !== -1 ? linkClass = "dupe" : linkClass = "";
            wholeElement += `<div class="linkCon">
        <span class="numbers" data-id='${i + 1}'>${i + 1}</span>
        <div class="line"></div>
        <a href="${element.href}" class='link ${linkClass}'>${element.href}</a>
        <span class="aText">${isAvail(element.aText)}</span>
        </div>`;
            function isAvail(val) {
                return val.trim() === "" ? "No text available" : val;
            }
        });
        document.querySelector("div.container").insertAdjacentHTML('beforeend', wholeElement);
    }
    chrome.runtime.onMessage.addListener((request, sender, sendRes) => {
        data = request.data, eLinks = request.eLinkNum;

        let eLinkTag = document.querySelector("p.eLinkNum");
        eLinkTag.innerText = request.eLinkNum;
        document.querySelector("span.duplicates").innerText = data.length-duplicateMin()[0].length;
        handleValue(false);
    });
    let cbDuplicate = document.querySelector("input[type='checkbox']#checkboxInput");
    cbDuplicate.addEventListener("change", e => {
        if (Number(document.querySelector("span.duplicates").innerText) > 0) { cbDuplicate.checked ? removeList(true) : removeList(false); }
    });
    function removeList(showDuplicate) {
        let linkCon = document.querySelectorAll("div.linkCon"), i, len = linkCon.length;
        for (i = 0; i < len; i++) {
            linkCon[i].parentElement.removeChild(linkCon[i]);
        }
        console.log(showDuplicate);
        handleValue(showDuplicate);
    }
})()
