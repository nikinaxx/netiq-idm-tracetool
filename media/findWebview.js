//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {

    function setNumFindResults(num) {
        const text = document.getElementById('num-find-results');
        if (text) {
            text.innerText = "Results: " + num; //Dangerous for injection
        }
    }

    document.getElementById('button-find').addEventListener('click', () => {
        const inputText = document.getElementById('input-find').value;
        vscode.postMessage({ command: 'btnFindPressed', searchString: inputText });
    });

    window.addEventListener('message', function (event) {
        const message = event.data;

        switch (message.command) {
            case 'showNumFindResults':
                setNumFindResults(message.resultsLength);
                break;
        }
    });

}());