//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {

    function setTraceStart(date) {
        const text = document.getElementById('traceStartDate');
        if (text) {
            text.innerText = "Trace start: " + date; //Dangerous for injection
        }
    }
    function setTraceEnd(date) {
        const text = document.getElementById('traceEndDate');
        if (text) {
            text.innerText = "Trace end: " + date; //Dangerous for injection
        }
    }
    function setTotalErrors(count) {
        const text = document.getElementById('traceTotalErrors');
        if (text) {
            text.innerText = "Total errors: " + count; //Dangerous for injection
        }
    }
    function setTransactionErrors(count) {
        const text = document.getElementById('traceTransactionErrors');
        if (text) {
            text.innerText = "Current transaction errors: " + count; //Dangerous for injection
        }
    }

    window.addEventListener('message', function (event) {
        const message = event.data;

        switch (message.command) {
            case 'refreshTraceStats':
                setTraceStart(message.startDate);
                setTraceEnd(message.endDate);
                break;
            case 'refreshTotalErrorsStats':
                setTotalErrors(message.count);
                break;
            case 'refreshTransactionErrorsStats':
                setTransactionErrors(message.count);
                break;
        }
    });

}());