import { TreeDataProvider, TreeItem } from 'vscode';
import { TracetoolTreeItem } from './tracetoolManager';

export class NavigationTreeDataProvider implements TreeDataProvider<TracetoolTreeItem> {
    
    private items: TracetoolTreeItem[];

    constructor() {
        this.items = [
            new TracetoolTreeItem('Start transaction', 'Start transaction'),
            new TracetoolTreeItem('Applying policy', 'Applying policy'),
            new TracetoolTreeItem('Applying rule', 'Applying rule'),
            new TracetoolTreeItem('Query result', 'from policy result\\\\|Read result'), // escape regex by \\ and escape that to use in string by \\
            new TracetoolTreeItem('Subscriber result', 'Submitting document to subscriber shim')
        ];
    }

    getTreeItem(element: TracetoolTreeItem): TreeItem {
        return element;
    }

    getChildren(element?: TracetoolTreeItem): Thenable<TracetoolTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.items);
        }
    }

}