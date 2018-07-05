(function () {
    function getStorage(detail, fun, showDuplicate) {
        chrome.storage.local.get([detail], (e) => { fun(e, showDuplicate) });
    }
    function handleValue(value, showDuplicate) {
        if (value.data.length <= 0) {
            let wholeElement = `<h1 class='alert'>You have no links</h1>`;
            document.querySelector(".container").insertAdjacentHTML('beforeend', wholeElement);
        } else {
            let wholeElement = '',
                filteredValue;
            let dupe = [], linkClass, duplicate;
            if (showDuplicate === false) {
                filteredValue = value.data.reduce(function (a, b, i) {
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
                duplicate = value.data.length - filteredValue.length;
                updateLinkCount(filteredValue.length, value.data.length, duplicate);
            } else {
                filteredValue = value.data.reduce(function (a, b, i) {
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

                duplicate = value.data.length - filteredValue.length;
                filteredValue = value.data;
                updateLinkCount(filteredValue.length, filteredValue.length, duplicate);
            }
            filteredValue.forEach((element, i) => {
                if (dupe.indexOf(element.href) !== -1) {
                    linkClass = 'dupe';
                } else {
                    linkClass = '';
                }
                wholeElement += `<div class="linkCon">
        <span class="numbers">${++i}</span>
        <div class="line"></div>
        <a href="${element.href}" class='link ${linkClass}'>${element.href}</a>
        <span class="aText">${isAvail(element.aText)}</span>
         <button class='bin'><i class="fa fa-trash" aria-hidden="true"></i></button>
        </div>`;
                function isAvail(val) {
                    if (val.trim() === "") {
                        return "No text available";
                    } else {
                        return val;
                    }
                }
            });
            document.querySelector(".container").insertAdjacentHTML('beforeend', wholeElement);
            handleDelete();
        }
    }

    getStorage("data", handleValue, false);
    // add delete event lisener 
    function updateLinkCount(shownValue, total, duplicates) {
        let shownLink = document.querySelector(".shownLink"),
            totalLink = document.querySelector(".linkNum"),
            dupe = document.querySelector(".duplicates");
        dupe.innerText = duplicates;
        shownLink.innerText = shownValue;
        totalLink.innerText = total;

    }
    function handleDelete() {
        let btn = document.querySelectorAll(".bin");
        for (let i = 0; i < btn.length; i++) {
            btn[i].addEventListener("click", (ev) => {
                console.log(ev);
                let id;
                if (ev.target.parentElement.tagName === "BUTTON") {
                    id = Number(ev.target.parentElement.parentElement.querySelector(".numbers").innerText);
                } else {
                    id = Number(ev.target.parentElement.querySelector(".numbers").innerText);
                }

                id = --id;
                function delData(val) {
                    let data = val.data.map(e => e);
                    data.splice(id, 1);
                    chrome.storage.local.set({ data }, (e) => {
                        if (e === undefined) {
                            let cbDuplicate = document.querySelector("#checkboxInput");
                            if (cbDuplicate.checked) {
                                removeList(true)
                            } else {
                                removeList(false)

                            }
                        }

                    });

                }
                getStorage("data", delData);

            });

        }
    }
    let cbDuplicate = document.querySelector("#checkboxInput");
    cbDuplicate.addEventListener("change", showDuplicateFun);
    function showDuplicateFun(e) {
        let showLink = document.querySelector(".shownLink"), linkNum = document.getElementsByClassName("linkNum")[0]; 
        if(Number(showLink.innerText)!==Number(linkNum.innerText)){
            if (cbDuplicate.checked) {
                removeList(true)
            } else {
                removeList(false)

            }
        }
    }

    function removeList(showDuplicate) {
        let linkCon = document.querySelectorAll(".linkCon");
        for (let i = 0; i < linkCon.length; i++) {
            linkCon[i].parentElement.removeChild(linkCon[i]);
        }
        getStorage("data", handleValue, showDuplicate);
    }
    //manage copy action
    let copyBtn = document.querySelector(".copyButton");
    copyBtn.addEventListener("click", handleCopy);
    function handleCopy() {
        chrome.storage.local.get(["data"], copyToClipboard);
        function copyToClipboard(text) {
            let dataToCopy = '';
            text.data.forEach(e => {
                dataToCopy += `${e.href} \n`;
            });
            const input = document.createElement('input');
            input.style.position = 'fixed';
            input.style.opacity = 0;
            input.value = dataToCopy;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
            swal("Copied!", "Links copied successfully", "success");
        }

    }
    let delDuplicate = document.querySelector(".delDuplicate");
    delDuplicate.addEventListener("click", handleDupeDel);
    function handleDupeDel(e) {
        chrome.storage.local.get(['data'], value => {
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
                chrome.storage.local.set({ data: filteredValue }, error => {
                    swal("Success", "Duplicates deleted", "success");
                    removeList("false");
                });
            }

        })
    }
    let searchBox = document.querySelector("#filter");
    searchBox.addEventListener("keyup",handleSearch); 
   function handleSearch(e){
      let links = document.getElementsByClassName("link"),value = searchBox.value;
      for (let i = 0; i < links.length; i++) {
          linkCon = links[i].parentElement;
         linkCon.classList.remove("hideLinkCon");
          linkCon.classList.remove("showThis");
        if(links[i].innerText.indexOf(value) ===-1){
            linkCon.classList.add("hideLinkCon");
        }else{
            linkCon.classList.add("showThis");
        }
      }
      let putNum = document.getElementsByClassName("showThis");
       for (let i = 0; i < putNum.length; i++) {
        putNum[i].firstElementChild.innerText = i+1;
      }
    }

})()