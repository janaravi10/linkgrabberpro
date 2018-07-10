let searchBox = document.querySelector("input#filter");
searchBox.addEventListener("keyup", handleSearch);
function handleSearch(e) {
    console.log(e);
    let links, value = searchBox.value.trim().toLowerCase();
    valueForReg = value;
    if (value !== "" && e.keyCode !== 8) {
        if(value.length !== 0){
            links = document.querySelectorAll("a.link");
        } else {
            links = document.querySelectorAll("div.showThis > a");
        }
    } else {
        links = document.querySelectorAll("a.link");
    }
    console.log(links);
    valueForReg = valueForReg.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|\>\<]/g, "\\$&")
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
    let putNum = document.querySelectorAll("div.showThis");
    let n, plen = putNum.length;
    for (n = 0; n < plen; n++) {
        putNum[n].firstElementChild.innerText = n + 1;
    }
}