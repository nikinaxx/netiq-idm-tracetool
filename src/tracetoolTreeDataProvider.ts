import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, workspace } from 'vscode';
import { TracetoolManager, Transaction } from './tracetoolManager';
import { formatTimestamp as formatTimestamp } from './commands';
import * as rf from './regexFunctions';

export class TracetoolTreeDataProvider implements TreeDataProvider<TracetoolTreeItem> {

    private _builderFunction: (element?: TracetoolTreeItem) => Thenable<TracetoolTreeItem[]>;

    private _refreshOnChanges: boolean;
    private _onDidChangeTreeData: EventEmitter<TracetoolTreeItem | undefined | void> = new EventEmitter<TracetoolTreeItem | undefined | void>();
    readonly onDidChangeTreeData: Event<TracetoolTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(builderFunction: (element?: TracetoolTreeItem) => Thenable<TracetoolTreeItem[]>, refreshOnChanges: boolean = false) {
        this._builderFunction = builderFunction;
        this._refreshOnChanges = refreshOnChanges;
        
        window.onDidChangeActiveTextEditor(() => this.refresh());
        workspace.onDidChangeTextDocument(() => this.refresh());
    }

    getTreeItem(element: TracetoolTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
        return this._builderFunction(element);
    }

    refresh(): void {
        if (!this._refreshOnChanges) {
            return;
        }
        this._onDidChangeTreeData.fire();
    }
}

export class TracetoolTreeItem extends TreeItem {
    public searchRegex: string;
    public transaction: Transaction|undefined;

    constructor(public readonly labelText: string, searchRegex: string, transaction?: Transaction, descriptionText?: string) {
        super(labelText, transaction && transaction.children && transaction.children.length > 0 ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None);
        this.contextValue = 'tracetool-tree-item'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
        this.transaction = transaction;
        this.description = descriptionText;
    }
}

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
    
    const transactionList = element && element.transaction ? element.transaction.children : tracetoolManager.allTransactions;
    
    let transactionListItem: TracetoolTreeItem[] = [];
    transactionList.forEach(transaction => {
        const formattedTimestamp = formatTimestamp(transaction.startTimestamp);
        const description = transaction.eventTypes.join(' ');
        transactionListItem.push(new TracetoolTreeItem(formattedTimestamp, transaction.startTimestamp, transaction, description));
    });
    return Promise.resolve(transactionListItem);
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