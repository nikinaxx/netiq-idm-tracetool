import { TreeDataProvider, TreeItem, TreeItemCollapsibleState } from 'vscode';

export class NavigationTreeDataProvider implements TreeDataProvider<NavigationItem> {
    
    private items: NavigationItem[];

    constructor() {
        this.items = [
            new NavigationItem('Transaction', 'Start transaction'),
            new NavigationItem('Policy', 'Applying policy'),
            new NavigationItem('Rule', 'Applying rule'),
            new NavigationItem('Query result', 'from policy result\\\\|Read result') // escape regex by \\ and escape that to use in string by \\
        ];
    }

    getTreeItem(element: NavigationItem): TreeItem {
        return element;
    }

    getChildren(element?: NavigationItem): Thenable<NavigationItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.items);
        }
    }

}

export class NavigationItem extends TreeItem {
    public searchRegex: string;

    constructor(public readonly label: string, searchRegex: string) {
        super(label, TreeItemCollapsibleState.None);
        this.contextValue = 'navigationItem'; // Used for "when" condition in package.json
        this.command = undefined; // Make item non-clickable
        this.searchRegex = searchRegex;
    }
}