import * as vscode from 'vscode';

export class TodoFileDecorationProvider implements vscode.FileDecorationProvider {
    provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
        // Los TODOs usan el esquema 'todo' con el tipo en el query
        if (uri.scheme === 'todo') {
            const params = new URLSearchParams(uri.query);
            const type = params.get('type');

            if (type) {
                const colorMap: { [key: string]: string } = {
                    'TODO': 'todoTree.todoForeground',
                    'FIXME': 'todoTree.fixmeForeground',
                    'NOTE': 'todoTree.noteForeground',
                    'HACK': 'todoTree.hackForeground',
                    'XXX': 'todoTree.xxxForeground'
                };

                const colorKey = colorMap[type.toUpperCase()];
                if (colorKey) {
                    return {
                        color: new vscode.ThemeColor(colorKey),
                        tooltip: type
                    };
                }
            }
        }
        return null;
    }
}

