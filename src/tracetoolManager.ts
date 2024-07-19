import { TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import * as rf from './regexFunctions';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';
import { getLineStartIndex, getLineEndIndex} from './commands';

export class TracetoolManager
{
    private static _instance: TracetoolManager;

    private _currentPosition: number;
    private _events: Event[];
    private _currentEvent: Event|undefined;

    private constructor()
    {
        this._currentPosition = 0;
        this._events = [];
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

    public get events() {
        this._events = this.getAllEvents();
        return this._events;
    }
    public set events(value: Event[]) {
        this._events = value;
    }

    public get currentEvent() {
        this._events = this.getAllEvents();
        this._currentEvent = this.getCurrentEvent();
        return this._currentEvent;
    }

    private getAllEvents() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {return [];} 

        const text = activeEditor.document.getText();
        const allEventEdges = rf.findAllMatches(text, "Start transaction\|End transaction\|Discarding transaction");

        return this.calculateEventsFromEdges(allEventEdges);
    }

    private calculateEventsFromEdges(allEventEdges: RegExpMatchArray[]) {
        let events: Event[] = [];
        let currentOpenEvents: Event[] = [];
        for (let i = 0; i < allEventEdges.length; i++) {
            const currentEdge = allEventEdges[i];
            if(!currentEdge.index){continue;}
            if (currentEdge[0] === 'Start transaction') {
                const lineStartIndex = getLineStartIndex(currentEdge.index);
                const event = new Event(lineStartIndex, undefined);
                if (currentOpenEvents.length > 0) {
                    currentOpenEvents[currentOpenEvents.length-1].children.push(event);
                } else {
                    events.push(event);
                }
                currentOpenEvents.push(event);
            }
            if (currentEdge[0] === 'End transaction' || currentEdge[0] === 'Discarding transaction') {
                const lineEndIndex = getLineEndIndex(currentEdge.index);
                if (currentOpenEvents.length > 0) {
                    const currentOpenEvent = currentOpenEvents[currentOpenEvents.length-1];
                    currentOpenEvent.endIndex = lineEndIndex;
                    currentOpenEvents.pop();
                } else {
                    const event = new Event(undefined, lineEndIndex);
                    events.push(event);
                }
            }
        }
        return events;
    }

    private getCurrentEvent() {
        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
            return undefined;
        }
        let currentEventsList = this.events.filter(e => 
            e.startIndex && 
            e.endIndex && 
            e.startIndex < this.currentPosition && this.currentPosition < e.endIndex
        );
        if (currentEventsList.length === 0) {
            return undefined;
        }
        return currentEventsList[currentEventsList.length-1];
    }
}

export class Event {
    public startIndex: number|undefined = undefined;
    public endIndex: number|undefined = undefined;
    public children: Event[] = [];
    private _text: string = "";
    private _eventXML: Document|undefined = undefined;
    private _types: string[] = [];
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
    public get eventXML() {
        this._eventXML = this.extractEventXMLFromEventText();
        return this._eventXML;
    }
    public get types() {
        this._types = this.extractEventTypesFromEventXML();
        return this._types;
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

    private extractEventXMLFromEventText() {
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

    private extractEventTypesFromEventXML() {
        if (!this.eventXML) {
            return [];
        }

        // Extract all event types
        const eventTypes = xpath.select('/nds/input/*', this.eventXML) as Node[];
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

export class TracetoolTreeItem extends TreeItem {
    public searchRegex: string;
    public event: Event|undefined;

    constructor(public readonly label: string, searchRegex: string, event?: Event) {
        super(label, event && event.children && event.children.length > 0 ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None);
        this.contextValue = 'tracetool-tree-item'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
        this.event = event;
    }
}