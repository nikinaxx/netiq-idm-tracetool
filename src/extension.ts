import { ExtensionContext, window, commands } from 'vscode';
import { FindWebviewViewProvider } from './traceFind';
import { TransactionListTreeDataProvider } from './traceTransactionList';
import { NavigationTreeDataProvider } from './traceNavigation';
import { PolicyListTreeDataProvider } from './tracePolicyList';
import { BookmarksTreeDataProvider } from './traceBookmarks';
import { StatsWebviewViewProvider } from './traceStats';
import { showInputBox, nextOccuranceCommand, previousOccuranceCommand, currentEventOccuranceCommand, goToTransactionCommand } from './commands';

export function activate(context: ExtensionContext) {

	// View providers
	//const fwvp = new FindWebviewViewProvider(context.extensionUri);
	const ntvp = new NavigationTreeDataProvider();
	const pltvp = new PolicyListTreeDataProvider();
	const tltvp = new TransactionListTreeDataProvider();
	const btvp = new BookmarksTreeDataProvider();
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
	const gtoc = commands.registerCommand('tracetool.goToTransaction', (item) => goToTransactionCommand(item));

	context.subscriptions.push(abc, poc, noc, eoc);

	// Events
	
}

export function deactivate() {

}
