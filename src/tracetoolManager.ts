import { TreeItem, TreeItemCollapsibleState, window } from 'vscode';
import * as rf from './regexFunctions';

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
        const allEventEdges = rf.findAllMatches(text, "Start transaction\|End transaction");

        return this.calculateEventsFromEdges(allEventEdges);
    }

    private calculateEventsFromEdges(allEventEdges: RegExpMatchArray[]) {
        let events: Event[] = [];
        let currentOpenEvents: Event[] = [];
        for (let i = 0; i < allEventEdges.length; i++) {
            const currentEdge = allEventEdges[i];
            if (currentEdge[0] === 'Start transaction') {
                const event = new Event(currentEdge.index, undefined);
                if (currentOpenEvents.length > 0) {
                    currentOpenEvents[currentOpenEvents.length-1].children.push(event);
                } else {
                    events.push(event);
                }
                currentOpenEvents.push(event);
            }
            if (currentEdge[0] === 'End transaction') {
                if (currentOpenEvents.length > 0) {
                    const currentOpenEvent = currentOpenEvents[currentOpenEvents.length-1];
                    currentOpenEvent.endIndex = currentEdge.index;
                    currentOpenEvents.pop();
                } else {
                    const event = new Event(undefined, currentEdge.index);
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
    private _types: string[] = [];

    constructor (startIndex?: number, endIndex?: number) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }

    public get text() {
        this._text = this.extractTextFromDocument();
        return this._text;
    }
    public get types() {
        this._types = this.extractTypesFromEventText();
        return this._types;
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

    private extractTypesFromEventText() {
        if (this.text === "") {
            return [];
        }

        return ["add"];
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