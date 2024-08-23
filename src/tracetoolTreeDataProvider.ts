import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState, window, workspace } from 'vscode';
import { TracetoolManager, Transaction } from './tracetoolManager';
import { formatTimestamp as formatTimestamp } from './commands';

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
        const tracetoolManager = TracetoolManager.instance;
        tracetoolManager.onCurrentTransactionChanged(() => this.refresh());
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
    public searchRegex: string|undefined;
    public transaction: Transaction|undefined;

    constructor(public readonly labelText: string, searchRegex?: string, transaction?: Transaction, descriptionText?: string) {
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
        const conf = workspace.getConfiguration('tracetool');
		const regexstartTransaction = conf.get<string>('regex.startTransaction');
		const regexapplyingPolicy = conf.get<string>('regex.applyingPolicy');
		const regexapplyingRule = conf.get<string>('regex.applyingRule');
		const regexqueryResult = conf.get<string>('regex.queryResult');
		const regexsubscriberResult = conf.get<string>('regex.subscriberResult');
		if (!regexstartTransaction || !regexapplyingPolicy || !regexapplyingRule || !regexqueryResult || !regexsubscriberResult) {
			window.showErrorMessage("Settings 'regex.startTransaction', 'regex.applyingPolicy', 'regex.applyingRule', 'regex.queryResult' or 'regex.subscriberResult' are undefined");
            return Promise.resolve([]);
		}

        const navItems = [
            new TracetoolTreeItem('Start transaction', regexstartTransaction),
            new TracetoolTreeItem('Applying policy', regexapplyingPolicy),
            new TracetoolTreeItem('Applying rule', regexapplyingRule),
            new TracetoolTreeItem('Query result', regexqueryResult),
            new TracetoolTreeItem('Subscriber result', regexsubscriberResult)
        ];
        return Promise.resolve(navItems);
    }
}

export function getTransactionPolicyListChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
    if (element) {
        return Promise.resolve([]);
    } else {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return Promise.resolve([new TracetoolTreeItem("No active editor")]);
        } 

        const tracetoolManager = TracetoolManager.instance;
        const currentTransaction = tracetoolManager.currentTransaction;
        if (!currentTransaction || !currentTransaction.policies) { 
            return Promise.resolve([new TracetoolTreeItem("No current transaction")]); 
        }

        let policyItems: TracetoolTreeItem[] = [];
        currentTransaction.policies.forEach(policyName => {
            const policyRegexStr = "(%\\+C%14C)(" + policyName + ")(%-C)";
            policyItems.push(new TracetoolTreeItem(policyName, policyRegexStr));
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