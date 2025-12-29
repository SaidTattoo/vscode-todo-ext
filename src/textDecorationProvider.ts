import * as vscode from 'vscode';

export class TodoTextDecorationProvider {
    private decorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private gutterDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private activeEditor: vscode.TextEditor | undefined;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.createDecorations();
        this.setupEventListeners();
    }

    /**
     * Genera un SVG Data URI para un icono de gutter
     */
    private createGutterIconSvg(codicon: string, color: string): vscode.Uri {
        // Crear SVG con formas simples basadas en el tipo de icono
        let svg = '';

        switch (codicon) {
            case 'check':
                // Checkmark (✓)
                svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M 3 8 L 6 11 L 13 4" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                break;
            case 'bug':
                // Bug icon (simplificado como círculo con puntos)
                svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" stroke="${color}" stroke-width="1.5" fill="none"/><circle cx="6" cy="6" r="1" fill="${color}"/><circle cx="10" cy="6" r="1" fill="${color}"/><path d="M 5 10 Q 8 12 11 10" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`;
                break;
            case 'note':
                // Note icon (documento)
                svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M 4 2 L 10 2 L 12 4 L 12 14 L 4 14 Z" stroke="${color}" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M 10 2 L 10 4 L 12 4" stroke="${color}" stroke-width="1.5" fill="none" stroke-linejoin="round"/><line x1="6" y1="7" x2="10" y2="7" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><line x1="6" y1="9" x2="10" y2="9" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
                break;
            case 'alert':
                // Alert/Warning icon (triángulo)
                svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M 8 2 L 14 14 L 2 14 Z" stroke="${color}" stroke-width="1.5" fill="none" stroke-linejoin="round"/><circle cx="8" cy="10" r="0.8" fill="${color}"/><line x1="8" y1="6" x2="8" y2="8" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
                break;
            case 'x':
                // X icon
                svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M 4 4 L 12 12 M 12 4 L 4 12" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
                break;
            default:
                // Círculo por defecto
                svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="${color}"/></svg>`;
        }

        const encoded = encodeURIComponent(svg);
        return vscode.Uri.parse(`data:image/svg+xml;charset=utf-8,${encoded}`);
    }

    /**
     * Obtiene el color por defecto para un tipo de TODO (para el SVG)
     */
    private getDefaultColorForType(type: string): string {
        const colorMap: { [key: string]: string } = {
            'TODO': '#4EC9B0',      // Cyan/Teal
            'FIXME': '#F48771',     // Red/Orange
            'NOTE': '#DCDCAA',      // Yellow
            'HACK': '#CE9178',      // Orange/Brown
            'XXX': '#F48771'        // Red
        };
        return colorMap[type.toUpperCase()] || '#808080';
    }

    /**
     * Obtiene el codicon para un tipo de TODO
     */
    private getCodiconForType(type: string): string {
        const iconMap: { [key: string]: string } = {
            'TODO': 'check',
            'FIXME': 'bug',
            'NOTE': 'note',
            'HACK': 'alert',
            'XXX': 'x'
        };
        return iconMap[type.toUpperCase()] || 'check';
    }

    private createDecorations(): void {
        // Limpiar decoraciones existentes
        this.disposeDecorations();

        // Mapear tipo a ID de color (debe coincidir exactamente con package.json)
        const colorIdMap: { [key: string]: string } = {
            'TODO': 'todoTree.todoForeground',
            'FIXME': 'todoTree.fixmeForeground',
            'NOTE': 'todoTree.noteForeground',
            'HACK': 'todoTree.hackForeground',
            'XXX': 'todoTree.xxxForeground'
        };

        // Crear decoraciones para colorear el texto
        Object.keys(colorIdMap).forEach(type => {
            const colorId = colorIdMap[type];
            const decorationType = vscode.window.createTextEditorDecorationType({
                color: new vscode.ThemeColor(colorId),
                fontWeight: 'normal',
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
            this.decorations.set(type.toUpperCase(), decorationType);
        });

        // Crear decoraciones para el gutter (iconos)
        Object.keys(colorIdMap).forEach(type => {
            const codicon = this.getCodiconForType(type);
            const defaultColor = this.getDefaultColorForType(type);
            const iconUri = this.createGutterIconSvg(codicon, defaultColor);

            const gutterDecorationType = vscode.window.createTextEditorDecorationType({
                gutterIconPath: iconUri,
                gutterIconSize: 'contain',
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            });
            this.gutterDecorations.set(type.toUpperCase(), gutterDecorationType);
        });
    }

    private disposeDecorations(): void {
        this.decorations.forEach(decoration => decoration.dispose());
        this.decorations.clear();
        this.gutterDecorations.forEach(decoration => decoration.dispose());
        this.gutterDecorations.clear();
    }

    private setupEventListeners(): void {
        // Actualizar todas las ventanas cuando cambia el editor activo
        const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
            this.activeEditor = editor;
            this.updateAllEditors();
        });

        // Actualizar cuando cambia el contenido del documento
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
            // Usar un pequeño delay para evitar actualizaciones excesivas mientras se escribe
            setTimeout(() => {
                this.updateAllEditors();
            }, 100);
        });

        // Actualizar cuando se abre un documento
        const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(() => {
            this.updateAllEditors();
        });

        this.disposables.push(onDidChangeActiveEditor, onDidChangeTextDocument, onDidOpenTextDocument);

        // Actualizar todos los editores al iniciar
        setTimeout(() => {
            this.updateAllEditors();
        }, 500);
    }

    private updateAllEditors(): void {
        vscode.window.visibleTextEditors.forEach(editor => {
            this.updateDecorations(editor);
        });
    }

    private async updateDecorations(editor: vscode.TextEditor): Promise<void> {
        const document = editor.document;

        // Limpiar todas las decoraciones primero (texto y gutter)
        this.decorations.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        this.gutterDecorations.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });

        const text = document.getText();
        const config = vscode.workspace.getConfiguration('todoTree');
        const patterns: any = config.get('patterns', {});
        const patternKeys = Object.keys(patterns);

        if (patternKeys.length === 0) {
            return;
        }

        const regexPattern = patternKeys.map(key => key).join('|');

        // Mapeo de tipos a colores
        const colorIdMap: { [key: string]: string } = {
            'TODO': 'todoTree.todoForeground',
            'FIXME': 'todoTree.fixmeForeground',
            'NOTE': 'todoTree.noteForeground',
            'HACK': 'todoTree.hackForeground',
            'XXX': 'todoTree.xxxForeground'
        };

        // Patrones para diferentes tipos de comentarios con soporte para autor
        const commentRegexes = [
            // Comentarios // con autor
            new RegExp(`//\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
            // Comentarios // sin autor
            new RegExp(`//\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
            // Comentarios # con autor
            new RegExp(`#\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
            // Comentarios # sin autor
            new RegExp(`#\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
            // Comentarios -- con autor
            new RegExp(`--\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
            // Comentarios -- sin autor
            new RegExp(`--\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
            // Comentarios /* */ con autor (puede estar en una línea o multi-línea)
            new RegExp(`/\\*\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*?)(?:\\s*\\*/)?`, 'i'),
            // Comentarios /* */ sin autor (puede estar en una línea o multi-línea)
            new RegExp(`/\\*\\s*(${regexPattern})\\s*:?\\s*(.*?)(?:\\s*\\*/)?`, 'i'),
            // Comentarios * dentro de bloques /** */ con autor
            new RegExp(`^\\s*\\*\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
            // Comentarios * dentro de bloques /** */ sin autor
            new RegExp(`^\\s*\\*\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
        ];

        const decorationsMap: Map<string, vscode.Range[]> = new Map();
        const gutterDecorationsMap: Map<string, vscode.Range[]> = new Map();

        patternKeys.forEach(key => {
            decorationsMap.set(key.toUpperCase(), []);
            gutterDecorationsMap.set(key.toUpperCase(), []);
        });

        const lines = text.split(/\r?\n/);
        lines.forEach((lineText, lineIndex) => {
            for (const regex of commentRegexes) {
                const match = lineText.match(regex);
                if (match && match.length >= 2) {
                    const matchedType = match[1].toUpperCase();
                    const type = patternKeys.find(key => key.toUpperCase() === matchedType);

                    if (type && decorationsMap.has(type.toUpperCase())) {
                        // Crear range para la línea completa (para el gutter)
                        const lineRange = new vscode.Range(
                            lineIndex,
                            0,
                            lineIndex,
                            lineText.length
                        );
                        gutterDecorationsMap.get(type.toUpperCase())!.push(lineRange);

                        // Colorear todo el comentario desde el inicio del comentario hasta el final
                        let commentStart = -1;
                        let rangeApplied = false;

                        if (lineText.indexOf('/*') >= 0) {
                            commentStart = lineText.indexOf('/*');
                            // Para comentarios /* */, colorear hasta el */ o hasta el final de la línea
                            const commentEnd = lineText.indexOf('*/', commentStart);
                            if (commentEnd >= 0) {
                                const range = new vscode.Range(
                                    lineIndex,
                                    commentStart,
                                    lineIndex,
                                    commentEnd + 2 // Incluir el */
                                );
                                decorationsMap.get(type.toUpperCase())!.push(range);
                                rangeApplied = true;
                            } else {
                                // Si no hay */, colorear hasta el final de la línea
                                const range = new vscode.Range(
                                    lineIndex,
                                    commentStart,
                                    lineIndex,
                                    lineText.length
                                );
                                decorationsMap.get(type.toUpperCase())!.push(range);
                                rangeApplied = true;
                            }
                        } else if (lineText.indexOf('//') >= 0) {
                            commentStart = lineText.indexOf('//');
                        } else if (lineText.indexOf('#') >= 0) {
                            commentStart = lineText.indexOf('#');
                        } else if (lineText.indexOf('--') >= 0) {
                            commentStart = lineText.indexOf('--');
                        } else if (lineText.trim().startsWith('*')) {
                            commentStart = lineText.indexOf('*');
                        }

                        if (!rangeApplied && commentStart >= 0) {
                            const range = new vscode.Range(
                                lineIndex,
                                commentStart,
                                lineIndex,
                                lineText.length
                            );
                            decorationsMap.get(type.toUpperCase())!.push(range);
                        }
                        break;
                    }
                }
            }
        });

        // Aplicar decoraciones de texto a cada tipo
        decorationsMap.forEach((ranges, type) => {
            const decorationType = this.decorations.get(type);
            if (decorationType && ranges.length > 0) {
                editor.setDecorations(decorationType, ranges);
            }
        });

        // Aplicar decoraciones de gutter a cada tipo
        gutterDecorationsMap.forEach((ranges, type) => {
            const gutterDecorationType = this.gutterDecorations.get(type);
            if (gutterDecorationType && ranges.length > 0) {
                editor.setDecorations(gutterDecorationType, ranges);
            }
        });
    }

    dispose(): void {
        this.disposeDecorations();
        this.disposables.forEach(disposable => disposable.dispose());
    }
}

