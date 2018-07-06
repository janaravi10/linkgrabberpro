(function(){
    let copyBtn = document.querySelector("button.copyButton");
    copyBtn.addEventListener("click", handleCopy);
    function handleCopy() {
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
})()