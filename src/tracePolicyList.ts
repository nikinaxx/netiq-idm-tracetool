import {window, TreeDataProvider, TreeItem, TreeItemCollapsibleState, TextEditorRevealType, Range, Selection} from 'vscode';
import * as rf from './regexFunctions';

export class PolicyListTreeDataProvider implements TreeDataProvider<PolicyListItem> {
    
    private _currentPosition: number;
    private items: PolicyListItem[];

    constructor() {
        this._currentPosition = 0;

        this.items = [];
    }

    getTreeItem(element: PolicyListItem): TreeItem {
        return element;
    }

    getChildren(element?: PolicyListItem): Thenable<PolicyListItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            this.getUniquePolicies();
            return Promise.resolve(this.items);
        }
    }

    private getUniquePolicies() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {return;} 
    
        const text = activeEditor.document.getText();
        const uniquePolicies = rf.uniqueMatches(text, "(?<=Applying policy:) %\\+C%14C(.*)%-C", 1);

        let items: PolicyListItem[] = [];
        uniquePolicies.forEach(policyName => {
            items.push(new PolicyListItem(policyName, policyName));
        });

        this.items = items;
    }

    public previousOccuranceCommand(item: PolicyListItem) {
        if (!item.searchRegex) {return;}
    }
    public nextOccuranceCommand(item: PolicyListItem) {
        if (!item.searchRegex) {return;}
    }
}

export class PolicyListItem extends TreeItem {
    public searchRegex: string;

    constructor(public readonly label: string, searchRegex: string) {
        super(label, TreeItemCollapsibleState.None);
        this.contextValue = 'PolicyListItem'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
    }
}