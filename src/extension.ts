import { ExtensionContext, window, commands } from 'vscode';
import { StatsWebviewViewProvider } from './traceStats';
import { showInputBox, nextOccuranceCommand, previousOccuranceCommand, currentTransactionOccuranceCommand, goToTransactionStartCommand, goToTransactionEndCommand, debugCurrentTransactionCommand } from './commands';
import { TracetoolTreeDataProvider, getBookmarksChildren, getTransactionPolicyListChildren, getTraceNavigationChildren, getTransactionListChildren } from './tracetoolTreeDataProvider';

export function activate(context: ExtensionContext) {

	// View providers
	//const fwvp = new FindWebviewViewProvider(context.extensionUri);
	const ntvp = new TracetoolTreeDataProvider(getTraceNavigationChildren);
	const tltvp = new TracetoolTreeDataProvider(getTransactionListChildren, true);
	const pltvp = new TracetoolTreeDataProvider(getTransactionPolicyListChildren, true);
	const btvp = new TracetoolTreeDataProvider(getBookmarksChildren);
	const swvp = new StatsWebviewViewProvider(context.extensionUri);

	//const rfwvp =	window.registerWebviewViewProvider('trace-find', fwvp);
	const rntvp = window.registerTreeDataProvider('trace-navigation', ntvp);
	const rtltvp =	window.registerTreeDataProvider('trace-transactionList', tltvp);
	const rpltvp = window.registerTreeDataProvider('transaction-policyList', pltvp);
	const rbtvp = window.registerTreeDataProvider('trace-bookmarks', btvp);
	const rswvp =	window.registerWebviewViewProvider('trace-stats', swvp);

	context.subscriptions.push(rtltvp, rntvp, rpltvp, rbtvp, rswvp);

	// Commands
	const abc = commands.registerCommand('tracetool.addBookmark', showInputBox);
	const poc = commands.registerCommand('tracetool.previousOccurance', (item) => previousOccuranceCommand(item));
	const noc = commands.registerCommand('tracetool.nextOccurance', (item) => nextOccuranceCommand(item));
	const eoc = commands.registerCommand('tracetool.transactionOccurance', (item) => currentTransactionOccuranceCommand(item));
	const gtc = commands.registerCommand('tracetool.goToTransactionStart', (item) => goToTransactionStartCommand(item));
	const gtbc = commands.registerCommand('tracetool.goToTransactionEnd', (item) => goToTransactionEndCommand(item));
	const dctc = commands.registerCommand('tracetool.debugCurrentTransaction', () => debugCurrentTransactionCommand());

	context.subscriptions.push(abc, poc, noc, eoc, gtc, gtbc, dctc);

	// Events
	
}

export function deactivate() {

}
