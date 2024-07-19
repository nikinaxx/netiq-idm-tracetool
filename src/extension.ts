import { ExtensionContext, window, commands } from 'vscode';
import { StatsWebviewViewProvider } from './traceStats';
import { showInputBox, nextOccuranceCommand, previousOccuranceCommand, currentEventOccuranceCommand, goToTransactionCommand, goToTransactionBottomCommand } from './commands';
import { TracetoolTreeDataProvider, getBookmarksChildren, getPolicyListChildren, getTraceNavigationChildren, getTransactionListChildren } from './tracetoolTreeDataProvider';

export function activate(context: ExtensionContext) {

	// View providers
	//const fwvp = new FindWebviewViewProvider(context.extensionUri);
	const ntvp = new TracetoolTreeDataProvider(getTraceNavigationChildren);
	const pltvp = new TracetoolTreeDataProvider(getPolicyListChildren);
	const tltvp = new TracetoolTreeDataProvider(getTransactionListChildren);
	const btvp = new TracetoolTreeDataProvider(getBookmarksChildren);
	const swvp = new StatsWebviewViewProvider(context.extensionUri);

	//const rfwvp =	window.registerWebviewViewProvider('trace-find', fwvp);
	const rntvp = window.registerTreeDataProvider('trace-navigation', ntvp);
	const rpltvp = window.registerTreeDataProvider('trace-policyList', pltvp);
	const rtltvp =	window.registerTreeDataProvider('trace-transactionList', tltvp);
	const rbtvp = window.registerTreeDataProvider('trace-bookmarks', btvp);
	const rswvp =	window.registerWebviewViewProvider('trace-stats', swvp);

	context.subscriptions.push(rtltvp, rntvp, rpltvp, rbtvp, rswvp);

	// Commands
	const abc = commands.registerCommand('tracetool.addBookmark', showInputBox);
	const poc = commands.registerCommand('tracetool.previousOccurance', (item) => previousOccuranceCommand(item));
	const noc = commands.registerCommand('tracetool.nextOccurance', (item) => nextOccuranceCommand(item));
	const eoc = commands.registerCommand('tracetool.eventOccurance', (item) => currentEventOccuranceCommand(item));
	const gtc = commands.registerCommand('tracetool.goToTransaction', (item) => goToTransactionCommand(item));
	const gtbc = commands.registerCommand('tracetool.goToTransactionBottom', (item) => goToTransactionBottomCommand(item));

	context.subscriptions.push(abc, poc, noc, eoc, gtc, gtbc);

	// Events
	
}

export function deactivate() {

}
