import { TreeDataProvider, TreeItem } from 'vscode';
import { TracetoolTreeItem } from './tracetoolManager';

export class NavigationTreeDataProvider implements TreeDataProvider<TracetoolTreeItem> {
    
    private items: TracetoolTreeItem[];

    constructor() {
        this.items = [
            new TracetoolTreeItem('Transaction', 'Start transaction'),
            new TracetoolTreeItem('Policy', 'Applying policy'),
            new TracetoolTreeItem('Rule', 'Applying rule'),
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