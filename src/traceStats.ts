import * as vscode from 'vscode';
import * as rf from './regexFunctions';
import { TracetoolManager } from './tracetoolManager';


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
		const matches = rf.findAllMatches(text, "\\[(.*)\\]:"); // double slash escape regex in js

		if (matches.length > 0) {
			const firstMatch = matches[0][1]; //match 0, regex capturing group 1
			const lastMatch = matches[matches.length - 1][1]; //match last, regex capturing group 1
		
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
		const errorCount = rf.countMatches(text, "error");

		this._view.webview.postMessage({ command: 'refreshTotalErrorsStats', count: errorCount });
	}

	private refreshTransactionErrorsStats() {
		const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) { return; }
		if (!this._view) { return; }
		
		let errorCount = 0;
		
		const tracetoolManager = TracetoolManager.instance;
		if (tracetoolManager.currentEvent) {
			errorCount = rf.countMatches(tracetoolManager.currentEvent.text, "error");
		}

		this._view.webview.postMessage({ command: 'refreshTransactionErrorsStats', count: errorCount });
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
				<div>
					<p id="traceStartDate">Trace start: </p>
					<p id="traceEndDate">Trace end: </p>
					<p id="traceTotalErrors">Total errors: </p>
					<p id="traceTransactionErrors">Current transaction errors: </p>
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