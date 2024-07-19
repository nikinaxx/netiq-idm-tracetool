import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import { TracetoolManager, Event } from './tracetoolManager';
import { formatTimestamp as formatTimestamp } from './commands';
import * as rf from './regexFunctions';

export function getTraceNavigationChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
    if (element) {
        return Promise.resolve([]);
    } else {
        const navItems = [
            new TracetoolTreeItem('Start transaction', 'Start transaction'),
            new TracetoolTreeItem('Applying policy', 'Applying policy'),
            new TracetoolTreeItem('Applying rule', 'Applying rule'),
            new TracetoolTreeItem('Query result', 'from policy result\\\\|Read result'), // escape regex by \\ and escape that to use in string by \\
            new TracetoolTreeItem('Subscriber result', 'Submitting document to subscriber shim')
        ];
        return Promise.resolve(navItems);
    }
}

export function getPolicyListChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
    if (element) {
        return Promise.resolve([]);
    } else {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return Promise.resolve([]);
        } 
    
        const text = activeEditor.document.getText();
        const uniquePolicies = rf.uniqueMatches(text, "(?<=Applying policy:) %\\+C%14C(.*)%-C", 1);

        let policyItems: TracetoolTreeItem[] = [];
        uniquePolicies.forEach(policyName => {
            policyItems.push(new TracetoolTreeItem(policyName, policyName));
        });

        return Promise.resolve(policyItems);
    }
}

export function getTransactionListChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
    const tracetoolManager = TracetoolManager.instance;
    
    const eventList = element && element.event ? element.event.children : tracetoolManager.events;
    
    let eventListItem: TracetoolTreeItem[] = [];
    eventList.forEach(event => {
        const formattedTimestamp = formatTimestamp(event.startTimestamp);
        const description = event.types.join(' ');
        eventListItem.push(new TracetoolTreeItem(formattedTimestamp, event.startTimestamp, event, description));
    });
    return Promise.resolve(eventListItem);
}

export function getBookmarksChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
    if (element) {
        return Promise.resolve([]);
    } else {
        const bookmarkItems = [
            new TracetoolTreeItem('Bookmark 1', ""),
            new TracetoolTreeItem('Bookmark 2', ""),
            new TracetoolTreeItem('Bookmark 3', ""),
            new TracetoolTreeItem('Bookmark 4', ""),
            new TracetoolTreeItem('Bookmark 5', "")
        ];
        return Promise.resolve(bookmarkItems);
    }
}

export class TracetoolTreeDataProvider implements TreeDataProvider<TracetoolTreeItem> {

    private _builderFunction: (element?: TracetoolTreeItem) => Thenable<TracetoolTreeItem[]>;

    constructor(builderFunction: (element?: TracetoolTreeItem) => Thenable<TracetoolTreeItem[]>) {
        this._builderFunction = builderFunction;
    }

    getTreeItem(element: TracetoolTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
        return this._builderFunction(element);
    }
}

export class TracetoolTreeItem extends TreeItem {
    public searchRegex: string;
    public event: Event|undefined;

    constructor(public readonly labelText: string, searchRegex: string, event?: Event, descriptionText?: string) {
        super(labelText, event && event.children && event.children.length > 0 ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None);
        this.contextValue = 'tracetool-tree-item'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
        this.event = event;
        this.description = descriptionText;
    }
}