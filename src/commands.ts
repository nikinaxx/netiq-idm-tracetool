import { window, Position, Range, Uri, OverviewRulerLane, ThemeColor, TextEditorDecorationType, DecorationRenderOptions } from 'vscode';

function createGutterRulerDecoration(
    overviewRulerLane?: OverviewRulerLane,
    overviewRulerColor?: string | ThemeColor,
    gutterIconPath?: string | Uri): TextEditorDecorationType {

    const decorationOptions: DecorationRenderOptions = {
        gutterIconPath,
        overviewRulerLane,
        overviewRulerColor
    };

    decorationOptions.isWholeLine = false;

    return window.createTextEditorDecorationType(decorationOptions);
}

function createLineDecoration(): TextEditorDecorationType {
    const decorationOptions: DecorationRenderOptions = {};
    return window.createTextEditorDecorationType(decorationOptions);
}

interface TextEditorDecorationTypePair {
    gutterDecoration: TextEditorDecorationType;
    lineDecoration: TextEditorDecorationType;
}

function createBookmarkDecorations(): TextEditorDecorationTypePair[] {
    const decorators: TextEditorDecorationTypePair[] = [];
    for (let number = 0; number <= 9; number++) {
        const iconFillColor = "green";
    	const iconNumberColor = "black";
		const iconPath = Uri.parse(
            `data:image/svg+xml,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg"> <g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1"> <g fill="${iconFillColor}" stroke="null"><path d="M5.573914546804859,0.035123038858889274 C4.278736002284275,0.035123038858889274 3.228793828301391,0.9189688905396587 3.228793828301391,2.005394862080541 L3.228793828301391,15.844184705765102 L7.923495246522241,11.89191599548129 L12.618212313799981,15.844184705765102 L12.618212313799981,2.005394862080541 C12.618212313799981,0.9172430665361684 11.56845792849979,0.035123038858889274 10.273075946239627,0.035123038858889274 L5.573898897747966,0.035123038858889274 L5.573914546804859,0.035123038858889274 z" stroke="null"></path></g> </g> <text text-anchor="middle" alignment-baseline="middle" x="7.6" y="7.5" fill="${iconNumberColor}" font-weight="bold" font-size="9" font-family="Menlo, Monaco, monospace">${number}</text> </svg>`,
            )}`,
        );
        
        const overviewRulerColor = new ThemeColor('numberedBookmarks.overviewRuler');
        const lineBackground = new ThemeColor('numberedBookmarks.lineBackground');
        const lineBorder = new ThemeColor('numberedBookmarks.lineBorder');

        const gutterDecoration = createGutterRulerDecoration(OverviewRulerLane.Full, overviewRulerColor, iconPath);
        const lineDecoration = createLineDecoration();//lineBackground, lineBorder);
        decorators.push( { gutterDecoration, lineDecoration });
    }
    return decorators;
}

/**
 * Shows an input box using window.showInputBox().
 */
export async function showInputBox() {
	const activeEditor = window.activeTextEditor;
	if (!activeEditor) {
		window.showErrorMessage('No active editor');
		return;
	}

	const bookmarkComment = await window.showInputBox({
		placeHolder: 'Enter bookmark comment'
	});

	if (!bookmarkComment) {
		window.showErrorMessage('Please provide comment');
		return;
	}

	const bookmarkString = "Tracetool bookmark - " + bookmarkComment;

	const selection = activeEditor.selection;
	const position = new Position(selection.start.line, 0);

	// editor.edit(editBuilder => {
	// 	editBuilder.insert(position, bookmarkString);
	// });

	const number = 2;
	const decorators = createBookmarkDecorations();
	const decorator = decorators[number];

	const decoration = { range: new Range(position, position) };
	activeEditor.setDecorations(decorator.gutterDecoration, [decoration]);
}
