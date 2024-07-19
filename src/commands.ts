import { window, Position, Range, Uri, OverviewRulerLane, ThemeColor, TextEditorDecorationType, DecorationRenderOptions, TextEditorRevealType, Selection } from 'vscode';
import * as rf from './regexFunctions';
import { TracetoolManager } from './tracetoolManager';
import { TracetoolTreeItem } from './tracetoolTreeDataProvider';

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

export function goToTransactionCommand(item: TracetoolTreeItem) {
    if (!item.event || !item.event.startIndex) {
        window.showErrorMessage('Item doesnt have an event or event start index');
        return;
    }
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;}
    
    const startPosition = activeEditor.document.positionAt(item.event.startIndex);
    const startLineText = activeEditor.document.lineAt(startPosition.line).text;
    const endPosition = activeEditor.document.positionAt(item.event.startIndex + startLineText.length);
    activeEditor.selection = new Selection(startPosition, endPosition);
    activeEditor.revealRange(new Range(startPosition, endPosition), TextEditorRevealType.AtTop);
}

export function currentEventOccuranceCommand(item: TracetoolTreeItem) {
    if (!item.searchRegex) {
        window.showErrorMessage('Item doesnt have regex');
        return;
    }
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;}
    const tracetoolManager = TracetoolManager.instance;
    const currentEvent = tracetoolManager.currentEvent;
    if (!currentEvent || ! currentEvent.startIndex) {
		window.showErrorMessage('No current event');
        return;
    }
    const text = currentEvent.text;
    const match = rf.getFirstOccurance(text, item.searchRegex);
    if (!match || !match.index) {
        window.showErrorMessage('No match');
        return;
    }
    match.index += currentEvent.startIndex;
    goToOccurance(match);
}

export function previousOccuranceCommand(item: TracetoolTreeItem) {
    if (!item.searchRegex) {
        window.showErrorMessage('Item doesnt have regex');
        return;
    }
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;}
	const tracetoolManager = TracetoolManager.instance;

    const text = activeEditor.document.getText();
    const match = rf.getPrevOccurance(text, tracetoolManager.currentPosition, item.searchRegex);
    goToOccurance(match);
}

export function nextOccuranceCommand(item: TracetoolTreeItem) {
    if (!item.searchRegex) {
        window.showErrorMessage('Item doesnt have regex');
        return;
    }
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;}
	const tracetoolManager = TracetoolManager.instance;

    const text = activeEditor.document.getText();
    const match = rf.getNextOccurance(text, tracetoolManager.currentPosition, item.searchRegex);
    goToOccurance(match);
}

function goToOccurance(match: RegExpMatchArray|null) {
    if (!match || !match.index) {return;}
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;}
	const tracetoolManager = TracetoolManager.instance;

    const startPosition = activeEditor.document.positionAt(match.index);
    const endPosition = activeEditor.document.positionAt(match.index + match[0].length);

    // Select the match in the editor
    activeEditor.selection = new Selection(startPosition, endPosition);
    activeEditor.revealRange(new Range(startPosition, endPosition), TextEditorRevealType.InCenter);

    // Update the current position to start the next search from here
    tracetoolManager.currentPosition = match.index + match[0].length - 1; // -1 because same text will be matched if you change direction and you had to click twice
}

export function getLineStartIndex(index: number) {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;} 
    const position = activeEditor.document.positionAt(index);
    const lineStartPosition = new Position(position.line, 0);
    return activeEditor.document.offsetAt(lineStartPosition);
}

export function getLineEndIndex(index: number) {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {return;} 
    const position = activeEditor.document.positionAt(index);
    const lineStartPosition = new Position(position.line, 0);
    const lineText = activeEditor.document.lineAt(position.line).text;
    const lineStartIndex = activeEditor.document.offsetAt(lineStartPosition);
    return lineStartIndex + lineText.length;
}

export function formatTimestamp(timestamp: string): string {
    // Split the date and time components
    const [datePart, timePart] = timestamp.split(' ');

    // Parse the date part in MM/DD/YY format
    const [month, day, year] = datePart.split('/').map(Number);

    // Format the date part as DD.MM.
    const formattedDate = `${day}.${month}.`;

    // Format the time part as HH:MM
    const [hours, minutes] = timePart.split(':');
    const formattedTime = `${hours}:${minutes}`;

    // Combine date and time
    return `${formattedDate} ${formattedTime}`;
}