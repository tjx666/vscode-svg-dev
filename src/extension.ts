import * as vscode from 'vscode';
import { WebappTemplate } from './services/webapp-template';
import { AssetsManager } from './services/assets-manager';
import { Editor } from './services/editor';
import { ContextManager } from './services/context-manager';
import { AppContext } from './app-context.type';
import { Toolbox } from './services/toobox';
import { ToolsTreeProvider } from './services/tools-tree-provider';
import { ToolGroup } from './entities/tool-group';
import { ZoomIn } from './tools/zoom/zoom-in.tool';
import { ZoomOut } from './tools/zoom/zoom-out.tool';
import { NewDocument } from './tools/document/new.tool';
import { DefaultZoom } from './tools/zoom/default-zoom.tool';
import { ArtboardWidth } from './tools/document/artboard-width.tool';
import { ArtboardHeight } from './tools/document/artboard-height.tool';
import { Fill } from './tools/color/fill.tool';
import { Stroke } from './tools/color/stroke.tool';
import { StrokeWidth } from './tools/stroke/stroke-width.tool';
import { StrokeDasharray } from './tools/stroke/stroke-dasharray.tool';
import { RectWidthTool } from './tools/rect/rect-width.tool';
import { RectHeightTool } from './tools/rect/rect-height.tool';
import { RectAddTool } from './tools/rect/rect-add.tool';
import { RectRxTool } from './tools/rect/rect-rx.tool';
import { RectRyTool } from './tools/rect/rect-ry.tool';
import { FlushTool } from './tools/document/flush.tool';
import { RemoteAttributeInput } from './services/inputs/remote-attribute-input';
import { PipeConnection } from './services/connection/pipe-connection';
import { HostEndpoint } from './services/host-endpoint/host-endpoint';
import { remoteAttributePipe } from './shared/pipes/remote-attribute.pipe';
import { artboardPipe } from './shared/pipes/artboard.pipe';
import { artboardStylePipe } from './shared/pipes/artboard-style.pipe';
import { loggerPipe } from './shared/pipes/logger.pipe';
import { zoomPipe } from './shared/pipes/zoom.pipe';
import { createPipe, CreatePipeRequest, ElementsDict } from './shared/pipes/create.pipe';
import { EditorSerializer } from './services/editor-serializer';
import { flushPipe } from './shared/pipes/flush.pipe';
import { arrangePipe, ArrangePipeRequest } from './shared/pipes/arrange.pipe';
import { elementPipe, ElementCommand } from './shared/pipes/element.pipe';
import { pickPipe } from './shared/pipes/pick.pipe';
import { StatusBarItem, StatusBarAlignment } from 'vscode';
import { groupPipe } from './shared/pipes/group.pipe';
import { cancelPipe } from './shared/pipes/cancel.pipe';
import { BaseInput } from './services/inputs/ base-input';
import { DeleteTool } from './tools/element/delete.tool';
import { IdTool } from './tools/element/id.tool';
import { GroupTool } from './tools/group/group.tool';
import { UngroupTool } from './tools/group/ungroup.tool';
import { CircleAdd } from './tools/circle/circle-add.tool';
import { CircleRadiusTool } from './tools/circle/circle-radius.tool';
import { EllipseRxTool } from './tools/ellipse/rx.tool';
import { AddEllipseTool } from './tools/ellipse/add-ellipse.tool';
import { EllipseRyTool } from './tools/ellipse/ry.tool';


export function activate(context: vscode.ExtensionContext) {

    const pickConnection = new PipeConnection(pickPipe);
    const remoteAttributeConnnection = new PipeConnection(remoteAttributePipe);
    const artboardConnection = new PipeConnection(artboardPipe);
    const artboardStyleConnection = new PipeConnection(artboardStylePipe);
    const loggerConnection = new PipeConnection(loggerPipe);
    const zoomConnection = new PipeConnection(zoomPipe);
    const createConnection = new PipeConnection(createPipe);
    const flushConnection = new PipeConnection(flushPipe);
    const arrangeConnection = new PipeConnection(arrangePipe);
    const elementConnection = new PipeConnection(elementPipe);
    const groupConnection = new PipeConnection(groupPipe);
    const cancelConnection = new PipeConnection(cancelPipe);

    const connections: PipeConnection<any, any, any>[] = [
        remoteAttributeConnnection,
        artboardConnection,
        artboardStyleConnection,
        loggerConnection,
        zoomConnection,
        createConnection,
        flushConnection,
        arrangeConnection,
        elementConnection,
        pickConnection,
        groupConnection,
        cancelConnection,
    ];

    // TODO: isolate
    let statusBarItem: StatusBarItem | null = null;
    pickConnection.onConnected(endpoint => {
        endpoint.listenSetRequest(
            _request => true,
            ({ html: message }, _true) => {
                if (statusBarItem) {
                    statusBarItem.hide();
                    statusBarItem.dispose();
                    statusBarItem = null;
                }
                if (message) {
                    statusBarItem = vscode.window.createStatusBarItem(StatusBarAlignment.Right);
                    statusBarItem.text = message;
                    statusBarItem.show();
                }
            },
        );
    });

    const contextManager = new ContextManager<AppContext>();
    const assetsManager = new AssetsManager(context.extensionPath);
    const webappTemplate = new WebappTemplate(assetsManager);
    const editor = new Editor(webappTemplate, contextManager, connections);

    assetsManager.addScript('out', 'client', 'build', 'main.js');
    assetsManager.addStyle('out', 'client', 'build', 'artboard.css');

    const toolbox = new Toolbox(assetsManager);

    toolbox.register(
        new ToolGroup('Document'),
        new NewDocument(),
        new FlushTool()
    );
    toolbox.register(
        new ToolGroup('Element'),
        new DeleteTool(),
        new IdTool(),
    );
    toolbox.register(
        new ToolGroup('Group'),
        new GroupTool(),
        new UngroupTool(),
    );
    toolbox.register(
        new ToolGroup('Circle'),
        new CircleAdd(),
        new CircleRadiusTool(),
    );
    toolbox.register(
        new ToolGroup('Ellipse'),
        new AddEllipseTool(),
        new EllipseRxTool(),
        new EllipseRyTool(),
    );
    toolbox.register(
        new ToolGroup('Rect'),
        new RectAddTool(),
        new RectWidthTool(),
        new RectHeightTool(),
        new RectRxTool(),
        new RectRyTool(),
    );
    toolbox.register(
        new ToolGroup('Line'),
        {command: {title: 'Add Line', command: 'svgDevAddInteractive', arguments: ['line']}},
        {command: {title: 'X1', command: 'svgDevRemoteAttributeInput', arguments: ['x1']}},
        {command: {title: 'Y1', command: 'svgDevRemoteAttributeInput', arguments: ['y1']}},
        {command: {title: 'X2', command: 'svgDevRemoteAttributeInput', arguments: ['x2']}},
        {command: {title: 'Y2', command: 'svgDevRemoteAttributeInput', arguments: ['y2']}},
    );
    toolbox.register(
        new ToolGroup('Poly'),
        {command: {title: 'Add Polygon', command: 'svgDevAddInteractive', arguments: ['polygon']}},
        {command: {title: 'Add Polyline', command: 'svgDevAddInteractive', arguments: ['polyline']}},
        {command: {title: 'Points', command: 'svgDevRemoteAttributeInput', arguments: ['points']}},
    );
    toolbox.register(
        new ToolGroup('Text'),
        {command: {title: 'Add', command: 'svgDevAddText'}},
        {command: {title: 'Edit', command: 'svgDevRemoteAttributeInput', arguments: ['innerText']}},
    );
    toolbox.register(
        new ToolGroup('Zoom'),
        new DefaultZoom(),
        new ZoomIn(),
        new ZoomOut(),
        {command: {title: 'Set value', command: 'svgDevZoom'}},
    );
    toolbox.register(
        new ToolGroup('Artboard'),
        new ArtboardWidth(),
        new ArtboardHeight(),
        {command: {title: 'viewbox', command: 'svgDevArtboardViewBox'}},
        {command: {title: 'Set style', command: 'svgDevArtboardStyleAdd'}},
    );
    toolbox.register(
        new ToolGroup('Color'), 
        new Fill(), 
        new Stroke(),
    );
    toolbox.register(
        new ToolGroup('Stroke'),
        new StrokeWidth(),
        new StrokeDasharray()
    );
    toolbox.register(
        new ToolGroup('Order'),
        {command: {title: 'Bring to front', command: 'svgDevArrange', arguments: ['bringToFront']}},
        {command: {title: 'Send to back', command: 'svgDevArrange', arguments: ['sendToBack']}},
        {command: {title: 'Move forward', command: 'svgDevArrange', arguments: ['moveForward']}},
        {command: {title: 'Move backward', command: 'svgDevArrange', arguments: ['moveBackward']}},
    );
    toolbox.register(
        new ToolGroup('Style'),
        {command: {title: 'Add', command: 'svgDevStyleAdd'}},
        {command: {title: 'Remove', command: 'svgDevStyleRemove'}},
        {command: {title: 'Edit', command: 'svgDevStyleEdit'}},
    );

    vscode.window.registerTreeDataProvider(
        'svgDevToolsTreeView',
        new ToolsTreeProvider(toolbox),
    );

    vscode.window.registerWebviewPanelSerializer(
        editor.viewType,
        new EditorSerializer(editor, connections),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('svgDevNew', async () => {
            const panel = editor.create();
            await editor.activate(panel);
            const hostEndpoint = new HostEndpoint(panel);
            connections.forEach(con => con.connect(hostEndpoint));
            // @deprecated
            loggerConnection.ifConnected(hostLogger => {
                hostLogger.listenSetRequest(
                    _request => true,
                    request => {
                        if (request.log) {console.log('===>>>', request.log);}
                        if (request.warn) {console.warn('===>>>', request.warn);}
                        if (request.error) {console.error('===>>>', request.error);}
                    },
                );
                editor.panel!.onDidDispose(() => hostLogger.removeListeners());
            });
        }),
        vscode.commands.registerCommand('svgDevFromOpen', async () => {
            const { activeTextEditor } = vscode.window;
            if (activeTextEditor) {
                const content = activeTextEditor.document.getText();
                const panel = editor.create();
                await editor.activate(panel, content);
                const hostEndpoint = new HostEndpoint(panel);
                connections.forEach(con => con.connect(hostEndpoint)); 
            }
        }),
        vscode.commands.registerCommand('svgDevArtboardViewBox', async () => {
            artboardConnection.ifConnected(async viewBoxHost => {
                const { value } = await viewBoxHost.makeGetRequest({property: 'viewBox'});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                const newValue = await vscode.window.showInputBox({value: value!});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                if (newValue) {
                    viewBoxHost.makeSetRequest({property: 'viewBox', value: newValue});
                }
            });
        }),
        vscode.commands.registerCommand('svgDevFlush', async () => {
            flushConnection.ifConnected(async endpoint => {
                const { content } = await endpoint.makeGetRequest({});
                if (content) {
                    const document = await vscode.workspace.openTextDocument({content});
                    vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
                }
            });
        }),
        vscode.commands.registerCommand('svgDevAdd', (name: keyof ElementsDict, attributes = {}) => {
            createConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest(
                    new CreatePipeRequest(name, attributes),
                );
            });
        }),
        vscode.commands.registerCommand('svgDevAddText', async () => {
            await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
            const innerText = await vscode.window.showInputBox();
            await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
            if (innerText) {
                vscode.commands.executeCommand('svgDevAdd', 'text', {innerText});
            }
        }),
        vscode.commands.registerCommand('svgDevAddInteractive', (name: keyof ElementsDict, attributes = {}) => {
            vscode.commands.executeCommand('setContext', 'svgDevAddInteractive', true);
            vscode.commands.executeCommand('svgDevAdd', name, attributes);
        }),
        vscode.commands.registerCommand('svgDevCancel', () => {
            cancelConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest('cancel');
            });
            vscode.commands.executeCommand('setContext', 'svgDevAddInteractive', false);
        }),
        vscode.commands.registerCommand('svgDevZoom', () => {
            zoomConnection.ifConnected(async endpoint => {
                const input = new BaseInput();
                const value = await input.get({prompt: 'Set value in percents'});
                const abs = (parseInt(value!) || 100) / 100;
                endpoint.makeSetRequest({abs});
            });
        }),
        vscode.commands.registerCommand('svgDevZoomIn', () => {
            zoomConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest({delta: +0.1});
            });
        }),
        vscode.commands.registerCommand('svgDevZoomOut', () => {
            zoomConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest({delta: -0.1});
            });
        }),
        vscode.commands.registerCommand('svgDevDefaultZoom', () => {
            zoomConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest({abs: 1.0});
            });
        }),
        vscode.commands.registerCommand('svgDevArtboardWidth', async () => {
            artboardConnection.ifConnected(async artboardHost => {
                const { value } = await artboardHost.makeGetRequest({property: 'width'});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                const newValue = await vscode.window.showInputBox({value: value!});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                if (newValue) {
                    artboardHost.makeSetRequest({property: 'width', value: newValue});
                }
            });
        }),
        vscode.commands.registerCommand('svgDevArtboardHeight', async () => {
            artboardConnection.ifConnected(async artboardHost => {
                const { value } = await artboardHost.makeGetRequest({property: 'height'});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                const newValue = await vscode.window.showInputBox({value: value!});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                if (newValue) {
                    artboardHost.makeSetRequest({property: 'height', value: newValue});
                }
            });
        }),
        vscode.commands.registerCommand('svgDevRemoteAttributeInput', async (attribute: string) => {
            await remoteAttributeConnnection.ifConnected(async remoteAttributeHost => {
                const remote = new RemoteAttributeInput(remoteAttributeHost, attribute);
                await remote.change();
            });
        }),
        vscode.commands.registerCommand('svgDevArtboardStyleAdd', async () => {
            artboardStyleConnection.ifConnected(async artboardStyleHost => {
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                const styleDirective = await vscode.window.showInputBox({prompt: 'Css directive - `name: value`'});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                const [ styleName, styleValue ] = styleDirective!.split(':').map(str => str.trim());
                artboardStyleHost.makeSetRequest({styleName, styleValue});
            });
        }),
        vscode.commands.registerCommand('svgDevStyleAdd', async () => {
            remoteAttributeConnnection.ifConnected(async endpoint => {
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                const directive = await vscode.window.showInputBox({prompt: 'Css directive - `name: value`'});
                await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                if (directive && directive.indexOf(':') > -1) {
                    const {value: style} = await endpoint.makeGetRequest({attribute: 'style'});
                    if (style) {
                        const trimmedStyle = style.trim();
                        const newStyle = trimmedStyle[trimmedStyle.length - 1] === ';' ? `${trimmedStyle} ${directive}` : `${trimmedStyle}; ${directive}`;
                        endpoint.makeSetRequest({attribute: 'style', value: newStyle});
                    } else {
                        endpoint.makeSetRequest({attribute: 'style', value: directive});
                    }
                }
            });
        }),
        vscode.commands.registerCommand('svgDevStyleEdit', async () => {
            remoteAttributeConnnection.ifConnected(async endpoint => {
                const { value } = await endpoint.makeGetRequest({attribute: 'style'});
                if (value) {
                    const rules = value.split(';')
                    .map(t => t.trim())
                    .filter(t => !!t)
                    .filter(t => t.indexOf(':') > -1)
                    .map(t => t.split(':', 2).map(t => t.trim()));
                    await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                    const picked = await vscode.window.showQuickPick(rules.map(([label, detail]) => {
                        return {label, detail};
                    }));
                    await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                    if (picked) {
                        await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                        const newValue = await vscode.window.showInputBox({value: picked.detail});
                        await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                        const newRules = rules.map(([label, detail]) => {
                            if (label === picked.label && detail === picked.detail) {
                                return [label, newValue];
                            } else {
                                return [label, detail];
                            }
                        }).map(pair => pair.join(': ')).join('; ');
                        endpoint.makeSetRequest({attribute: 'style', value: newRules});
                    }
                } else {
                    vscode.commands.executeCommand('svgDevStyleAdd');
                }
            });
        }),
        vscode.commands.registerCommand('svgDevStyleRemove', async () => {
            remoteAttributeConnnection.ifConnected(async endpoint => {
                const { value } = await endpoint.makeGetRequest({attribute: 'style'});
                if (value) {
                    const rules = value.split(';')
                    .map(t => t.trim())
                    .filter(t => !!t)
                    .filter(t => t.indexOf(':') > -1)
                    .map(t => t.split(':', 2).map(t => t.trim()));
                    await vscode.commands.executeCommand('setContext', 'svgDevHostInput', true);
                    const picked = await vscode.window.showQuickPick(rules.map(([label, detail]) => {
                        return {label, detail};
                    }));
                    await vscode.commands.executeCommand('setContext', 'svgDevHostInput', false);
                    if (picked) {
                        const newRules = rules
                        .map(([label, detail]) => {
                            if (label === picked.label && detail === picked.detail) {
                                return null;
                            } else {
                                return [label, detail];
                            }
                        })
                        .filter(item => item !== null)
                        .map(pair => pair!.join(': ')).join('; ');
                        endpoint.makeSetRequest({attribute: 'style', value: newRules});
                    }
                }
            });
        }),
        vscode.commands.registerCommand('svgDevArrange', async (command: ArrangePipeRequest) => {
            arrangeConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest(command);
            });
        }),
        vscode.commands.registerCommand('svgDevElementCommand', async (command: ElementCommand) => {
            elementConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest(command);
            });
        }),
        vscode.commands.registerCommand('svgDevElementCommandDelete', () => {
            return vscode.commands.executeCommand('svgDevElementCommand', 'delete');
        }),
        vscode.commands.registerCommand('svgDevGroup', async (command: 'group' | 'ungroup') => {
            groupConnection.ifConnected(endpoint => {
                endpoint.makeSetRequest(command);
            });
        }),
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
