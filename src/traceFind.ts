import * as vscode from 'vscode';

export class FindWebviewViewProvider implements vscode.WebviewViewProvider {

	private _view?: vscode.WebviewView;
	private readonly _extensionUri: vscode.Uri;

	constructor(extensionUri: vscode.Uri) {
		this._extensionUri = extensionUri;
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
				case 'btnFindPressed': {
					this.buttonFindPressed(message.searchString);
					break;
				}
			}
		});
	}

	private buttonFindPressed(searchTerm: string) {
		const editor = vscode.window.activeTextEditor;
        if (editor) {
			const decorationType = vscode.window.createTextEditorDecorationType({
				backgroundColor: 'rgba(255, 0, 0, 0.3)', // Background color for the highlighted matches
			});
			const decorations: vscode.Range[] = [];

            const text = editor.document.getText();
            const regex = new RegExp(this.escapeRegExp(searchTerm), "g");
			const matches = text.matchAll(regex);

			if (!this._view) { return; }
			this._view.webview.postMessage({ command: 'showNumFindResults', resultsLength: [...matches].length });
			// !!!!!!!!!!!!!!!!!!!!!!!!!! izvede se eno ali drugo... ker iteriramo pridemo do konca iteratorja in drugič nemormo od začetka
			for (const match of matches) {
				// console.log(match);
				if (typeof match.index === "undefined"){ continue; }
				let decorationRange = new vscode.Range(
					editor.document.positionAt(match.index),
					editor.document.positionAt(match.index + match[0].length)
				);
				decorations.push(decorationRange);
			}
			
			editor.setDecorations(decorationType, decorations);
        }
	}

	private escapeRegExp(regex: string) {
		return regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'findWebview.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'findWebview.css'));

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
                <input id="input-find" type="text" placeholder="Enter text">
				<button id="button-find" class="button">Find</button>
				<p id="num-find-results">Results: </p>
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