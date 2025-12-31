import * as path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Información de Git obtenida mediante blame
 */
interface GitInfo {
    author: string;
    timestamp: number; // Unix timestamp en milisegundos
    commitHash: string;
    date: Date;
}

interface TodoComment {
    text: string;
    line: number;
    type: string;
    file: vscode.Uri;
    author?: string;  // Autor/responsable extraído de TODO(author): formato o de Git
    inferredType?: boolean; // Indica si el tipo fue inferido por auto-clasificación
    timestamp?: number; // Timestamp del commit de Git (en milisegundos)
    gitAuthor?: string; // Autor obtenido de Git (si no hay autor en el texto)
    commitHash?: string; // Hash del commit
    gitInfoLoaded?: boolean; // Indica si la info de Git ya fue cargada
}

/**
 * Cache de archivos para evitar re-parsear archivos sin cambios
 */
interface FileCacheEntry {
    todos: TodoComment[];
    timestamp: number;
    hash: string;
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
            // El tooltip se establecerá en resolveTreeItem para hover rico
            // Por ahora establecer uno básico
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
    private activeFileFilter: string | null = null; // Filtro por archivo activo
    private previousFilterState: { author: string; type: string; text: string } | null = null; // Estado previo antes del focus automático
    private ageFilter: 'all' | 'critical' | 'recent' = 'all'; // Filtro por antigüedad

    // Cache inteligente de archivos
    private fileCache: Map<string, FileCacheEntry> = new Map();
    private fileContentCache: Map<string, string> = new Map(); // Cache de contenido para hover

    // Cache de información de Git por archivo (lazy loading)
    private gitBlameCache: Map<string, Map<number, GitInfo>> = new Map(); // filePath -> Map<line, GitInfo>
    private gitExtension: any = null; // Extensión de Git de VS Code

    // Palabras clave para auto-clasificación
    private readonly urgentKeywords = ['urgent', 'urgente', 'crítico', 'critico', 'critical', 'importante', 'important', 'asap', 'bug', 'error', 'fix'];
    private readonly temporalKeywords = ['temporal', 'temporary', 'temp', 'hack', 'workaround', 'quick fix'];

    constructor(private context: vscode.ExtensionContext) {
        // Intentar obtener la extensión de Git
        this.initializeGitExtension();
    }

    /**
     * Inicializa la extensión de Git de VS Code si está disponible
     * Nota: La API de Git de VS Code no expone blame directamente,
     * así que usamos el comando git directamente
     */
    private initializeGitExtension(): void {
        // Intentar verificar si git está disponible
        // No necesitamos la extensión de Git para usar git blame directamente
        // pero podemos verificar si hay un repositorio Git
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (gitExtension) {
                // La extensión existe, pero no la necesitamos activar para blame
                this.gitExtension = { available: true };
            }
        } catch (error) {
            // Git no disponible, continuar sin él
        }
    }

    /**
     * Obtiene información de Git para una línea específica usando blame
     * Implementa lazy loading y cache para rendimiento
     * Usa el comando de Git directamente ya que la API no expone blame directamente
     */
    private async getGitInfo(uri: vscode.Uri, line: number): Promise<GitInfo | null> {
        const filePath = uri.fsPath;

        // Verificar cache primero
        const fileCache = this.gitBlameCache.get(filePath);
        if (fileCache && fileCache.has(line)) {
            return fileCache.get(line)!;
        }

        // Si no hay extensión de Git, intentar usar git directamente
        try {
            // Obtener el directorio del workspace
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) {
                return null;
            }

            // Ejecutar git blame con formato porcelain para obtener información completa
            const gitCommand = `git blame -L ${line + 1},${line + 1} --porcelain "${filePath}"`;

            try {
                const { stdout } = await execAsync(gitCommand, {
                    cwd: workspaceFolder.uri.fsPath,
                    maxBuffer: 1024 * 1024 // 1MB
                });

                // Parsear el resultado de git blame --porcelain
                const lines = stdout.split('\n');
                let commitHash = '';
                let author = '';
                let timestamp = 0;

                for (const blameLine of lines) {
                    if (blameLine.startsWith('author ')) {
                        author = blameLine.substring(7).trim();
                    } else if (blameLine.startsWith('author-time ')) {
                        timestamp = parseInt(blameLine.substring(12).trim()) * 1000; // Convertir a milisegundos
                    } else if (blameLine.match(/^[0-9a-f]{40}/)) {
                        commitHash = blameLine.substring(0, 40);
                    }
                }

                if (commitHash && author && timestamp) {
                    const gitInfo: GitInfo = {
                        author,
                        timestamp,
                        commitHash,
                        date: new Date(timestamp)
                    };

                    // Cachear el resultado
                    if (!fileCache) {
                        this.gitBlameCache.set(filePath, new Map([[line, gitInfo]]));
                    } else {
                        fileCache.set(line, gitInfo);
                    }

                    return gitInfo;
                }
            } catch (execError) {
                // Git no disponible o archivo no en repositorio
                return null;
            }
        } catch (error) {
            // Error al obtener info de Git, retornar null
            return null;
        }

        return null;
    }

    /**
     * Carga información de Git para un TODO de forma lazy (solo cuando se necesita)
     */
    private async loadGitInfoForTodo(todo: TodoComment): Promise<void> {
        if (todo.gitInfoLoaded) {
            return; // Ya cargado
        }

        const gitInfo = await this.getGitInfo(todo.file, todo.line);
        if (gitInfo) {
            // Solo asignar autor de Git si no hay autor en el texto
            if (!todo.author) {
                todo.author = gitInfo.author;
                todo.gitAuthor = gitInfo.author;
            }
            todo.timestamp = gitInfo.timestamp;
            todo.commitHash = gitInfo.commitHash;
            todo.gitInfoLoaded = true;
        } else {
            todo.gitInfoLoaded = true; // Marcar como cargado aunque no haya info
        }
    }

    /**
     * Calcula la antigüedad de un TODO y retorna el indicador visual
     */
    private getAgeIndicator(timestamp?: number): { emoji: string; label: string; age: number } {
        if (!timestamp) {
            return { emoji: '', label: '', age: 0 };
        }

        const now = Date.now();
        const ageMs = now - timestamp;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const ageWeeks = ageDays / 7;
        const ageMonths = ageDays / 30;

        if (ageDays < 14) {
            return { emoji: '🟢', label: 'Reciente', age: ageDays };
        } else if (ageMonths < 3) {
            return { emoji: '🟡', label: 'Viejo', age: ageDays };
        } else {
            return { emoji: '🔴', label: 'Deuda técnica', age: ageDays };
        }
    }

    /**
     * Formatea el tiempo transcurrido de forma legible
     */
    private formatTimeAgo(timestamp: number): string {
        const now = Date.now();
        const ageMs = now - timestamp;
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageWeeks = Math.floor(ageDays / 7);
        const ageMonths = Math.floor(ageDays / 30);
        const ageYears = Math.floor(ageDays / 365);

        if (ageDays < 1) {
            return 'hoy';
        } else if (ageDays < 7) {
            return `hace ${ageDays} día${ageDays !== 1 ? 's' : ''}`;
        } else if (ageWeeks < 4) {
            return `hace ${ageWeeks} semana${ageWeeks !== 1 ? 's' : ''}`;
        } else if (ageMonths < 12) {
            return `hace ${ageMonths} mes${ageMonths !== 1 ? 'es' : ''}`;
        } else {
            return `hace ${ageYears} año${ageYears !== 1 ? 's' : ''}`;
        }
    }

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
        this.ageFilter = 'all';
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
     * Activa el filtro automático por archivo activo
     */
    setActiveFileFilter(filePath: string | null): void {
        if (filePath === this.activeFileFilter) {
            return; // Ya está filtrado por este archivo
        }

        // Guardar estado previo si no hay filtro activo
        if (!this.activeFileFilter && filePath) {
            this.previousFilterState = {
                author: this.authorFilter,
                type: this.typeFilter,
                text: this.textSearchFilter
            };
        }

        this.activeFileFilter = filePath;

        // Restaurar estado previo si se desactiva el filtro
        if (!filePath && this.previousFilterState) {
            this.authorFilter = this.previousFilterState.author;
            this.typeFilter = this.previousFilterState.type;
            this.textSearchFilter = this.previousFilterState.text;
            this.previousFilterState = null;
        }

        this._onDidChangeTreeData.fire();
    }

    /**
     * Limpia el cache de un archivo específico (útil cuando se modifica)
     */
    invalidateFileCache(filePath: string): void {
        this.fileCache.delete(filePath);
        this.fileContentCache.delete(filePath);
        this.invalidateGitCache(filePath); // También limpiar cache de Git
    }

    /**
     * Limpia todo el cache (útil para refresh manual)
     */
    clearCache(): void {
        this.fileCache.clear();
        this.fileContentCache.clear();
        this.gitBlameCache.clear(); // Limpiar también cache de Git
    }

    /**
     * Limpia el cache de Git para un archivo específico
     */
    invalidateGitCache(filePath: string): void {
        this.gitBlameCache.delete(filePath);
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
     * Obtiene la prioridad numérica de un tipo de TODO para ordenamiento inteligente
     * Prioridad: FIXME/XXX (1) > TODO (2) > NOTE/HACK (3)
     */
    private getTodoPriority(type: string): number {
        const upperType = type.toUpperCase();
        if (upperType === 'FIXME' || upperType === 'XXX') return 1;
        if (upperType === 'TODO') return 2;
        return 3; // NOTE, HACK y otros
    }

    /**
     * Obtiene el modo de visualización configurado
     */
    private getViewMode(): 'byFile' | 'byAuthor' {
        const config = vscode.workspace.getConfiguration('todoTree');
        return config.get<'byFile' | 'byAuthor'>('viewMode', 'byFile');
    }

    /**
     * Calcula métricas de TODOs filtrados: total, críticos (FIXME+XXX), TODO, NOTE, HACK, deuda técnica
     */
    private getMetrics(): { total: number; critical: number; todo: number; note: number; hack: number; techDebt: number } {
        const filtered = this.getFilteredTodos();
        const now = Date.now();
        const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000);

        return {
            total: filtered.length,
            critical: filtered.filter(t => {
                const type = t.type.toUpperCase();
                return type === 'FIXME' || type === 'XXX';
            }).length,
            todo: filtered.filter(t => t.type.toUpperCase() === 'TODO').length,
            note: filtered.filter(t => t.type.toUpperCase() === 'NOTE').length,
            hack: filtered.filter(t => t.type.toUpperCase() === 'HACK').length,
            techDebt: filtered.filter(t => {
                // Deuda técnica: TODOs con más de 3 meses de antigüedad
                return t.timestamp && t.timestamp < threeMonthsAgo;
            }).length
        };
    }

    /**
     * Obtiene el filtro de antigüedad activo
     */
    getAgeFilter(): 'all' | 'critical' | 'recent' {
        return this.ageFilter;
    }

    /**
     * Establece el filtro de antigüedad
     */
    setAgeFilter(filter: 'all' | 'critical' | 'recent'): void {
        this.ageFilter = filter;
        this._onDidChangeTreeData.fire();
    }

    /**
     * Obtiene todos los TODOs filtrados según los filtros activos
     * Ordenados por prioridad inteligente (FIXME/XXX primero, luego TODO, luego NOTE/HACK)
     */
    getFilteredTodos(): TodoComment[] {
        let filtered = [...this.todos];

        // Filtrar por archivo activo (focus automático)
        if (this.activeFileFilter) {
            filtered = filtered.filter(todo => todo.file.fsPath === this.activeFileFilter);
        }

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

        // Filtrar por antigüedad
        if (this.ageFilter !== 'all') {
            const now = Date.now();
            filtered = filtered.filter(todo => {
                if (!todo.timestamp) {
                    return this.ageFilter === 'recent'; // Sin timestamp = reciente por defecto
                }
                const ageDays = (now - todo.timestamp) / (1000 * 60 * 60 * 24);
                if (this.ageFilter === 'critical') {
                    return ageDays > 90; // > 3 meses
                } else if (this.ageFilter === 'recent') {
                    return ageDays < 7; // < 1 semana
                }
                return true;
            });
        }

        // Ordenar por prioridad inteligente: primero por prioridad, luego por archivo, luego por línea
        filtered.sort((a, b) => {
            const priorityA = this.getTodoPriority(a.type);
            const priorityB = this.getTodoPriority(b.type);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Mismo nivel de prioridad: ordenar por archivo
            if (a.file.fsPath !== b.file.fsPath) {
                return a.file.fsPath.localeCompare(b.file.fsPath);
            }

            // Mismo archivo: ordenar por línea
            return a.line - b.line;
        });

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

            // Establecer hover rico con contexto (async, se cargará cuando se necesite)
            // Por ahora establecer un tooltip básico, el rico se cargará en resolveTreeItem
            if (element.todoComment.timestamp) {
                const ageInfo = this.getAgeIndicator(element.todoComment.timestamp);
                element.tooltip = `${element.label} ${ageInfo.emoji}`;
            }
        }
        return element;
    }

    /**
     * Resuelve el tooltip rico de forma asíncrona cuando el usuario hace hover
     */
    async resolveTreeItem(item: TodoItem, element: TodoItem): Promise<TodoItem> {
        if (!element.isInfoItem && element.todoComment && element.resourceUri) {
            const richTooltip = await this.createRichTooltip(element.todoComment);
            if (richTooltip) {
                element.tooltip = richTooltip;
            }
        }
        return element;
    }

    /**
     * Crea un tooltip/hover rico para un TODO
     * Muestra tipo, archivo, línea, autor y fragmento de código
     * Incluye información de Git si está disponible
     * Optimizado para evitar re-crear MarkdownString si no es necesario
     */
    private async createRichTooltip(todo: TodoComment): Promise<vscode.MarkdownString | undefined> {
        // Cargar info de Git de forma lazy si no está cargada
        if (!todo.gitInfoLoaded) {
            await this.loadGitInfoForTodo(todo);
        }

        const filePath = todo.file.fsPath;
        const fileName = path.basename(filePath);
        const lineNumber = todo.line + 1;

        // Construir hover con MarkdownString
        const hover = new vscode.MarkdownString('', true); // isTrusted = true
        hover.supportHtml = false; // Usar solo markdown para mejor rendimiento

        // Tipo y autor en una línea más compacta
        const typeLabel = todo.inferredType ? `${todo.type} *(inferido)*` : todo.type;
        hover.appendMarkdown(`**${typeLabel}**`);
        if (todo.author) {
            const authorLabel = todo.gitAuthor && todo.gitAuthor === todo.author
                ? `👤 *${todo.author}* (Git)`
                : `👤 *${todo.author}*`;
            hover.appendMarkdown(` • ${authorLabel}`);
        }
        hover.appendMarkdown(`\n\n`);

        // Archivo y línea con mejor formato
        hover.appendMarkdown(`📄 \`${fileName}\` • 📍 Línea ${lineNumber}\n\n`);

        // Información de Git si está disponible
        if (todo.timestamp && todo.commitHash) {
            const ageInfo = this.getAgeIndicator(todo.timestamp);
            const timeAgo = this.formatTimeAgo(todo.timestamp);
            const date = new Date(todo.timestamp);
            const shortHash = todo.commitHash.substring(0, 7);

            hover.appendMarkdown(`🔀 **Git Info:**\n`);
            hover.appendMarkdown(`- Commit: \`${shortHash}\`\n`);
            hover.appendMarkdown(`- Fecha: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`);
            hover.appendMarkdown(`- Antigüedad: ${timeAgo} ${ageInfo.emoji} *${ageInfo.label}*\n\n`);
        }

        // Fragmento de código (3-5 líneas alrededor) - solo si está en cache
        const codeSnippet = this.getCodeSnippet(filePath, todo.line);
        if (codeSnippet) {
            hover.appendCodeblock(codeSnippet, '');
            hover.appendMarkdown(`\n`);
        }

        // Texto del TODO con mejor formato
        if (todo.text && todo.text.trim()) {
            hover.appendMarkdown(`💬 *${todo.text}*`);
        }

        return hover;
    }

    /**
     * Obtiene un fragmento de código alrededor de una línea específica
     * Usa cache para evitar re-leer archivos
     */
    private getCodeSnippet(filePath: string, lineNumber: number): string | null {
        try {
            let content = this.fileContentCache.get(filePath);

            if (!content) {
                // Intentar leer desde el documento abierto primero
                const openDocument = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
                if (openDocument) {
                    content = openDocument.getText();
                    this.fileContentCache.set(filePath, content);
                } else {
                    // Leer desde filesystem
                    content = fs.readFileSync(filePath, 'utf-8');
                    this.fileContentCache.set(filePath, content);
                }
            }

            const lines = content.split(/\r?\n/);
            const start = Math.max(0, lineNumber - 2);
            const end = Math.min(lines.length, lineNumber + 3);
            const snippet = lines.slice(start, end);

            // Agregar números de línea
            return snippet.map((line, idx) => {
                const actualLine = start + idx + 1;
                const marker = actualLine === lineNumber + 1 ? '→' : ' ';
                return `${marker} ${actualLine.toString().padStart(4, ' ')} | ${line}`;
            }).join('\n');
        } catch (error) {
            return null;
        }
    }

    getChildren(element?: TodoItem): Thenable<TodoItem[]> {
        if (!element) {
            // Retornar métricas + tutorial + grupos (archivos o autores según viewMode)
            const metricsItems = this.getMetricsItems();
            const tutorialItems = this.getTutorialItems();
            const viewMode = this.getViewMode();
            const groups = viewMode === 'byAuthor' ? this.getAuthorGroups() : this.getFileGroups();
            return Promise.resolve([...metricsItems, ...tutorialItems, ...groups]);
        } else if (element.isInfoItem && element.label === '📚 Guía de Uso') {
            // Retornar items del tutorial
            return Promise.resolve(this.getTutorialContentItems());
        } else if (element.isInfoItem) {
            // Items informativos no tienen hijos
            return Promise.resolve([]);
        } else {
            // Retornar TODOs del archivo/autor seleccionado
            const viewMode = this.getViewMode();
            if (viewMode === 'byAuthor') {
                return this.getTodosForAuthor(element.label);
            } else {
                return this.getTodosForFile(element.resourceUri!);
            }
        }
    }

    /**
     * Crea items informativos con métricas del árbol en formato visual mejorado tipo dashboard
     */
    private getMetricsItems(): TodoItem[] {
        const metrics = this.getMetrics();
        if (metrics.total === 0) {
            return [];
        }

        // Calcular porcentajes para barras visuales
        const criticalPercent = metrics.total > 0 ? Math.round((metrics.critical / metrics.total) * 100) : 0;
        const techDebtPercent = metrics.total > 0 ? Math.round((metrics.techDebt / metrics.total) * 100) : 0;

        // Crear barras visuales usando caracteres Unicode más compactos
        const createBar = (percent: number, length: number = 8): string => {
            const filled = Math.round((percent / 100) * length);
            return '▰'.repeat(filled) + '▱'.repeat(length - filled);
        };

        const criticalBar = createBar(criticalPercent);
        const techDebtBar = createBar(techDebtPercent);

        // Crear tooltip rico con MarkdownString para mejor visualización
        const metricsTooltip = new vscode.MarkdownString('', true);
        metricsTooltip.supportHtml = false;

        metricsTooltip.appendMarkdown('## 📊 Resumen de TODOs\n\n');
        metricsTooltip.appendMarkdown(`**Total:** ${metrics.total} TODO${metrics.total !== 1 ? 's' : ''}\n\n`);

        metricsTooltip.appendMarkdown('### Por Tipo:\n');
        metricsTooltip.appendMarkdown(`🔴 **Críticos** (FIXME + XXX): ${metrics.critical}\n`);
        metricsTooltip.appendMarkdown(`🔵 **TODO**: ${metrics.todo}\n`);
        metricsTooltip.appendMarkdown(`🟡 **NOTE**: ${metrics.note}\n`);
        metricsTooltip.appendMarkdown(`🟠 **HACK**: ${metrics.hack}\n\n`);

        if (metrics.techDebt > 0) {
            metricsTooltip.appendMarkdown(`### ⚠️ Deuda Técnica\n`);
            metricsTooltip.appendMarkdown(`**${metrics.techDebt}** TODO${metrics.techDebt !== 1 ? 's' : ''} con más de 3 meses\n`);
            metricsTooltip.appendMarkdown(`*${techDebtPercent}% del total*\n\n`);
        }

        // Formato visual mejorado: más compacto y tipo dashboard
        return [
            new TodoItem(
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            // Header principal con total
            new TodoItem(
                `📊 ${metrics.total} TODO${metrics.total !== 1 ? 's' : ''} encontrado${metrics.total !== 1 ? 's' : ''}`,
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
            // Críticos con barra de progreso visual
            new TodoItem(
                `🔴 Críticos: ${metrics.critical} ${criticalBar} ${criticalPercent > 0 ? criticalPercent + '%' : ''}`,
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ),
            // Tipos en una sola línea compacta
            new TodoItem(
                `   🔵${metrics.todo}  🟡${metrics.note}  🟠${metrics.hack}`,
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
            // Deuda técnica destacada con barra
            metrics.techDebt > 0 ? new TodoItem(
                `⚠️ Deuda Técnica: ${metrics.techDebt} ${techDebtBar} ${techDebtPercent}%`,
                0,
                undefined,
                vscode.TreeItemCollapsibleState.None,
                undefined,
                true
            ) : new TodoItem(
                '✅ Sin deuda técnica',
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
            )
        ].map(item => {
            // Agregar tooltip rico a los items principales
            if (item.label.includes('📊') || item.label.includes('Críticos') || item.label.includes('Deuda')) {
                item.tooltip = metricsTooltip;
            }
            return item;
        });
    }

    /**
     * Calcula un hash simple del contenido del archivo para cache
     * Usa longitud + checksum simple de primeros y últimos caracteres para detectar cambios
     */
    private getFileHash(content: string): string {
        const len = content.length;
        if (len === 0) return '0';

        // Checksum simple: suma de códigos de caracteres en posiciones clave
        let checksum = 0;
        const sampleSize = Math.min(200, len);
        const step = Math.max(1, Math.floor(len / sampleSize));

        for (let i = 0; i < len; i += step) {
            checksum += content.charCodeAt(i);
        }

        // Incluir primeros y últimos caracteres para mayor precisión
        const start = content.substring(0, Math.min(50, len));
        const end = content.substring(Math.max(0, len - 50));

        return `${len}-${checksum}-${start.length}-${end.length}`;
    }

    /**
     * Auto-clasifica un TODO basado en palabras clave en el texto
     * Retorna el tipo inferido o null si no se puede inferir
     */
    private inferTodoType(text: string, originalType: string): { type: string; inferred: boolean } {
        const lowerText = text.toLowerCase();

        // Si ya es FIXME o XXX, no inferir
        if (originalType.toUpperCase() === 'FIXME' || originalType.toUpperCase() === 'XXX') {
            return { type: originalType, inferred: false };
        }

        // Detectar palabras urgentes -> tratar como FIXME
        const hasUrgentKeyword = this.urgentKeywords.some(keyword => lowerText.includes(keyword));
        if (hasUrgentKeyword) {
            return { type: 'FIXME', inferred: true };
        }

        // Detectar palabras temporales -> tratar como HACK si no es ya HACK
        const hasTemporalKeyword = this.temporalKeywords.some(keyword => lowerText.includes(keyword));
        if (hasTemporalKeyword && originalType.toUpperCase() !== 'HACK') {
            return { type: 'HACK', inferred: true };
        }

        return { type: originalType, inferred: false };
    }

    /**
     * Escanea un archivo individual con cache inteligente
     */
    private async scanFile(file: vscode.Uri, patternKeys: string[], regexPattern: string): Promise<TodoComment[]> {
        const filePath = file.fsPath;

        try {
            // Obtener contenido del archivo
            let document: vscode.TextDocument;
            let text: string;
            let fileStats: fs.Stats | null = null;

            // Intentar leer desde documento abierto primero (más rápido)
            const openDocument = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === filePath);
            if (openDocument) {
                document = openDocument;
                text = document.getText();
            } else {
                // Leer desde filesystem
                fileStats = fs.statSync(filePath);
                document = await vscode.workspace.openTextDocument(file);
                text = document.getText();
            }

            // Calcular hash del contenido
            const hash = this.getFileHash(text);
            const timestamp = fileStats ? fileStats.mtimeMs : Date.now();

            // Verificar cache
            const cached = this.fileCache.get(filePath);
            if (cached && cached.hash === hash) {
                // Cache válido, retornar TODOs cacheados
                return cached.todos;
            }

            // Guardar contenido en cache para hover
            this.fileContentCache.set(filePath, text);

            // Parsear TODOs del archivo
            const todos: TodoComment[] = [];
                const lines = text.split(/\r?\n/);

                lines.forEach((lineText, index) => {
                    let found = false;

                // Buscar diferentes tipos de comentarios con soporte para autor y checkboxes
                // También captura checkboxes [ ] y [x] antes del tipo
                const commentRegexesWithAuthor = [
                    new RegExp(`//\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                    new RegExp(`#\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                    new RegExp(`--\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                    new RegExp(`/\\*\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*?)(?:\\s*\\*/)?`, 'i'),
                    new RegExp(`^\\s*\\*\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                ];

                    for (const regex of commentRegexesWithAuthor) {
                        const match = lineText.match(regex);
                        if (match && match.length >= 4) {
                            const matchedType = match[1];
                            // Buscar el tipo exacto (case-insensitive pero preservar original)
                            const type = patternKeys.find(key => {
                                const keyUpper = key.toUpperCase();
                                const matchedUpper = matchedType.toUpperCase();
                                return keyUpper === matchedUpper || key === matchedType;
                            });
                            if (type) {
                                const author = match[2].trim();
                                const todoText = (match[3] || '').trim() || 'Sin descripción';

                            // Auto-clasificación suave
                            const inferred = this.inferTodoType(todoText, type);

                            todos.push({
                                    text: todoText,
                                    line: index,
                                type: inferred.type,
                                    file: file,
                                author: author,
                                inferredType: inferred.inferred
                                });
                                found = true;
                                break;
                            }
                        }
                    }

                    // Si no se encontró con autor, buscar sin autor (con soporte para checkboxes)
                    if (!found) {
                        const commentRegexesWithoutAuthor = [
                            new RegExp(`//\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            new RegExp(`#\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            new RegExp(`--\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            new RegExp(`/\\*\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*:?\\s*(.*?)(?:\\s*\\*/)?`, 'i'),
                            new RegExp(`^\\s*\\*\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                        ];

                    for (const regex of commentRegexesWithoutAuthor) {
                        const match = lineText.match(regex);
                        if (match && match.length >= 3) {
                            const matchedType = match[1];
                            // Buscar el tipo exacto (case-insensitive pero preservar original)
                            const type = patternKeys.find(key => {
                                const keyUpper = key.toUpperCase();
                                const matchedUpper = matchedType.toUpperCase();
                                return keyUpper === matchedUpper || key === matchedType;
                            });
                            if (type) {
                                    const todoText = (match[2] || '').trim() || 'Sin descripción';

                                // Auto-clasificación suave
                                const inferred = this.inferTodoType(todoText, type);

                                todos.push({
                                        text: todoText,
                                        line: index,
                                    type: inferred.type,
                                    file: file,
                                    inferredType: inferred.inferred
                                    });
                                    found = true;
                                    break;
                                }
                            }
                        }

                        // Si no se encontró al inicio, buscar anidados (cualquier posición después del inicio del comentario)
                        if (!found) {
                            const nestedRegexes = [
                                // Para líneas que empiezan con * (dentro de bloques /** */) - buscar después del *
                                new RegExp(`^\\s*\\*\\s+.*?\\b(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*?)(?:\\s*\\*/|$)`, 'i'),
                                new RegExp(`^\\s*\\*\\s+.*?\\b(${regexPattern})\\s*:?\\s*(.*?)(?:\\s*\\*/|$)`, 'i'),
                                // Para comentarios // con anotaciones en medio
                                new RegExp(`//\\s+.*?\\b(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                                new RegExp(`//\\s+.*?\\b(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                                // Para comentarios # con anotaciones en medio
                                new RegExp(`#\\s+.*?\\b(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                                new RegExp(`#\\s+.*?\\b(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                                // Para comentarios -- con anotaciones en medio
                                new RegExp(`--\\s+.*?\\b(${regexPattern})\\s*\\(([^\\)]+)\\)\\s*:?\\s*(.*)`, 'i'),
                                new RegExp(`--\\s+.*?\\b(${regexPattern})\\s*:?\\s*(.*)`, 'i'),
                            ];

                            for (const regex of nestedRegexes) {
                                const match = lineText.match(regex);
                                if (match) {
                                    // Verificar si tiene autor (match[2] existe) o no
                                    let matchedType: string;
                                    let todoText: string;
                                    let author: string | undefined;

                                    if (match.length >= 4 && match[2] && !match[2].includes(':')) {
                                        // Tiene autor
                                        matchedType = match[1].toUpperCase();
                                        author = match[2].trim();
                                        todoText = (match[3] || '').trim() || 'Sin descripción';
                                    } else if (match.length >= 3) {
                                        // Sin autor
                                        matchedType = match[1].toUpperCase();
                                        todoText = (match[2] || '').trim() || 'Sin descripción';
                                    } else {
                                        continue;
                                    }

                                    const type = patternKeys.find(key => key.toUpperCase() === matchedType);
                                    if (type) {
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
                        }
                    }
                });

            // Actualizar cache
            this.fileCache.set(filePath, {
                todos,
                timestamp,
                hash
            });

            return todos;
            } catch (error) {
                // Ignorar errores de lectura de archivos
            return [];
        }
    }

    /**
     * Escaneo incremental optimizado con priorización y cache inteligente
     * Solo re-parsea archivos que cambiaron, reutiliza cache para el resto
     */
    private async scanFiles(): Promise<void> {
        const config = vscode.workspace.getConfiguration('todoTree');
        const excludePattern = config.get<string>('exclude', '**/node_modules/**,**/.git/**,**/dist/**,**/build/**');
        const patterns = config.get<any>('patterns', {});
        const customHighlights: any = config.get('highlights.customHighlight', {});
        const maxResults = config.get<number>('maxResults', 1000);

        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            this.todos = [];
            return;
        }

        // Combinar tipos de patterns y customHighlights
        const allPatternKeys = new Set([
            ...Object.keys(patterns),
            ...Object.keys(customHighlights)
        ]);
        const patternKeys = Array.from(allPatternKeys);

        if (patternKeys.length === 0) {
            this.todos = [];
            return;
        }

        // Escapar caracteres especiales para regex (como [ ] y [x])
        const escapedPatterns = patternKeys.map(key => {
            // Escapar caracteres especiales de regex
            return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        const regexPattern = escapedPatterns.join('|');

        const excludePatterns = excludePattern.split(',').map(p => p.trim());
        const allFiles = await vscode.workspace.findFiles('**/*', excludePatterns.join(','), maxResults);

        // Priorizar archivos: abiertos > recientemente modificados > resto
        const openFiles = vscode.workspace.textDocuments.map(doc => doc.uri);
        const openFilePaths = new Set(openFiles.map(uri => uri.fsPath));

        // Separar archivos en grupos de prioridad
        const priority1: vscode.Uri[] = []; // Archivos abiertos
        const priority2: vscode.Uri[] = []; // Archivos recientemente modificados (últimas 24h)
        const priority3: vscode.Uri[] = []; // Resto

        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

        for (const file of allFiles) {
            if (openFilePaths.has(file.fsPath)) {
                priority1.push(file);
            } else {
                try {
                    const stats = fs.statSync(file.fsPath);
                    if (stats.mtimeMs > oneDayAgo) {
                        priority2.push(file);
                    } else {
                        priority3.push(file);
                    }
                } catch {
                    priority3.push(file);
                }
            }
        }

        // Recolectar TODOs: primero de cache, luego escanear solo archivos nuevos/modificados
        const newTodos: TodoComment[] = [];
        const filesToScan: vscode.Uri[] = [];
        const filesToRemove: string[] = [];

        // Verificar qué archivos necesitan re-escaneo
        for (const file of [...priority1, ...priority2, ...priority3]) {
            const filePath = file.fsPath;
            const cached = this.fileCache.get(filePath);

            if (cached) {
                // Verificar si el archivo cambió comparando timestamp
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.mtimeMs <= cached.timestamp) {
                        // Cache válido, usar TODOs cacheados
                        newTodos.push(...cached.todos);
                        continue;
                    }
                } catch {
                    // Archivo no existe, marcar para remover del cache
                    filesToRemove.push(filePath);
                    continue;
                }
            }

            // Archivo nuevo o modificado, necesita escaneo
            filesToScan.push(file);
        }

        // Limpiar cache de archivos eliminados
        filesToRemove.forEach(filePath => {
            this.fileCache.delete(filePath);
            this.fileContentCache.delete(filePath);
        });

        // Escanear solo archivos que necesitan actualización
        for (const file of filesToScan) {
            const fileTodos = await this.scanFile(file, patternKeys, regexPattern);
            newTodos.push(...fileTodos);
        }

        this.todos = newTodos;
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

    /**
     * Determina si un archivo debe estar expandido o colapsado por defecto
     * Archivos con solo NOTE: colapsados
     * Archivos con FIXME o XXX: expandidos
     */
    private getDefaultCollapseState(todos: TodoComment[]): vscode.TreeItemCollapsibleState {
        const hasHighPriority = todos.some(todo => {
            const type = todo.type.toUpperCase();
            return type === 'FIXME' || type === 'XXX';
        });

        const hasOnlyNotes = todos.every(todo => todo.type.toUpperCase() === 'NOTE');

        if (hasHighPriority) {
            return vscode.TreeItemCollapsibleState.Expanded;
        }

        if (hasOnlyNotes) {
            return vscode.TreeItemCollapsibleState.Collapsed;
        }

        // Por defecto colapsado para otros casos
        return vscode.TreeItemCollapsibleState.Collapsed;
    }

    /**
     * Calcula el conteo de TODOs críticos (FIXME + XXX) en un array
     */
    private countCriticalTodos(todos: TodoComment[]): number {
        return todos.filter(todo => {
            const type = todo.type.toUpperCase();
            return type === 'FIXME' || type === 'XXX';
        }).length;
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
            const criticalCount = this.countCriticalTodos(todos);

            // Colapso inteligente basado en el contenido del archivo
            const collapseState = this.getDefaultCollapseState(todos);

            // Label mejorado con conteo de críticos
            let label = `${fileName} (${todos.length}`;
            if (criticalCount > 0) {
                label += ` • ${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}`;
            }
            label += ')';

            const item = new TodoItem(
                label,
                todos.length,
                uri,
                collapseState
            );
            item.tooltip = `${fileName} - ${todos.length} TODO(s)${criticalCount > 0 ? `, ${criticalCount} crítico(s)` : ''}`;
            fileGroups.push(item);
        });

        // Ordenar por nombre de archivo
        fileGroups.sort((a, b) => a.label.localeCompare(b.label));

        return fileGroups;
    }

    /**
     * Agrupa TODOs por autor para la vista alternativa
     */
    private getAuthorGroups(): TodoItem[] {
        const filteredTodos = this.getFilteredTodos();
        const authorMap = new Map<string, TodoComment[]>();

        // Agrupar por autor (case-insensitive)
        filteredTodos.forEach(todo => {
            const authorKey = todo.author?.trim().toLowerCase() || 'Sin autor';
            if (!authorMap.has(authorKey)) {
                authorMap.set(authorKey, []);
            }
            authorMap.get(authorKey)!.push(todo);
        });

        const authorGroups: TodoItem[] = [];
        authorMap.forEach((todos, authorKey) => {
            // Obtener el nombre original del autor (preservar mayúsculas/minúsculas)
            const originalAuthor = todos.find(t => t.author)?.author || 'Sin autor';
            const criticalCount = this.countCriticalTodos(todos);

            // Label con formato: 👤 autor (N TODOs)
            let label = `👤 ${originalAuthor} (${todos.length} TODO${todos.length !== 1 ? 's' : ''}`;
            if (criticalCount > 0) {
                label += ` • ${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}`;
            }
            label += ')';

            const item = new TodoItem(
                label,
                todos.length,
                undefined, // Sin URI para grupos de autor
                vscode.TreeItemCollapsibleState.Collapsed
            );
            item.contextValue = 'authorGroup';
            item.tooltip = `${originalAuthor} - ${todos.length} TODO(s)${criticalCount > 0 ? `, ${criticalCount} crítico(s)` : ''}`;
            authorGroups.push(item);
        });

        // Ordenar por nombre de autor
        authorGroups.sort((a, b) => a.label.localeCompare(b.label));

        return authorGroups;
    }

    /**
     * Obtiene TODOs agrupados por archivo para un autor específico
     */
    private async getTodosForAuthor(authorLabel: string): Promise<TodoItem[]> {
        // Extraer el nombre del autor del label (remover emoji y paréntesis)
        const authorMatch = authorLabel.match(/👤\s+(.+?)\s+\(/);
        if (!authorMatch) {
            return [];
        }

        const authorName = authorMatch[1];
        const filteredTodos = this.getFilteredTodos().filter(todo => {
            const todoAuthor = todo.author?.trim() || 'Sin autor';
            return todoAuthor === authorName;
        });

        // Cargar info de Git para todos los TODOs (lazy loading al expandir)
        const todosWithGit = await Promise.all(
            filteredTodos.map(async todo => {
                if (!todo.gitInfoLoaded) {
                    await this.loadGitInfoForTodo(todo);
                }
                return todo;
            })
        );

        // Agrupar por archivo
        const fileMap = new Map<string, TodoComment[]>();
        todosWithGit.forEach(todo => {
            const filePath = todo.file.fsPath;
            if (!fileMap.has(filePath)) {
                fileMap.set(filePath, []);
            }
            fileMap.get(filePath)!.push(todo);
        });

        const fileItems: TodoItem[] = [];
        fileMap.forEach((todos, filePath) => {
            const uri = vscode.Uri.file(filePath);
            const fileName = path.basename(filePath);
            const criticalCount = this.countCriticalTodos(todos);

            let label = `${fileName} (${todos.length}`;
            if (criticalCount > 0) {
                label += ` • ${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}`;
            }
            label += ')';

            const item = new TodoItem(
                label,
                todos.length,
                uri,
                this.getDefaultCollapseState(todos)
            );
            item.tooltip = `${fileName} - ${todos.length} TODO(s)${criticalCount > 0 ? `, ${criticalCount} crítico(s)` : ''}`;
            fileItems.push(item);
        });

        // Ordenar por nombre de archivo
        fileItems.sort((a, b) => a.label.localeCompare(b.label));

        return fileItems;
    }

    private async getTodosForFile(fileUri: vscode.Uri): Promise<TodoItem[]> {
        // Filtrar por archivo y aplicar todos los filtros
        // getFilteredTodos() ya ordena por prioridad inteligente
        const fileTodos = this.getFilteredTodos().filter(todo => todo.file.fsPath === fileUri.fsPath);

        // Cargar info de Git para todos los TODOs de este archivo (lazy loading al expandir)
        const todosWithGit = await Promise.all(
            fileTodos.map(async todo => {
                if (!todo.gitInfoLoaded) {
                    await this.loadGitInfoForTodo(todo);
                }
                return todo;
            })
        );

        return todosWithGit.map(todo => {
            // Construir label con información de Git y antigüedad
            let authorLabel = '';
            if (todo.author) {
                if (todo.gitAuthor && todo.gitAuthor === todo.author) {
                    authorLabel = `[Git: ${todo.author}] `;
                } else {
                    authorLabel = `[${todo.author}] `;
                }
            }

            let ageLabel = '';
            if (todo.timestamp) {
                const ageInfo = this.getAgeIndicator(todo.timestamp);
                const timeAgo = this.formatTimeAgo(todo.timestamp);
                ageLabel = ` (${timeAgo}) ${ageInfo.emoji}`;
            }

            const label = `L${todo.line + 1}: ${authorLabel}${todo.text}${ageLabel}`;

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
