import {window, TreeDataProvider, TreeItem, TreeItemCollapsibleState, TextEditorRevealType, Range, Selection} from 'vscode';
import * as rf from './regexFunctions';

export class NavigationTreeDataProvider implements TreeDataProvider<NavigationItem> {
    
    private _currentPosition: number;
    private items: NavigationItem[];

    constructor() {
        this._currentPosition = 0;

        this.items = [
            new NavigationItem('Transaction', 'Start transaction'),
            new NavigationItem('Policy', 'Applying policy'),
            new NavigationItem('Rule', 'Applying rule'),
            new NavigationItem('Query result', 'from policy result\\\\|Read result') // escape regex by \\ and escape that to use in string by \\
        ];
    }

    getTreeItem(element: NavigationItem): TreeItem {
        return element;
    }

    getChildren(element?: NavigationItem): Thenable<NavigationItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.items);
        }
    }

    public previousOccuranceCommand(item: NavigationItem) {
        if (!item.searchRegex) {return;}
        this.goToOccurance(item.searchRegex, rf.getPrevOccurance);
        console.log(this._currentPosition);
    }
    
    public nextOccuranceCommand(item: NavigationItem) {
        if (!item.searchRegex) {return;}
        this.goToOccurance(item.searchRegex, rf.getNextOccurance);
        console.log(this._currentPosition);
    }

    private goToOccurance(searchTerm: string, matchFunction: (text: string, currentIndex: number, regexStr: string)=>RegExpExecArray|null) {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {return;} 
    
        const text = activeEditor.document.getText();

        const match = matchFunction(text, this._currentPosition, searchTerm);
        if (!match) { return; }

        const startPosition = activeEditor.document.positionAt(match.index);
        const endPosition = activeEditor.document.positionAt(match.index + match[0].length);

        // Select the match in the editor
        activeEditor.selection = new Selection(startPosition, endPosition);
        activeEditor.revealRange(new Range(startPosition, endPosition), TextEditorRevealType.InCenter);

        // Update the current position to start the next search from here
        this._currentPosition = match.index + match[0].length - 1; // -1 because same text will be matched if you change direction and you had to click twice
    }

}

export class NavigationItem extends TreeItem {
    public searchRegex: string;

    constructor(public readonly label: string, searchRegex: string) {
        super(label, TreeItemCollapsibleState.None);
        this.contextValue = 'navigationItem'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
    }
}