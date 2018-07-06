function verifyNum(element) {
    console.log(element);
    if (element>0) {
        return true;
    }else{
        return false;
    }
}

window.onload = wrapper;
function wrapper() {
    //show link count
    function showLinkCount(){
        let countSpan = document.getElementById("count");
        chrome.storage.local.get(["data"], (val) => {
        if(val.data==undefined){
            countSpan.innerText = 0
        }else{
            countSpan.innerText = val.data.length;
        }
        })
    }
    showLinkCount();
    //manage download of csv
    let downloadBtn = document.querySelector("#download");
    downloadBtn.addEventListener("click",handleDownload
);
    function handleDownload(){
        chrome.storage.local.get(["data"],(res)=>{
            if(res.data.length<=0){
                return;
            }
            let array = res.data,
                text = `links,anchor text\r\n`;
            array.forEach(element => {
                text += `${element.href},${element.aText}\r\n`
            });
            let encodedUri = encodeURI(text);
            let link = document.createElement("a");
            link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodedUri);
            link.setAttribute("download", "link.csv");
            link.click();
            chrome.storage.local.set({data:[]});
            showLinkCount();
        })
    
    }

    //Manage link deletion
    let delBtn = document.getElementById("DeleteAll");
    delBtn.addEventListener("click",handleDelete);
    function handleDelete(){
      chrome.storage.local.set({data:[]});
        showLinkCount();
    }
    //manage selective deletion
    let delLast = document.getElementById("deleteLast");
    delLast.addEventListener("click",handleSelectiveDel);
    function handleSelectiveDel(){
        let inputDel = Number(document.querySelector("#delInput").value);
        if(verifyNum(inputDel)){
            getData(handleres);
        }
        function handleres(data) {
            let array = data.data.map(e=>e);
            if(inputDel > array.length){
                array = [];
                chrome.storage.local.set({ data: array }, (err) => {
                    
                    showLinkCount();
                });
            }else{
                array.splice(array.length-inputDel,inputDel);
                chrome.storage.local.set({data: array},(err)=>{
                    
                    showLinkCount();
                });
            }
        }
      
    }
    //get links 
    function getData(fun){
      chrome.storage.local.get("data",fun);
    }
  //addLink From address bar
    let addressBarBtn = document.getElementById("AddressBarLink");
    addressBarBtn.addEventListener("click",handleAddressBarLink);
    function handleAddressBarLink(){
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { needLink: true }, function (response) {
                if(response.linkAdded===true){
                    showLinkCount();
                }
            });
        });
    }
} 
//show current tab links
let btnStoredLinks = document.getElementById('storedLinks');
btnStoredLinks.addEventListener('click',e=>{
    chrome.tabs.create({ active: true, url: chrome.runtime.getURL("links.html") });
})
let showTabLink = document.querySelector('#showTabLinks');
showTabLink.addEventListener("click",e=>{
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { getAllLinks: true }, function (response) {
            if (response.links.length) {
                chrome.runtime.sendMessage({ createTab: true, data: response.links, eLinkNum:response.eLinkNum});
            }
        });
    });
})