//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {

    function setTraceTiming(start, end) {
        const traceStartDate = document.getElementById('traceStartDate');
        if (traceStartDate) {
            traceStartDate.innerText = start;
        }
        const traceEndDate = document.getElementById('traceEndDate');
        if (traceEndDate) {
            traceEndDate.innerText = end;
        }
    }
    function setTotalErrors(countWarn, countError, countFatal) {
        const traceTotalWarn = document.getElementById('traceTotalWarn');
        if (traceTotalWarn) {
            traceTotalWarn.innerText = countWarn;
        }
        const traceTotalErrors = document.getElementById('traceTotalErrors');
        if (traceTotalErrors) {
            traceTotalErrors.innerText = countError;
        }
        const traceTotalFatal = document.getElementById('traceTotalFatal');
        if (traceTotalFatal) {
            traceTotalFatal.innerText = countFatal;
        }
    }
    function setTransactionErrors(countWarn, countError, countFatal) {
        const traceTransactionWarn = document.getElementById('traceTransactionWarn');
        if (traceTransactionWarn) {
            traceTransactionWarn.innerText = countWarn;
        }
        const traceTransactionErrors = document.getElementById('traceTransactionErrors');
        if (traceTransactionErrors) {
            traceTransactionErrors.innerText = countError;
        }
        const traceTransactionFatal = document.getElementById('traceTransactionFatal');
        if (traceTransactionFatal) {
            traceTransactionFatal.innerText = countFatal;
        }
    }

    window.addEventListener('message', function (event) {
        const message = event.data;

        switch (message.command) {
            case 'refreshTraceStats':
                setTraceTiming(message.startDate, message.endDate);
                break;
            case 'refreshTotalErrorsStats':
                setTotalErrors(message.countWarn, message.countError, message.countFatal);
                break;
            case 'refreshTransactionErrorsStats':
                setTransactionErrors(message.countWarn, message.countError, message.countFatal);
            break;
        }
    });

}());