import * as vscode from 'vscode';

export class TodoTextDecorationProvider {
    private decorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private gutterDecorations: Map<string, vscode.TextEditorDecorationType> = new Map();
    private activeEditor: vscode.TextEditor | undefined;
    private disposables: vscode.Disposable[] = [];
    
    // Cache de contenido de documentos para evitar re-procesar si no cambió
    private documentContentCache: Map<string, { content: string; hash: string }> = new Map();
    
    // Debounce timer para actualizaciones
    private updateTimer: NodeJS.Timeout | undefined;
    private readonly DEBOUNCE_DELAY = 150; // ms

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
     * Obtiene la configuración de highlight para un tipo de TODO
     */
    private getHighlightConfig(type: string): {
        foreground?: string;
        background?: string;
        iconColour?: string;
        icon?: string;
        gutterIcon?: boolean;
        opacity?: number;
    } {
        const config = vscode.workspace.getConfiguration('todoTree');
        const customHighlights: any = config.get('highlights.customHighlight', {});
        const defaultHighlight: any = config.get('highlights.defaultHighlight', {});
        
        const typeUpper = type.toUpperCase();
        const highlight = customHighlights[typeUpper] || customHighlights[type] || {};
        
        // Combinar con defaults
        return {
            foreground: highlight.foreground || defaultHighlight.foreground || '#000000',
            background: highlight.background || defaultHighlight.background || '#FFFFFF',
            iconColour: highlight.iconColour || highlight.background || defaultHighlight.iconColour || '#0000FF',
            icon: highlight.icon || this.getDefaultIconForType(type),
            gutterIcon: highlight.gutterIcon !== undefined ? highlight.gutterIcon : (defaultHighlight.gutterIcon !== undefined ? defaultHighlight.gutterIcon : true),
            opacity: highlight.opacity !== undefined ? highlight.opacity : (defaultHighlight.opacity !== undefined ? defaultHighlight.opacity : 50)
        };
    }

    /**
     * Obtiene el icono por defecto para un tipo de TODO
     */
    private getDefaultIconForType(type: string): string {
        const iconMap: { [key: string]: string } = {
            'TODO': 'check',
            'FIXME': 'bug',
            'NOTE': 'note',
            'HACK': 'alert',
            'XXX': 'x',
            'BUG': 'bug',
            'USEFUL': 'note',
            'COMMENT': 'note',
            'LEARN': 'note',
            'SEE NOTES': 'check',
            'POST': 'check',
            'RECHECK': 'check',
            'INCOMPLETE': 'alert',
            '[ ]': 'check',
            '[x]': 'check'
        };
        return iconMap[type.toUpperCase()] || 'check';
    }

    /**
     * Convierte color hex a rgba con opacidad
     */
    private hexToRgba(hex: string, opacity: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    }

    private createDecorations(): void {
        // Limpiar decoraciones existentes
        this.disposeDecorations();

        // Obtener todos los tipos configurados
        const config = vscode.workspace.getConfiguration('todoTree');
        const customHighlights: any = config.get('highlights.customHighlight', {});
        const patterns: any = config.get('patterns', {});
        
        // Combinar tipos de patterns y customHighlights
        const allTypes = new Set([
            ...Object.keys(patterns),
            ...Object.keys(customHighlights)
        ]);

        // Crear decoraciones dinámicamente basadas en la configuración
        allTypes.forEach(type => {
            const highlightConfig = this.getHighlightConfig(type);
            
            // Crear decoración de texto con foreground y background
            const decorationOptions: vscode.DecorationRenderOptions = {
                rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
            };

            // Aplicar foreground (color del texto)
            if (highlightConfig.foreground) {
                decorationOptions.color = highlightConfig.foreground;
            }

            // Aplicar background (color de fondo) con opacidad
            if (highlightConfig.background) {
                const opacity = highlightConfig.opacity || 50;
                decorationOptions.backgroundColor = this.hexToRgba(highlightConfig.background, opacity);
            }

            const decorationType = vscode.window.createTextEditorDecorationType(decorationOptions);
            this.decorations.set(type.toUpperCase(), decorationType);

            // Crear decoración de gutter (iconos) si está habilitado
            if (highlightConfig.gutterIcon !== false) {
                const icon = highlightConfig.icon || this.getDefaultIconForType(type);
                const iconColor = highlightConfig.iconColour || highlightConfig.background || '#0000FF';
                const iconUri = this.createGutterIconSvg(icon, iconColor);

                const gutterDecorationType = vscode.window.createTextEditorDecorationType({
                    gutterIconPath: iconUri,
                    gutterIconSize: 'contain',
                    rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
                });
                this.gutterDecorations.set(type.toUpperCase(), gutterDecorationType);
            }
        });
    }

    private disposeDecorations(): void {
        this.decorations.forEach(decoration => decoration.dispose());
        this.decorations.clear();
        this.gutterDecorations.forEach(decoration => decoration.dispose());
        this.gutterDecorations.clear();
    }

    /**
     * Calcula hash simple del contenido para detectar cambios
     */
    private getContentHash(content: string): string {
        const len = content.length;
        if (len === 0) return '0';
        // Hash simple: longitud + primeros 100 caracteres
        return `${len}-${content.substring(0, Math.min(100, len))}`;
    }

    private setupEventListeners(): void {
        // Actualizar todas las ventanas cuando cambia el editor activo
        const onDidChangeActiveEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
            this.activeEditor = editor;
            this.debouncedUpdateAllEditors();
        });

        // Actualizar cuando cambia el contenido del documento con debounce
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
            // Invalidar cache del documento modificado
            this.documentContentCache.delete(event.document.uri.fsPath);
            this.debouncedUpdateAllEditors();
        });

        // Actualizar cuando se abre un documento
        const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(() => {
            this.debouncedUpdateAllEditors();
        });

        // Recrear decoraciones cuando cambia la configuración
        const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('todoTree.highlights') || event.affectsConfiguration('todoTree.patterns')) {
                this.createDecorations();
                this.debouncedUpdateAllEditors();
            }
        });

        this.disposables.push(onDidChangeActiveEditor, onDidChangeTextDocument, onDidOpenTextDocument, onDidChangeConfiguration);

        // Actualizar todos los editores al iniciar
        setTimeout(() => {
            this.updateAllEditors();
        }, 500);
    }

    /**
     * Debounce para evitar actualizaciones excesivas mientras el usuario escribe
     */
    private debouncedUpdateAllEditors(): void {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        this.updateTimer = setTimeout(() => {
            this.updateAllEditors();
            this.updateTimer = undefined;
        }, this.DEBOUNCE_DELAY);
    }

    private updateAllEditors(): void {
        vscode.window.visibleTextEditors.forEach(editor => {
            this.updateDecorations(editor);
        });
    }

    /**
     * Encuentra el inicio de un comentario en una línea
     * Retorna la posición del inicio del comentario o -1 si no hay
     */
    private findCommentStart(lineText: string): number {
        const patterns = [
            lineText.indexOf('//'),
            lineText.indexOf('#'),
            lineText.indexOf('--'),
            lineText.indexOf('/*'),
            lineText.trim().startsWith('*') ? lineText.indexOf('*') : -1
        ];
        return patterns.filter(p => p >= 0).sort((a, b) => a - b)[0] ?? -1;
    }

    private async updateDecorations(editor: vscode.TextEditor): Promise<void> {
        const document = editor.document;
        const filePath = document.uri.fsPath;
        const text = document.getText();
        
        // Verificar cache: si el contenido no cambió, no re-procesar
        const contentHash = this.getContentHash(text);
        const cached = this.documentContentCache.get(filePath);
        if (cached && cached.hash === contentHash) {
            return; // Contenido sin cambios, no actualizar decoraciones
        }

        // Limpiar todas las decoraciones primero (texto y gutter)
        this.decorations.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        this.gutterDecorations.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });

        const config = vscode.workspace.getConfiguration('todoTree');
        const patterns: any = config.get('patterns', {});
        const customHighlights: any = config.get('highlights.customHighlight', {});
        
        // Combinar tipos de patterns y customHighlights
        const allPatternKeys = new Set([
            ...Object.keys(patterns),
            ...Object.keys(customHighlights)
        ]);
        const patternKeys = Array.from(allPatternKeys);

        if (patternKeys.length === 0) {
            // Actualizar cache incluso si no hay patrones
            this.documentContentCache.set(filePath, { content: text, hash: contentHash });
            return;
        }

        // Escapar caracteres especiales para regex (como [ ] y [x])
        const escapedPatterns = patternKeys.map(key => {
            // Escapar caracteres especiales de regex
            return key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        const regexPattern = escapedPatterns.join('|');

        // Regex simplificado: un solo patrón que captura todos los casos
        // Formato: (//|#|--|/\*|\*) seguido opcionalmente de [ ] o [x], luego tipo, opcionalmente (autor), luego texto
        const unifiedRegex = new RegExp(
            `(//|#|--|/\\*|^\\s*\\*)\\s*(?:\\[\\s*[xX]?\\s*\\]\\s*)?(${regexPattern})(?:\\s*\\(([^\\)]+)\\))?\\s*:?\\s*(.*)`,
            'i'
        );

        const decorationsMap: Map<string, vscode.Range[]> = new Map();
        const gutterDecorationsMap: Map<string, vscode.Range[]> = new Map();

        // Inicializar mapas para todos los tipos (patterns + customHighlights)
        patternKeys.forEach(key => {
            const keyUpper = key.toUpperCase();
            decorationsMap.set(keyUpper, []);
            gutterDecorationsMap.set(keyUpper, []);
        });

        const lines = text.split(/\r?\n/);
        lines.forEach((lineText, lineIndex) => {
            const match = lineText.match(unifiedRegex);
            if (match && match.length >= 3) {
                const matchedType = match[2];
                // Buscar el tipo exacto (case-insensitive) pero preservar el original para el mapa
                const type = patternKeys.find(key => {
                    const keyUpper = key.toUpperCase();
                    const matchedUpper = matchedType.toUpperCase();
                    return keyUpper === matchedUpper || key === matchedType;
                });

                if (type) {
                    const typeKey = type.toUpperCase();
                    if (decorationsMap.has(typeKey)) {
                        // Crear range para la línea completa (para el gutter)
                        const lineRange = new vscode.Range(
                            lineIndex,
                            0,
                            lineIndex,
                            lineText.length
                        );
                        gutterDecorationsMap.get(typeKey)!.push(lineRange);

                        // Encontrar inicio del comentario y colorear desde ahí
                        const commentStart = this.findCommentStart(lineText);
                        if (commentStart >= 0) {
                            let commentEnd = lineText.length;
                            
                            // Para comentarios /* */, buscar el cierre
                            if (lineText.includes('/*')) {
                                const closeIndex = lineText.indexOf('*/', commentStart);
                                if (closeIndex >= 0) {
                                    commentEnd = closeIndex + 2; // Incluir */
                                }
                            }

                            const range = new vscode.Range(
                                lineIndex,
                                commentStart,
                                lineIndex,
                                commentEnd
                            );
                            decorationsMap.get(typeKey)!.push(range);
                        }
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

        // Actualizar cache
        this.documentContentCache.set(filePath, { content: text, hash: contentHash });
    }

    dispose(): void {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        this.disposeDecorations();
        this.documentContentCache.clear();
        this.disposables.forEach(disposable => disposable.dispose());
    }
}

