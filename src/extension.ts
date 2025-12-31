import * as vscode from 'vscode';
import { TodoFileDecorationProvider } from './fileDecorationProvider';
import { TodoTextDecorationProvider } from './textDecorationProvider';
import { TodoItem, TodoTreeProvider } from './todoTreeProvider';

export function activate(context: vscode.ExtensionContext) {
    const todoTreeProvider = new TodoTreeProvider(context);

    // Registrar FileDecorationProvider para colores en el árbol
    const fileDecorationProvider = new TodoFileDecorationProvider();
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(fileDecorationProvider));

    // Registrar TextDecorationProvider para colorear comentarios en el editor
    const textDecorationProvider = new TodoTextDecorationProvider();
    context.subscriptions.push(textDecorationProvider);

    const treeView = vscode.window.createTreeView('todoTree', {
        treeDataProvider: todoTreeProvider,
        showCollapseAll: true
    });

    // Actualizar título y badge cuando cambia el filtro o los TODOs
    const updateViewTitleAndBadge = () => {
        const authorFilter = todoTreeProvider.getAuthorFilter();
        const typeFilter = todoTreeProvider.getTypeFilter();
        const textSearch = todoTreeProvider.getTextSearchFilter();
        const totalCount = todoTreeProvider.getTotalTodosCount();

        // Actualizar título con todos los filtros activos
        const ageFilter = todoTreeProvider.getAgeFilter();
        const filters: string[] = [];
        if (authorFilter) filters.push(`Autor: ${authorFilter}`);
        if (typeFilter) filters.push(`Tipo: ${typeFilter}`);
        if (textSearch) filters.push(`Buscar: ${textSearch}`);
        if (ageFilter !== 'all') {
            const ageLabels = { critical: 'Críticos (>3m)', recent: 'Recientes (<1sem)' };
            filters.push(ageLabels[ageFilter]);
        }

        if (filters.length > 0) {
            treeView.title = `Todo Tree [${filters.join(', ')}]`;
        } else {
            treeView.title = 'Todo Tree';
        }

        // Actualizar badge con el contador
        if (totalCount > 0) {
            treeView.badge = {
                value: totalCount,
                tooltip: `${totalCount} TODO${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`
            };
        } else {
            treeView.badge = undefined;
        }
    };

    // Actualizar título y badge inicial
    updateViewTitleAndBadge();

    // Escuchar cambios en el árbol para actualizar el título y badge
    const disposable = todoTreeProvider.onDidChangeTreeData(() => {
        updateViewTitleAndBadge();
    });
    context.subscriptions.push(disposable);

    const refreshCommand = vscode.commands.registerCommand('todoTree.refresh', () => {
        // Limpiar cache al refrescar manualmente
        todoTreeProvider.clearCache();
        todoTreeProvider.refresh();
    });

    const revealCommand = vscode.commands.registerCommand('todoTree.reveal', (item: TodoItem) => {
        // Ignorar clicks en items informativos
        if (item.isInfoItem) {
            return;
        }

        // Usar el URI original guardado
        const uri = item.originalUri || item.resourceUri;
        if (uri) {
            vscode.window.showTextDocument(uri, {
                selection: new vscode.Range(
                    item.line,
                    0,
                    item.line,
                    0
                ),
                preview: false
            });
        }
    });

    const filterByAuthorCommand = vscode.commands.registerCommand('todoTree.filterByAuthor', async () => {
        const authors = todoTreeProvider.getAllAuthors();
        const currentFilter = todoTreeProvider.getAuthorFilter();

        if (authors.length === 0) {
            vscode.window.showInformationMessage('No se encontraron autores en los TODOs');
            return;
        }

        // Crear items para el QuickPick
        const items: vscode.QuickPickItem[] = [
            {
                label: '$(clear-all) Todos los autores',
                description: 'Limpiar filtro de autor',
                detail: 'Mostrar TODOs de todos los autores'
            },
            ...authors.map(author => {
                const count = todoTreeProvider.getTodoCountByAuthor(author);
                const isCurrentFilter = !!(currentFilter && author.toLowerCase().includes(currentFilter));
                return {
                    label: `$(person) ${author}`,
                    description: `TODOs de ${author}`,
                    detail: `${count} TODO${count !== 1 ? 's' : ''}`,
                    // Marcar el autor actual como seleccionado
                    picked: isCurrentFilter
                };
            })
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Filtrar por autor/responsable',
            ignoreFocusOut: true
        });

        if (selected !== undefined) {
            if (selected.label.includes('Todos los autores')) {
                todoTreeProvider.clearAuthorFilter();
            } else {
                // Extraer el nombre del autor del label (remover el ícono y espacios)
                const authorName = selected.label.replace(/^\$\([^)]+\)\s*/, '').trim();
                todoTreeProvider.setAuthorFilter(authorName);
            }
        }
    });

    const clearFilterCommand = vscode.commands.registerCommand('todoTree.clearFilter', () => {
        todoTreeProvider.clearFilter();
    });

    // Navegación rápida: Siguiente TODO
    const nextTodoCommand = vscode.commands.registerCommand('todoTree.nextTodo', () => {
        const todos = todoTreeProvider.getFilteredTodos();
        if (todos.length === 0) {
            vscode.window.showInformationMessage('No hay TODOs encontrados');
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        let currentPosition: { file: string; line: number } | null = null;

        if (activeEditor) {
            const currentFile = activeEditor.document.uri.fsPath;
            const currentLine = activeEditor.selection.active.line;
            currentPosition = { file: currentFile, line: currentLine };
        }

        // Los TODOs ya vienen ordenados por prioridad inteligente desde getFilteredTodos()
        // Solo necesitamos ordenar por posición si hay múltiples archivos
        const sortedTodos = [...todos].sort((a, b) => {
            if (a.file.fsPath !== b.file.fsPath) {
                return a.file.fsPath.localeCompare(b.file.fsPath);
            }
            return a.line - b.line;
        });

        let nextTodo = sortedTodos[0];

        if (currentPosition) {
            // Buscar el siguiente TODO después de la posición actual
            const next = sortedTodos.find(todo => {
                if (todo.file.fsPath > currentPosition!.file) return true;
                if (todo.file.fsPath === currentPosition!.file && todo.line > currentPosition!.line) return true;
                return false;
            });
            if (next) nextTodo = next;
        }

        // Navegar al TODO
        vscode.window.showTextDocument(nextTodo.file, {
            selection: new vscode.Range(nextTodo.line, 0, nextTodo.line, 0),
            preview: false
        });
    });

    // Navegación rápida: Anterior TODO
    const previousTodoCommand = vscode.commands.registerCommand('todoTree.previousTodo', () => {
        const todos = todoTreeProvider.getFilteredTodos();
        if (todos.length === 0) {
            vscode.window.showInformationMessage('No hay TODOs encontrados');
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        let currentPosition: { file: string; line: number } | null = null;

        if (activeEditor) {
            const currentFile = activeEditor.document.uri.fsPath;
            const currentLine = activeEditor.selection.active.line;
            currentPosition = { file: currentFile, line: currentLine };
        }

        // Los TODOs ya vienen ordenados por prioridad inteligente desde getFilteredTodos()
        // Solo necesitamos ordenar por posición si hay múltiples archivos
        const sortedTodos = [...todos].sort((a, b) => {
            if (a.file.fsPath !== b.file.fsPath) {
                return a.file.fsPath.localeCompare(b.file.fsPath);
            }
            return a.line - b.line;
        });

        let previousTodo = sortedTodos[sortedTodos.length - 1];

        if (currentPosition) {
            // Buscar el TODO anterior antes de la posición actual
            for (let i = sortedTodos.length - 1; i >= 0; i--) {
                const todo = sortedTodos[i];
                if (todo.file.fsPath < currentPosition!.file) {
                    previousTodo = todo;
                    break;
                }
                if (todo.file.fsPath === currentPosition!.file && todo.line < currentPosition!.line) {
                    previousTodo = todo;
                    break;
                }
            }
        }

        // Navegar al TODO
        vscode.window.showTextDocument(previousTodo.file, {
            selection: new vscode.Range(previousTodo.line, 0, previousTodo.line, 0),
            preview: false
        });
    });

    // Filtro por tipo
    const filterByTypeCommand = vscode.commands.registerCommand('todoTree.filterByType', async () => {
        const config = vscode.workspace.getConfiguration('todoTree');
        const patterns: any = config.get('patterns', {});
        const types = Object.keys(patterns);

        const currentFilter = todoTreeProvider.getTypeFilter();
        const items = ['Todos', ...types];
        const currentIndex = currentFilter ? types.indexOf(currentFilter) + 1 : 0;

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Filtrar por tipo de TODO',
            canPickMany: false,
            ignoreFocusOut: true
        });

        if (selected !== undefined) {
            if (selected === 'Todos') {
                todoTreeProvider.clearTypeFilter();
            } else {
                todoTreeProvider.setTypeFilter(selected);
            }
        }
    });

    // Búsqueda por texto
    const searchTextCommand = vscode.commands.registerCommand('todoTree.searchText', async () => {
        const currentSearch = todoTreeProvider.getTextSearchFilter();
        const text = await vscode.window.showInputBox({
            prompt: 'Buscar en el contenido de los TODOs',
            placeHolder: 'Ejemplo: validación, bug, error (dejar vacío para limpiar)',
            value: currentSearch,
            ignoreFocusOut: true
        });

        if (text !== undefined) {
            if (text.trim() === '') {
                todoTreeProvider.clearTextSearchFilter();
            } else {
                todoTreeProvider.setTextSearchFilter(text);
            }
        }
    });

    // Filtro por antigüedad
    const filterByAgeCommand = vscode.commands.registerCommand('todoTree.filterByAge', async () => {
        const currentFilter = todoTreeProvider.getAgeFilter();
        const items = [
            { label: 'Todos', value: 'all' as const },
            { label: 'Solo Críticos (>3 meses)', value: 'critical' as const },
            { label: 'Recientes (<1 semana)', value: 'recent' as const }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Filtrar por antigüedad',
            canPickMany: false,
            ignoreFocusOut: true
        });

        if (selected !== undefined) {
            todoTreeProvider.setAgeFilter(selected.value);
        }
    });

    context.subscriptions.push(
        treeView,
        refreshCommand,
        revealCommand,
        filterByAuthorCommand,
        clearFilterCommand,
        nextTodoCommand,
        previousTodoCommand,
        filterByTypeCommand,
        searchTextCommand,
        filterByAgeCommand
    );

    // Focus automático por archivo activo
    const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            // Filtrar automáticamente por el archivo activo
            todoTreeProvider.setActiveFileFilter(editor.document.uri.fsPath);
        } else {
            // Restaurar estado cuando se cierra el editor
            todoTreeProvider.setActiveFileFilter(null);
        }
    });
    context.subscriptions.push(onDidChangeActiveEditor);

    // Inicializar con el editor activo actual
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        todoTreeProvider.setActiveFileFilter(activeEditor.document.uri.fsPath);
    }

    // Escanear automáticamente cuando se abren o guardan archivos
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange((uri) => {
        // Invalidar cache del archivo modificado
        todoTreeProvider.invalidateFileCache(uri.fsPath);
        todoTreeProvider.refresh();
    });
    watcher.onDidCreate((uri) => {
        todoTreeProvider.refresh();
    });
    watcher.onDidDelete((uri) => {
        // Limpiar cache del archivo eliminado
        todoTreeProvider.invalidateFileCache(uri.fsPath);
        todoTreeProvider.refresh();
    });
    context.subscriptions.push(watcher);

    // Invalidar cache cuando se guarda un documento
    const onDidSaveDocument = vscode.workspace.onDidSaveTextDocument(document => {
        todoTreeProvider.invalidateFileCache(document.uri.fsPath);
        todoTreeProvider.refresh();
    });
    context.subscriptions.push(onDidSaveDocument);

    // Escuchar cambios en la configuración (viewMode)
    const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('todoTree.viewMode')) {
            // Actualizar árbol cuando cambia el modo de visualización
            todoTreeProvider.refresh();
        }
    });
    context.subscriptions.push(onDidChangeConfiguration);

    // Escanear inicial
    todoTreeProvider.refresh();
}

export function deactivate() {}

