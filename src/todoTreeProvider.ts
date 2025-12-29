import * as path from 'path';
import * as vscode from 'vscode';

interface TodoComment {
    text: string;
    line: number;
    type: string;
    file: vscode.Uri;
    author?: string;  // Autor/responsable extraído de TODO(author): formato
}

export class TodoItem extends vscode.TreeItem {
    public readonly isInfoItem: boolean = false;
    public color?: vscode.ThemeColor;
    public originalUri?: vscode.Uri;

    constructor(
        public readonly label: string,
        public readonly line: number,
        public readonly resourceUri?: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public readonly todoComment?: TodoComment,
        isInfoItem: boolean = false
    ) {
        super(label, collapsibleState);
        this.isInfoItem = isInfoItem;

        if (isInfoItem) {
            this.iconPath = new vscode.ThemeIcon('info');
            this.contextValue = 'infoItem';
            this.tooltip = label;
        } else {
            this.tooltip = resourceUri
                ? `${this.label} - Línea ${line + 1}`
                : this.label;

            if (resourceUri) {
                this.command = {
                    command: 'todoTree.reveal',
                    title: 'Revelar',
                    arguments: [this]
                };
                // Guardar el URI original para usar en reveal
                this.originalUri = resourceUri;
            } else {
                this.contextValue = 'fileGroup';
            }
        }

        // Aplicar color si es un TODO
        if (!isInfoItem && todoComment && resourceUri) {
            const color = this.getColor();
            if (color) {
                this.color = color;
            }
        }
    }

    iconPath = this.getIconPath();

    private getIconPath(): vscode.ThemeIcon | undefined {
        if (!this.resourceUri) {
            return new vscode.ThemeIcon('file');
        }

        if (this.todoComment) {
            const config = vscode.workspace.getConfiguration('todoTree');
            const patterns: any = config.get('patterns', {});
            const pattern = patterns[this.todoComment.type];
            if (pattern && pattern.icon) {
                return new vscode.ThemeIcon(pattern.icon);
            }
        }

        return new vscode.ThemeIcon('circle-outline');
    }

    getColor(): vscode.ThemeColor | undefined {
        if (this.todoComment && this.resourceUri) {
            // Mapear tipo de TODO a color personalizado
            const colorMap: { [key: string]: string } = {
                'TODO': 'todoTree.todoForeground',
                'FIXME': 'todoTree.fixmeForeground',
                'NOTE': 'todoTree.noteForeground',
                'HACK': 'todoTree.hackForeground',
                'XXX': 'todoTree.xxxForeground'
            };

            const colorKey = colorMap[this.todoComment.type.toUpperCase()];
            if (colorKey) {
                return new vscode.ThemeColor(colorKey);
            }
        }
        return undefined;
    }
}

export class TodoTreeProvider implements vscode.TreeDataProvider<TodoItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TodoItem | undefined | null | void> = new vscode.EventEmitter<TodoItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TodoItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private todos: TodoComment[] = [];
    private authorFilter: string = '';  // Filtro por autor/responsable
    private typeFilter: string = '';    // Filtro por tipo (TODO, FIXME, etc.)
    private textSearchFilter: string = ''; // Búsqueda por texto

    constructor(private context: vscode.ExtensionContext) {}

    setAuthorFilter(author: string): void {
        this.authorFilter = author.trim().toLowerCase();
        this._onDidChangeTreeData.fire();
    }

    getAuthorFilter(): string {
        return this.authorFilter;
    }

    setTypeFilter(type: string): void {
        this.typeFilter = type.trim().toUpperCase();
        this._onDidChangeTreeData.fire();
    }

    getTypeFilter(): string {
        return this.typeFilter;
    }

    setTextSearchFilter(text: string): void {
        this.textSearchFilter = text.trim().toLowerCase();
        this._onDidChangeTreeData.fire();
    }

    getTextSearchFilter(): string {
        return this.textSearchFilter;
    }

    clearFilter(): void {
        this.authorFilter = '';
        this.typeFilter = '';
        this.textSearchFilter = '';
        this._onDidChangeTreeData.fire();
    }

    clearAuthorFilter(): void {
        this.authorFilter = '';
        this._onDidChangeTreeData.fire();
    }

    clearTypeFilter(): void {
        this.typeFilter = '';
        this._onDidChangeTreeData.fire();
    }

    clearTextSearchFilter(): void {
        this.textSearchFilter = '';
        this._onDidChangeTreeData.fire();
    }

    /**
     * Obtiene todos los autores únicos de los TODOs con su conteo
     */
    getAllAuthors(): string[] {
        const authors = new Set<string>();
        this.todos.forEach(todo => {
            if (todo.author && todo.author.trim()) {
                authors.add(todo.author.trim());
            }
        });
        return Array.from(authors).sort();
    }

    /**
     * Obtiene el conteo de TODOs por autor
     */
    getTodoCountByAuthor(author: string): number {
        return this.todos.filter(todo => todo.author && todo.author.toLowerCase() === author.toLowerCase()).length;
    }

    /**
     * Obtiene todos los TODOs filtrados según los filtros activos
     */
    getFilteredTodos(): TodoComment[] {
        let filtered = [...this.todos];

        // Filtrar por autor
        if (this.authorFilter) {
            filtered = filtered.filter(todo => todo.author && todo.author.toLowerCase().includes(this.authorFilter));
        }

        // Filtrar por tipo
        if (this.typeFilter) {
            filtered = filtered.filter(todo => todo.type.toUpperCase() === this.typeFilter);
        }

        // Filtrar por texto de búsqueda
        if (this.textSearchFilter) {
            filtered = filtered.filter(todo => todo.text.toLowerCase().includes(this.textSearchFilter));
        }

        return filtered;
    }

    getTotalTodosCount(): number {
        return this.getFilteredTodos().length;
    }

    refresh(): void {
        this.scanFiles().then(() => {
            this._onDidChangeTreeData.fire();
        });
    }

    getTreeItem(element: TodoItem): vscode.TreeItem {
        // Aplicar color si es un TODO
        if (!element.isInfoItem && element.todoComment && element.resourceUri) {
            const color = element.getColor();
            if (color) {
                element.color = color;
            }
        }
        return element;
    }

    getChildren(element?: TodoItem): Thenable<TodoItem[]> {
        if (!element) {
            // Retornar tutorial + archivos agrupados
            const tutorialItems = this.getTutorialItems();
            const fileGroups = this.getFileGroups();
            return Promise.resolve([...tutorialItems, ...fileGroups]);
        } else if (element.isInfoItem && element.label === '📚 Guía de Uso') {
            // Retornar items del tutorial
            return Promise.resolve(this.getTutorialContentItems());
        } else {
            // Retornar TODOs del archivo seleccionado
            return Promise.resolve(this.getTodosForFile(element.resourceUri!));
        }
    }

    private async scanFiles(): Promise<void> {
        this.todos = [];

        const config = vscode.workspace.getConfiguration('todoTree');
        const excludePattern = config.get<string>('exclude', '**/node_modules/**,**/.git/**,**/dist/**,**/build/**');
        const patterns = config.get<any>('patterns', {});
        const maxResults = config.get<number>('maxResults', 1000);

        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return;
        }

        const patternKeys = Object.keys(patterns);
        if (patternKeys.length === 0) {
            return;
        }

        // Crear patrón regex para buscar comentarios (//, #, --, /* */)
        const regexPattern = patternKeys.map(key => key).join('|');

        const excludePatterns = excludePattern.split(',').map(p => p.trim());
        const files = await vscode.workspace.findFiles('**/*', excludePatterns.join(','), maxResults);

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();
                const lines = text.split(/\r?\n/);

                lines.forEach((lineText, index) => {
                    let found = false;

                    // Buscar diferentes tipos de comentarios con soporte para autor: //TODO(author):, #TODO(author):, etc.
                    // Primero intentar con autor (debe ir primero para capturar correctamente)
                    const commentRegexesWithAuthor = [
                        new RegExp(`//\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                        new RegExp(`#\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                        new RegExp(`--\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                        // Comentarios /* */ con autor - capturar hasta el */ o hasta el final de la línea
                        new RegExp(`/\\*\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*?)(?:\\s*\\*/)?`, 'i'),
                        new RegExp(`^\\s*\\*\\s*(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                    ];

                    for (const regex of commentRegexesWithAuthor) {
                        const match = lineText.match(regex);
                        if (match && match.length >= 4) {
                            const matchedType = match[1].toUpperCase();
                            const type = patternKeys.find(key => key.toUpperCase() === matchedType);
                            if (type) {
                                const author = match[2].trim();
                                const todoText = (match[3] || '').trim() || 'Sin descripción';

                                this.todos.push({
                                    text: todoText,
                                    line: index,
                                    type: type,
                                    file: file,
                                    author: author
                                });
                                found = true;
                                break;
                            }
                        }
                    }

                    // Si no se encontró con autor, buscar sin autor
                    if (!found) {
                        const commentRegexesWithoutAuthor = [
                            new RegExp(`//\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            new RegExp(`#\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            new RegExp(`--\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            // Comentarios /* */ - capturar hasta el */ o hasta el final de la línea
                            new RegExp(`/\\*\\s*(${regexPattern})\\s*:?\\s*(.*?)(?:\\s*\\*/)?`, 'i'),
                            // Comentarios * dentro de bloques /** */
                            new RegExp(`^\\s*\\*\\s*(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                        ];

                        for (const regex of commentRegexesWithoutAuthor) {
                            const match = lineText.match(regex);
                            if (match && match.length >= 3) {
                                const matchedType = match[1].toUpperCase();
                                const type = patternKeys.find(key => key.toUpperCase() === matchedType);
                                if (type) {
                                    const todoText = (match[2] || '').trim() || 'Sin descripción';

                                    this.todos.push({
                                        text: todoText,
                                        line: index,
                                        type: type,
                                        file: file
                                    });
                                    break;
                                }
                            }
                        }
                    }
                });
            } catch (error) {
                // Ignorar errores de lectura de archivos
            }
        }
    }

    private getTutorialItems(): TodoItem[] {
        const tutorialItem = new TodoItem(
            '📚 Guía de Uso',
            0,
            undefined,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined,
            true
        );
        return [tutorialItem];
    }

    private getTutorialContentItems(): TodoItem[] {
        return [
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '📝 FORMATO DE COMENTARIOS',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '• Con autor: //TODO(autor): descripción',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '  Ejemplo: //TODO(said): revisar código',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '• Sin autor: //TODO: descripción',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '  Ejemplo: //FIXME: corregir bug',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '🔧 FUNCIONALIDADES',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '🔍 Filtrar por autor',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '  → Click en el icono de filtro',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '⚡ Navegar a TODO',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '  → Click en cualquier TODO',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '🔄 Actualizar lista',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '  → Click en el icono de refresh',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '📋 TIPOS SOPORTADOS',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '• TODO, FIXME, NOTE, HACK, XXX',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            new TodoItem(
                '• Soporta: //, #, --, /*, *',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            )
        ];
    }

    private getFileGroups(): TodoItem[] {
        // Usar el método de filtrado completo
        const filteredTodos = this.getFilteredTodos();

        const fileMap = new Map<string, TodoComment[]>();

        filteredTodos.forEach(todo => {
            const filePath = todo.file.fsPath;
            if (!fileMap.has(filePath)) {
                fileMap.set(filePath, []);
            }
            fileMap.get(filePath)!.push(todo);
        });

        const fileGroups: TodoItem[] = [];
        fileMap.forEach((todos, filePath) => {
            const uri = vscode.Uri.file(filePath);
            const fileName = path.basename(filePath);
            const item = new TodoItem(
                `${fileName} (${todos.length})`,
                todos.length,
                uri,
                vscode.TreeItemCollapsibleState.Collapsed
            );
            item.tooltip = `${fileName} - ${todos.length} TODO(s)`;
            fileGroups.push(item);
        });

        // Ordenar por nombre de archivo
        fileGroups.sort((a, b) => a.label.localeCompare(b.label));

        return fileGroups;
    }

    private getTodosForFile(fileUri: vscode.Uri): TodoItem[] {
        // Filtrar por archivo y aplicar todos los filtros
        let fileTodos = this.getFilteredTodos().filter(todo => todo.file.fsPath === fileUri.fsPath);

        // Ordenar por número de línea
        fileTodos.sort((a, b) => a.line - b.line);

        return fileTodos.map(todo => {
            // Mostrar autor si existe
            const authorLabel = todo.author ? `[${todo.author}] ` : '';
            const label = `L${todo.line + 1}: ${authorLabel}${todo.text}`;

            // Crear un URI especial para el FileDecorationProvider con el tipo en el query
            const todoUri = vscode.Uri.parse(`todo://${todo.file.fsPath.replace(/\\/g, '/')}?type=${todo.type}`);

            const item = new TodoItem(
                label,
                todo.line,
                todoUri, // Usar el URI especial para FileDecorationProvider
                vscode.TreeItemCollapsibleState.None,
                todo
            );

            // Guardar el URI original para usar en el comando reveal
            item.originalUri = todo.file;
            return item;
        });
    }
}
