(function () {
    //adding element
    let element = document.createElement("div");
    element.className = "resizeBox";
    document.body.appendChild(element);
    let altElement = document.createElement("div");
    altElement.className = "altBox";
    document.body.appendChild(altElement);
    //code for deleting event listener
    let disposer, isCtrlPressed=false;
    const ownAddEventListener = (scope, type, handler, capture) => {
        scope.addEventListener(type, handler, capture);
        return () => {
            scope.removeEventListener(type, handler, capture);
        }
    };
    //handling mouse up events
    window.addEventListener("mouseup", function (e) {
        if (e.altKey === true) {
            return;
        }else if (e.ctrlKey === false && isCtrlPressed == false) {
            return;
        } 
        disposer();
        let boxMeasures = element.getBoundingClientRect();
        let elWidth = boxMeasures.width,
            elHeight = boxMeasures.height,
            elX = boxMeasures.x,
            elY = boxMeasures.y;
        if (e.ctrlKey === false || isCtrlPressed == false){
            element.style.display = "none";
            element.style.height = "0px";
            element.style.width = "0px";
            return;
        }
        getLinks(elWidth, elHeight, elX, elY);
        element.style.display = "none";
        element.style.height = "0px";
        element.style.width = "0px";
    });
    //get links from which are inside the rectangle
    function getLinks(width, height, x, y) {
        let links = document.querySelectorAll("a"),
            validLinks = [], datas = [];
        links.forEach((elem) => {
            let measures = elem.getBoundingClientRect(),
                linkX = measures.x,
                linkWidth = measures.width,
                linkY = measures.y,
                linkHeight = measures.height;
            if ((linkX >= x && linkX <= width + x) || ((linkX + linkWidth) >= x && (linkX + linkWidth) <= x + width)) {
                if ((linkY >= y && linkY <= y + height) || ((linkY + linkHeight) >= y && (linkY + linkHeight) <= y + height)) {
                    if (elem.href.trim() !== "") {
                        validLinks.push(elem);
                        datas.push({ href: elem.href, aText: elem.innerText });
                    } else {
                        
                    }

                }
            } else if (((x >= linkX) && x <= (linkX + linkWidth)) && (((linkY >= y) || (linkY + linkHeight >= y)) && linkY <= (y + height))) {
                if (elem.href.trim() !== "") {
                    validLinks.push(elem);
                    datas.push({ href: elem.href, aText: elem.innerText });
                } else {
                    console.log(elem)
                }
            }
        });
        if (validLinks.length !== 0) {
            
            validLinks.forEach((valLink) => {
                valLink.style.border = "1px dotted #000";
            });
            chrome.runtime.sendMessage({ link: datas, isLink: true }, (response) => {
                if (response.success === true) {
                    setTimeout(() => {
                        validLinks.forEach((item) => {
                            item.style.border = null;
                        })
                    }, 500);
                }
            });
        }

    }
    //handle mouse down event
    window.addEventListener("mousedown", manageMouseDown);
    function manageMouseDown(event) {
        if (event.buttons === 2 && (event.target.tagName == "A" || event.target.parentElement.tagName == "A")) {
            if (event.target.parentElement.tagName == "A"){
                if (event.target.parentElement.classList.contains("selectiveLinks")) {
                    let selectedLink = document.getElementsByClassName("selectiveLinks").length;
                    chrome.runtime.sendMessage({ updateMenu: true, selectedLink });
                } else {
                    chrome.runtime.sendMessage({ addMenu: true });
                    event.target.parentElement.classList.add("findLink");
                }
            }else{
                if (event.target.classList.contains("selectiveLinks")) {
                    let selectedLink = document.getElementsByClassName("selectiveLinks").length;
                    chrome.runtime.sendMessage({ updateMenu: true, selectedLink });
                } else {
                    chrome.runtime.sendMessage({ addMenu: true });
                    event.target.classList.add("findLink");
                }
            }

        }
        if (event.altKey === true) {
        event.preventDefault();
            handleSelectiveClick(event);
            return;
        }
        if (event.ctrlKey === false) {
            isCtrlPressed = false;
            return;
        } else {
            isCtrlPressed = true;
        }

        event.preventDefault();
        let mouseDownX = event.clientX,
            mousedownY = event.clientY;
        element.style.display = "block";
        element.style.top = event.clientY + "px";
        element.style.left = event.clientX + "px";
        //adding mouse move event listener
        disposer = ownAddEventListener(window, 'mousemove', manageMouseMove, false);
        function manageMouseMove(eve) {
            if (eve.buttons == 1) {
                let movingClientX = eve.clientX,
                    movingClientY = eve.clientY;
                if (movingClientX >= mouseDownX) {
                    element.style.width = eve.clientX - mouseDownX + "px";
                    if (movingClientY >= mousedownY) {
                        element.style.height = eve.clientY - mousedownY + "px";
                    }
                }
            }
        }

    }
    //handle addressbar request
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.needLink == true) {
                let  aText = "address bar",
                    link = window.location.href;
                chrome.runtime.sendMessage({ link: [{ aText, href: link }], isLink: true }, (response) => {
                    if (response.success == true) {
                        sendResponse({ linkAdded: true });
                    }
                });
                return true;
            } else if (request.getLink === true) {
                let selectedLink = document.getElementsByClassName("selectiveLinks"), data = [];
                for (let i = 0; i < selectedLink.length; i++) {
                    let element = selectedLink[i];
                    data.push({ href: element.href, aText: element.innerText});
                }
                chrome.runtime.sendMessage({ link: data, isLink: true }, (res) => {
                    if (res.success) {
                        let selectedLink = document.querySelectorAll("a");
                        for (let i = 0; i < selectedLink.length; i++) {
                            if (selectedLink[i].classList.contains("selectiveLinks")) {
                                selectedLink[i].classList.remove("selectiveLinks");
                            }
                        }
                    }
                })
            } else if (request.getSingleLink) {
                let singleLink = document.getElementsByClassName("findLink")[0], data = [];
                if(singleLink.tagName!=="A"){
                    singleLink = singleLink.parentElement;
                }
                
                data.push({ href: singleLink.href, aText: singleLink.innerText});
                chrome.runtime.sendMessage({ link: data, isLink: true }, (res) => {
                    if (res.success) {
                        let links = document.querySelectorAll("a");
                        for (let i = 0; i < links.length; i++) {
                            if (links[i].classList.contains("findLink")) {
                                links[i].classList.remove("findLink");
                            }
                        }
                    }
                })
            }
        });
    //handle selected clicks
    function handleSelectiveClick(eve) {
        if (eve.target.tagName === "A" || eve.target.parentElement.tagName=="A") {
            if(eve.target.tagName==="A"){
                eve.target.classList.add("selectiveLinks");
            }else{
                eve.target.parentElement.classList.add("selectiveLinks");
            }
            altElement.style.display = "block";
            altElement.style.top = eve.clientY + "px";
            altElement.style.left = eve.clientX + "px";
            let selectedLink = document.getElementsByClassName("selectiveLinks").length;
            chrome.runtime.sendMessage({ updateMenu: true, selectedLink });
        }
    }

})()