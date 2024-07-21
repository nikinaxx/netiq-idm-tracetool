import { window, Event, EventEmitter, workspace } from 'vscode';
import * as rf from './regexFunctions';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';
import { getLineStartIndex, getLineEndIndex} from './commands';

export class TracetoolManager
{
    private static _instance: TracetoolManager;

    private _currentPosition: number;
    private _onCurrentPositionChanged: EventEmitter<number|undefined|void> = new EventEmitter<number|undefined|void>();
    readonly onCurrentPositionChanged: Event<number|undefined|void> = this._onCurrentPositionChanged.event;

    private _allTransactions: Transaction[];

    private _currentTransaction: Transaction|undefined;
    private _onCurrentTransactionChanged: EventEmitter<Transaction|undefined|void> = new EventEmitter<Transaction|undefined|void>();
    readonly onCurrentTransactionChanged: Event<Transaction|undefined|void> = this._onCurrentTransactionChanged.event;

    private constructor()
    {
        this._currentPosition = 0;
        this._allTransactions = [];
    }

    public static get instance() {
        if (!this._instance) {
            this._instance = new this();
        }
        return this._instance;
    }

    public get currentPosition() {
        return this._currentPosition;
    }
    public set currentPosition(value: number) {
        if (this._currentPosition !== value) {
            this._currentPosition = value;
            this._onCurrentPositionChanged.fire();
            // Check if current transaction has changed
            this.currentTransaction = this.findCurrentTransaction();
        }
    }

    public get allTransactions() {
        this._allTransactions = this.findAllTransactions();
        return this._allTransactions;
    }

    public get currentTransaction() {
        this._currentTransaction = this.findCurrentTransaction();
        return this._currentTransaction;
    }
    public set currentTransaction(value: Transaction|undefined) {
        if (this._currentTransaction !== value) {
            this._currentTransaction = value;
            this._onCurrentTransactionChanged.fire(value);
        }
    }

    private findAllTransactions() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {return [];} 

        const transactionEdgeRegex = workspace.getConfiguration('tracetool').get<string>('regex.transactionEdge');
        if (!transactionEdgeRegex) {
            window.showErrorMessage("Setting 'regex.transactionEdge' is undefined");
            return []; 
        }

        const text = activeEditor.document.getText();
        const allTransactionEdges = rf.findAllMatches(text, transactionEdgeRegex); // v regex \|Discarding transaction to spada pod spodnji TODO

        return this.calculateTransactionsFromEdges(allTransactionEdges);
    }

    private calculateTransactionsFromEdges(allTransactionEdges: RegExpMatchArray[]) {
        let transactions: Transaction[] = [];
        let currentOpenTransactions: Transaction[] = [];
        for (let i = 0; i < allTransactionEdges.length; i++) {
            const currentEdge = allTransactionEdges[i];
            if(!currentEdge.index){continue;}
            if (currentEdge[0] === 'Start transaction') {
                const lineStartIndex = getLineStartIndex(currentEdge.index);
                const transaction = new Transaction(lineStartIndex, undefined);
                if (currentOpenTransactions.length > 0) {
                    currentOpenTransactions[currentOpenTransactions.length-1].children.push(transaction);
                } else {
                    transactions.push(transaction);
                }
                currentOpenTransactions.push(transaction);
            }
            // TODO: Ugotovi ali se lahko transaction kdaj konča z discarding in da nima End transaction
            if (currentEdge[0] === 'End transaction') { // || currentEdge[0] === 'Discarding transaction'
                const lineEndIndex = getLineEndIndex(currentEdge.index);
                if (currentOpenTransactions.length > 0) {
                    const currentOpenTransaction = currentOpenTransactions[currentOpenTransactions.length-1];
                    currentOpenTransaction.endIndex = lineEndIndex;
                    currentOpenTransactions.pop();
                } else {
                    const transaction = new Transaction(undefined, lineEndIndex);
                    transactions.push(transaction);
                }
            }
        }

        // Fix first and last transaction indexes
        if (transactions.length >= 2) {
            if (transactions[0].startIndex === undefined) {
                transactions[0].startIndex = 0;
            }
            if (transactions[transactions.length-1].endIndex === undefined) {
                const activeEditor = window.activeTextEditor;
                if (activeEditor !== undefined) {
                    const text = activeEditor.document.getText();
                    transactions[transactions.length-1].endIndex = text.length - 1;
                } 
            }
        }

        return transactions;
    }

    private findCurrentTransaction() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return undefined;
        }
        let currentTransactionList = this.allTransactions.filter(e => 
            e.startIndex !== undefined && 
            e.endIndex !== undefined && 
            e.startIndex < this.currentPosition && this.currentPosition < e.endIndex
        );
        if (currentTransactionList.length === 0) {
            return undefined;
        }
        return currentTransactionList[currentTransactionList.length-1];
    }
}

export class Transaction {
    public startIndex: number|undefined = undefined;
    public endIndex: number|undefined = undefined;
    public children: Transaction[] = [];
    private _text: string = "";
    private _xml: Document|undefined = undefined;
    private _eventTypes: string[] = [];
    private _policies: string[] = [];
    private _startTimestamp: string|undefined = undefined;
    private _endTimestamp: string|undefined = undefined;

    constructor (startIndex?: number, endIndex?: number) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }

    public get text() {
        this._text = this.extractTextFromDocument();
        return this._text;
    }
    public get xml() {
        this._xml = this.extractXMLFromText();
        return this._xml;
    }
    public get eventTypes() {
        this._eventTypes = this.extractTypesFromXML();
        return this._eventTypes;
    }
    public get policies() {
        this._policies = rf.uniqueMatches(this.text, "(?<=Applying policy:) %\\+C%14C(.*)%-C", 1);
        return this._policies;
    }
    public get startTimestamp() {
        const timestampMatches = rf.matchTraceTimestamps(this.text);
        if (timestampMatches.length === 0) {
            return "xx/xx/xx xx:xx:xx.xxx";
        }
        this._startTimestamp = timestampMatches[0][1]; // first match group 1 (timestamp without brackets)
        return this._startTimestamp;
    }
    public get endTimestamp() {
        const timestampMatches = rf.matchTraceTimestamps(this.text);
        if (timestampMatches.length === 0) {
            return "xx/xx/xx xx:xx:xx.xxx";
        }
        this._endTimestamp = timestampMatches[timestampMatches.length-1][1]; // last match group 1 (timestamp without brackets)
        return this._endTimestamp;
    }

    private extractTextFromDocument() {
        if (this.startIndex === undefined || this.endIndex === undefined)  { 
            return "";
        }

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return "";
        }

        const text = activeEditor.document.getText();
        const eventText = text.substring(this.startIndex, this.endIndex);

        return eventText || "";
    }

    private extractXMLFromText() {
        if (this.text === "") {
            return undefined;
        }

        const firstNdsRegex = workspace.getConfiguration('tracetool').get<string>('regex.firstNds');
        if (!firstNdsRegex) {
            window.showErrorMessage("Setting 'regex.firstNds' is undefined");
            return undefined; 
        }

        // Find first <nds></nds>
        const match = rf.getFirstOccurance(this.text, firstNdsRegex);
        if (!match || !match[0]) {
            return undefined;
        }

        // Parse xml text to xml document
        const ndsDocument = new DOMParser().parseFromString(match[0], 'text/xml');

        return ndsDocument;
    }

    private extractTypesFromXML() {
        if (!this.xml) {
            return [];
        }

        // Extract all event types
        const eventTypes = xpath.select('/nds/input/*', this.xml) as Node[];
        if (!eventTypes) {
            return [];
        }

        let typeList: string[] = [];
        eventTypes.forEach((eventType: any) => {
            typeList.push("<"+eventType.nodeName+">");
        });

        return typeList;
    }
}