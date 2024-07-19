import {window, TreeDataProvider, TreeItem } from 'vscode';
import * as rf from './regexFunctions';
import { TracetoolTreeItem } from './tracetoolManager';

export class PolicyListTreeDataProvider implements TreeDataProvider<TracetoolTreeItem> {
    
    private items: TracetoolTreeItem[];

    constructor() {
        this.items = [];
    }

    getTreeItem(element: TracetoolTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
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

        let items: TracetoolTreeItem[] = [];
        uniquePolicies.forEach(policyName => {
            items.push(new TracetoolTreeItem(policyName, policyName));
        });

        this.items = items;
    }
}