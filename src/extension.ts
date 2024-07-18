import { ExtensionContext, window, commands, workspace } from 'vscode';
import { FindWebviewViewProvider } from './traceFind';
import { NavigationTreeDataProvider } from './traceNavigation';
import { PolicyListTreeDataProvider } from './tracePolicyList';
import { BookmarksTreeDataProvider } from './traceBookmarks';
import { StatsWebviewViewProvider } from './traceStats';
import { showInputBox } from './commands';
import * as fs from 'fs';

export function activate(context: ExtensionContext) {

	// View providers
	const fwvp = new FindWebviewViewProvider(context.extensionUri);
	const ntvp = new NavigationTreeDataProvider();
	const pltvp = new PolicyListTreeDataProvider();
	const btvp = new BookmarksTreeDataProvider();
	const swvp = new StatsWebviewViewProvider(context.extensionUri);

	const rfwvp =	window.registerWebviewViewProvider('trace-find', fwvp);
	const rntvp = window.registerTreeDataProvider('trace-navigation', ntvp);
	const rpltvp = window.registerTreeDataProvider('trace-policyList', pltvp);
	const rbtvp = window.registerTreeDataProvider('trace-bookmarks', btvp);
	const rswvp =	window.registerWebviewViewProvider('trace-stats', swvp);

	context.subscriptions.push(rfwvp, rntvp, rpltvp, rbtvp, rswvp);

	// Commands
	const addBookmarkCommand = commands.registerCommand('tracetool.addBookmark', showInputBox);
	const previousOccuranceCommand = commands.registerCommand('tracetool.previousOccurance', (item) => ntvp.previousOccuranceCommand(item));
	const nextOccuranceCommand = commands.registerCommand('tracetool.nextOccurance', (item) => ntvp.nextOccuranceCommand(item));

	context.subscriptions.push(addBookmarkCommand, previousOccuranceCommand, nextOccuranceCommand);

	// Events
	
}

export function deactivate() {

}
