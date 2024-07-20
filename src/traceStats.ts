import * as vscode from 'vscode';
import * as rf from './regexFunctions';
import { TracetoolManager } from './tracetoolManager';
import { formatTimestamp } from './commands';


export class StatsWebviewViewProvider implements vscode.WebviewViewProvider {

	private _view?: vscode.WebviewView;
	private readonly _extensionUri: vscode.Uri;

	constructor(extensionUri: vscode.Uri) {
		this._extensionUri = extensionUri;

		this.startAutoRefresh();
	}

	public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken,) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, "media"),
				vscode.Uri.joinPath(this._extensionUri, "out/compiled"),
			],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case "onInfo": {
					if (!message.value) { return; }
					vscode.window.showInformationMessage(message.value);
					break;
				}
				case "onError": {
					if (!message.value) { return; }
					vscode.window.showErrorMessage(message.value);
					break;
				}
			}
		});
	}

	private startAutoRefresh() {
		const refreshInterval = 1000; // Refresh every second (1000 milliseconds)
		setInterval(() => {
			this.refreshTraceStats();
			this.refreshTotalErrorsStats();
			this.refreshTransactionErrorsStats();
		}, refreshInterval);
	}

	private refreshTraceStats() {
		const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
		if (!this._view) { return; }

		const text = editor.document.getText();
		const matches = rf.matchTraceTimestamps(text);

		if (matches.length > 0) {
			let firstMatch = matches[0][1]; //match 0, regex capturing group 1
			let lastMatch = matches[matches.length - 1][1]; //match last, regex capturing group 1

			firstMatch = formatTimestamp(firstMatch);
			lastMatch = formatTimestamp(lastMatch);
		
			this._view.webview.postMessage({ command: 'refreshTraceStats', startDate: firstMatch, endDate: lastMatch });
		} else {
			this._view.webview.postMessage({ command: 'refreshTraceStats', startDate: "No information", endDate: "No information" });
		}
	}

	private refreshTotalErrorsStats() {
		const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }
		if (!this._view) { return; }

		const text = editor.document.getText();
		const warnCount = rf.countMatches(text, "warn");
		const errorCount = rf.countMatches(text, "error");
		const fatalount = rf.countMatches(text, "fatal");

		this._view.webview.postMessage({ command: 'refreshTotalErrorsStats', countWarn: warnCount, countError: errorCount, countFatal: fatalount });
	}

	private refreshTransactionErrorsStats() {
		const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) { return; }
		if (!this._view) { return; }
		
		let warnCount: number|string = 0;
		let errorCount: number|string = 0;
		let fatalount: number|string = 0;
		
		const tracetoolManager = TracetoolManager.instance;
		if (tracetoolManager.currentTransaction) {
			warnCount = rf.countMatches(tracetoolManager.currentTransaction.text, "warn");
			errorCount = rf.countMatches(tracetoolManager.currentTransaction.text, "error");
			fatalount = rf.countMatches(tracetoolManager.currentTransaction.text, "fatal");
		} else {
			warnCount = "No transaction";
			errorCount = "No transaction";
			fatalount = "No transaction";
		}

		this._view.webview.postMessage({ command: 'refreshTransactionErrorsStats', countWarn: warnCount, countError: errorCount, countFatal: fatalount });

	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'statsWebview.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'statsWebview.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<script nonce="${nonce}">
					const vscode = acquireVsCodeApi();
				</script>
			</head>
			<body>
				<div id="statContainer">
					<div class="statGroup">
						<div class="statRow">
							<p>Trace start:</p>
							<p id="traceStartDate"></p>
						</div>
						<div class="statRow">
							<p>Trace end:</p>
							<p id="traceEndDate"></p>
						</div>
					</div>

					<div class="statGroup">
						<p>Whole document</p>
						<div class="statRow">
							<p>warn:</p>
							<p id="traceTotalWarn"></p>
						</div>
						<div class="statRow">
							<p>error:</p>
							<p id="traceTotalErrors"></p>
						</div>
						<div class="statRow">
							<p>fatal:</p>
							<p id="traceTotalFatal"></p>
						</div>
					</div>

					<div class="statGroup">
						<p>Transaction</p>
						<div class="statRow">
							<p>warn:</p>
							<p id="traceTransactionWarn"></p>
						</div>
						<div class="statRow">
							<p>error:</p>
							<p id="traceTransactionErrors"></p>
						</div>
						<div class="statRow">
							<p>fatal:</p>
							<p id="traceTransactionFatal"></p>
						</div>
					</div>
				</div>
            </body>
            <script src="${scriptUri}" nonce="${nonce}"></script>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}