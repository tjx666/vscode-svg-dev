import { PipeEndpoint, Pipe } from "../../../shared/services/pipe/pipe";
import { Artboard } from "../services/artboard/artboard";
import { UndoRequest, UndoResponse } from '../../../shared/pipes/undo.pipe';
import { WebviewEndpoint } from "../services/endpoint/webview-endpoint";
import { ElementHolder } from "../services/picker/element-holder";

export class UndoListener {
    private client: PipeEndpoint<UndoRequest, UndoResponse, 'undo'>;

    constructor(
        private webviewEndpoint: WebviewEndpoint,
        private undoPipe: Pipe<UndoRequest, UndoResponse, 'undo'>,
        private artboard: Artboard,
        private holder: ElementHolder,
    ) {
        this.client = this.webviewEndpoint.createFromPipe(this.undoPipe);
    }

    listen() {
        this.client.listenSetRequest(
            _request => this.artboard,
            ({state}) => {
                this.artboard.svg.outerHTML = state;
                this.artboard.clearCache();
                this.holder.elements = [];
            },
        );
    }

}