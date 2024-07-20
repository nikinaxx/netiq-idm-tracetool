import { TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import * as rf from './regexFunctions';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';
import { getLineStartIndex, getLineEndIndex} from './commands';

export class TracetoolManager
{
    private static _instance: TracetoolManager;

    private _currentPosition: number;
    private _allTransactions: Transaction[];
    private _currentTransaction: Transaction|undefined;

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
        this._currentPosition = value;
    }

    public get allTransactions() {
        this._allTransactions = this.getAllTransactions();
        return this._allTransactions;
    }
    public set allTransactions(value: Transaction[]) {
        this._allTransactions = value;
    }

    public get currentTransaction() {
        this._currentTransaction = this.getCurrentTransaction();
        return this._currentTransaction;
    }

    private getAllTransactions() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {return [];} 

        const text = activeEditor.document.getText();
        const allTransactionEdges = rf.findAllMatches(text, "Start transaction\|End transaction\|Discarding transaction");

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
            if (currentEdge[0] === 'End transaction' || currentEdge[0] === 'Discarding transaction') {
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
        return transactions;
    }

    private getCurrentTransaction() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return undefined;
        }
        let currentTransactionList = this.allTransactions.filter(e => 
            e.startIndex && 
            e.endIndex && 
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
        if (!this.startIndex || !this.endIndex) { 
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

        // Find first <nds></nds>
        const match = rf.getFirstOccurance(this.text, "<nds.+>(.|\\n)+?</nds>");
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