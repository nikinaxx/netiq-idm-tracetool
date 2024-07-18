import * as vscode from 'vscode';

export class BookmarksTreeDataProvider implements vscode.TreeDataProvider<Bookmark> {
    private items: Bookmark[];

    constructor() {
        this.items = [
            new Bookmark('Bookmark 1'),
            new Bookmark('Bookmark 1'),
            new Bookmark('Bookmark 1'),
            new Bookmark('Bookmark 1')
        ];
    }

    getTreeItem(element: Bookmark): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Bookmark): Thenable<Bookmark[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.items);
        }
    }
}

export class Bookmark extends vscode.TreeItem {
    constructor(public readonly label: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'myTreeItem'; // Used for custom commands if needed
        this.command = undefined; // Make item non-clickable
    }
}