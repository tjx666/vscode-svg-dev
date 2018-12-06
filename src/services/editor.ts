import * as vscode from 'vscode';
import { WebviewPanel } from 'vscode';
import { ContextManager } from './context-manager';
import { AppContext } from '../app-context.type';
import { Template } from '../models/template.model';
import { Connection } from './connection/connection';
import { HostEndpoint } from './host-endpoint/host-endpoint';


export class Editor {

    private webviewPanel: WebviewPanel | null = null;

    public readonly viewType = 'svgDevPanel';

    public title = 'SVG Dev';

    constructor(
        private readonly template: Template,
        private readonly contextManager: ContextManager<AppContext>,
        private connections: Connection<any, any, any>[],
    ) {}

    /**
     * 
     */
    create() {
        this.webviewPanel = vscode.window.createWebviewPanel(
            this.viewType,
            this.title,
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            },
        );
        return this.webviewPanel;
    }

    /**
     * 
     */
    activate(webviewPanel: WebviewPanel, doc: string = this.template.defaultDocument) {
        webviewPanel.webview.html = this.template.render(doc);
        webviewPanel.onDidDispose(() => {
            this.contextManager.setMulti({
                svgDevOpen: false,
                svgDevActive: false,
            });
        });
        webviewPanel.onDidChangeViewState(_event => {
            this.contextManager.set('svgDevActive', webviewPanel!.active);
            if (webviewPanel.active) {
                const hostEndpoint = new HostEndpoint(webviewPanel);
                this.connections.forEach(con => con.connect(hostEndpoint));
            }
        });
        return this.contextManager.setMulti({
            svgDevOpen: true,
            svgDevActive: true,
        });
    }

    /**
     * //
     */
    dispose() {
        if (this.webviewPanel) {
            this.webviewPanel.dispose();
        }
    }

    /**
     * public entry for webview panel
     */
    public get panel() {
        return this.webviewPanel;
    }

}
