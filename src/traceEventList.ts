import { TreeDataProvider, TreeItem} from 'vscode';
import { TracetoolManager, TracetoolTreeItem } from './tracetoolManager';

export class EventListTreeDataProvider implements TreeDataProvider<TracetoolTreeItem> {

    constructor() {

    }

    getTreeItem(element: TracetoolTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
        const tracetoolManager = TracetoolManager.instance;
        
        const eventList = element && element.event ? element.event.children : tracetoolManager.events;
        
        let eventListItem: TracetoolTreeItem[] = [];
        eventList.forEach(event => {
            eventListItem.push(new TracetoolTreeItem("Transaction "+event.types[0], "regex", event));
        });
        return Promise.resolve(eventListItem);
    }
}