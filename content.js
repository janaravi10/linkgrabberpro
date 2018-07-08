(function () {
    //adding element
    let cRun = chrome.runtime,
        element = document.createElement("div");
    element.className = "resizeBox";
    document.body.appendChild(element);
    //code for deleting event listener
    let disposer, isCtrlPressed = false;
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
        } else if (e.ctrlKey === false && isCtrlPressed == false) {
            return;
        }
        disposer();
        let boxMeasures = element.getBoundingClientRect(),
            elWidth = boxMeasures.width,
            elHeight = boxMeasures.height,
            elX = boxMeasures.x,
            elY = boxMeasures.y;
        if (e.ctrlKey === false || isCtrlPressed == false) {
            element.setAttribute("style", `display: none;height: 0px; width: 0px;`);
            return;
        }
        getLinks(elWidth, elHeight, elX, elY);
        element.setAttribute("style", `display: none;height: 0px; width: 0px;`);
    });
    //get links from which are inside the rectangle
    function getLinks(width, height, x, y) {
        function isVisible(ele) {
            var style = window.getComputedStyle(ele);
            if (style.width === 0 ||
                style.height === 0 ||
                style.opacity === 0 ||
                style.display === 'none' ||
                style.visibility === 'hidden') {
                return false;
            } else {
                return true;
            }
        }
        let links = document.querySelectorAll("a"),
            validLinks = [], datas = [], measures, linkX, linkWidth, linkY, linkHeight;
        links.forEach((elem) => {
            let measures = elem.getBoundingClientRect(),
                linkX = measures.x,
                linkWidth = measures.width,
                linkY = measures.y,
                linkHeight = measures.height;
            if ((linkX >= x && linkX <= width + x) || ((linkX + linkWidth) >= x && (linkX + linkWidth) <= x + width)) {
                if ((linkY >= y && linkY <= y + height) || ((linkY + linkHeight) >= y && (linkY + linkHeight) <= y + height)) {
                    if (elem.href.trim() !== "" && isVisible(elem) === true) {
                        validLinks.push(elem);
                        datas.push({ href: elem.href, aText: elem.innerText.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\&/g, "&amp;") });
                    }
                }
            } else if (((x >= linkX) && x <= (linkX + linkWidth)) && (((linkY >= y) || (linkY + linkHeight >= y)) && linkY <= (y + height))) {
                if (elem.href.trim() !== "" && isVisible(elem) === true) {
                    validLinks.push(elem);
                    datas.push({ href: elem.href, aText: elem.innerText.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\&/g, "&amp;") });
                }
            }
        });
        if (validLinks.length) {
            validLinks.forEach(valLink => {
                valLink.style.border = "1px dotted #000";
            });
            cRun.sendMessage({ link: datas, isLink: true }, response => {
                if (response.success === true) {
                    setTimeout(() => {
                        validLinks.forEach(item => {
                            item.style.border = "none";
                        })
                    }, 500);
                }
            });
        }

    }
    //handle mouse down event
    window.addEventListener("mousedown", manageMouseDown);
    function manageMouseDown(event) {
       
        let mouseDownX = event.clientX, mouseDownY = event.clientY, targ = event.target,
            selectedLink = document.querySelectorAll("a.selectiveLinks").length;
        if (event.buttons === 2 && (targ.tagName == "A" || targ.parentElement.tagName == "A")) {
            if (targ.parentElement.tagName == "A") {
                if (targ.parentElement.classList.contains("selectiveLinks")) {
                    cRun.sendMessage({ updateMenu: true, selectedLink });
                } else {
                    cRun.sendMessage({ addMenu: true });
                    targ.parentElement.classList.add("findLink");
                }
            } else {
                if (targ.classList.contains("selectiveLinks")) {
                    cRun.sendMessage({ updateMenu: true, selectedLink });
                } else {
                    cRun.sendMessage({ addMenu: true });
                    targ.classList.add("findLink");
                }
            }

        }
        if (event.altKey === true) {
            handleSelectiveClick(event);
            return;
        } else if (event.ctrlKey === false) {
            isCtrlPressed = false;
            return;
        } else {
            isCtrlPressed = true;
        }
        event.preventDefault();
        element.setAttribute("style", `display:block;top:${mouseDownY}px;left:${mouseDownX}px;`);
        //adding mouse move event listener
        disposer = ownAddEventListener(window, 'mousemove', manageMouseMove, false);
        function manageMouseMove(eve) {
            if (eve.buttons == 1) {
                let movingClientX = eve.clientX,
                    movingClientY = eve.clientY;
                if (movingClientX >= mouseDownX) {
                    element.style.width = movingClientX - mouseDownX + "px";
                    if (movingClientY >= mouseDownY) {
                        element.style.height = movingClientY - mouseDownY + "px";
                    }
                }
            }
        }

    }
    //handle addressbar request
    cRun.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.needLink == true) {
                let aText = "address bar",
                    link = window.location.href;
                cRun.sendMessage({ link: [{ aText, href: link }], isLink: true }, response => {
                    if (response.success) {
                        sendResponse({ linkAdded: true });
                    }
                });
            } else if (request.getLink === true) {
                let selectedLink = document.getElementsByClassName("selectiveLinks"), data = [], i, selLinkLen = selectedLink.length, element;
                for (i = 0; i < selLinkLen; i++) {
                    element = selectedLink[i];
                    data.push({ href: element.href, aText: element.innerText });
                }
                cRun.sendMessage({ link: data, isLink: true }, (res) => {
                    if (res.success) {
                        let selectedLink = document.querySelectorAll("a"), i, selLinkLen = selectedLink.length, selLinkClassList;
                        for (i = 0; i < selLinkLen; i++) {
                            selLinkClassList = selectedLink[i];
                            if (selLinkClassList.contains("selectiveLinks")) {
                                selLinkClassList.remove("selectiveLinks");
                            }
                        }
                    }
                })
            } else if (request.getSingleLink) {
                let singleLink = document.querySelector("findLink"), data = [];
                if (singleLink.tagName !== "A") {
                    singleLink = singleLink.parentElement;
                }
                data.push({ href: singleLink.href, aText: singleLink.innerText });
                cRun.sendMessage({ link: data, isLink: true }, (res) => {
                    if (res.success) {
                        let links = document.querySelectorAll("a"), i, linkLen = links.length, linkClassList;
                        for (i = 0; i < linkLen; i++) {
                            linkClassList = links[i];
                            if (linkClassList.contains("findLink")) {
                                linkClassList.remove("findLink");
                            }
                        }
                    }
                })
            }else if(request.getAllLinks){
               let allLinks = document.querySelectorAll("a"),i,linkLen = allLinks.length,links=[],link,eLinkNum =0;
               for ( i = 0; i < linkLen; i++) {
                link = allLinks[i];
                   if (link.href.trim() === "") { eLinkNum++ } else { links.push({ href: link.href, aText: valueForReg = link.innerText.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\&/g,"&amp;") });}
               }
               sendResponse({links,eLinkNum,website: window.location.href});
            }
            return true;
        });
    //handle selected clicks
    function handleSelectiveClick(eve) {
        let targ = eve.target, selectedLink,
            altElement = document.createElement("div");
        altElement.className = "altBox";
        document.body.appendChild(altElement);
        if (targ.tagName === "A" || targ.parentElement.tagName == "A") {
            targ.tagName === "A" ? targ.classList.add("selectiveLinks") : targ.parentElement.classList.add("selectiveLinks");
            altElement.setAttribute("style", `display: block;top:${eve.clientY}px;left:${eve.clientX}px;`);
            selectedLink = document.querySelectorAll("a.selectiveLinks").length;
            cRun.sendMessage({ updateMenu: true, selectedLink });
        }
    }

})()