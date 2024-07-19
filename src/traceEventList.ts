import { TreeDataProvider, TreeItem} from 'vscode';
import { TracetoolManager, TracetoolTreeItem } from './tracetoolManager';
import { formatTimestamp as formatTimestamp } from './commands';

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
            const formattedTimestamp = formatTimestamp(event.startTimestamp);
            const label = formattedTimestamp + " " + event.types.join(' ');
            eventListItem.push(new TracetoolTreeItem(label, "regex", event));
        });
        return Promise.resolve(eventListItem);
    }
}