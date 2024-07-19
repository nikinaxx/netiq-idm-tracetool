import { TreeDataProvider, TreeItem, TreeItemCollapsibleState} from 'vscode';
import { Event, TracetoolManager } from './tracetoolManager';

export class EventListTreeDataProvider implements TreeDataProvider<EventListItem> {

    constructor() {

    }

    getTreeItem(element: EventListItem): TreeItem {
        return element;
    }

    getChildren(element?: EventListItem): Thenable<EventListItem[]> {
        const tracetoolManager = TracetoolManager.instance;
        tracetoolManager.getAllEvents();
        const eventList = element ? element.event.children : tracetoolManager.events;
        
        let eventListItem: EventListItem[] = [];
        eventList.forEach(event => {
            eventListItem.push(new EventListItem("Transaction "+event.types[0], "regex", event));
        });
        return Promise.resolve(eventListItem);
    }
}

export class EventListItem extends TreeItem {
    public searchRegex: string;
    public event: Event;

    constructor(public readonly label: string, searchRegex: string, event: Event) {
        super(label, event.children.length > 0 ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None);
        this.contextValue = 'EventListItem'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
        this.event = event;
    }
}