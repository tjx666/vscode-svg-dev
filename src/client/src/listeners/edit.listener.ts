import { WebviewEndpoint } from "../services/endpoint/webview-endpoint";
import { Pipe, PipeEndpoint } from "../../../shared/services/pipe/pipe";
import { EditRequest } from "../../../shared/pipes/edit.pipe";
import { FiguresCollection } from "../figures/figures-collection";
// import { setState } from "../decorators/set-state.decorator";
import { ElementHolder } from "../services/picker/element-holder";


export class EditListener {
    private editClient: PipeEndpoint<EditRequest, {}, "edit">;

    constructor(
        private webviewEndpoint: WebviewEndpoint,
        private editPipe: Pipe<EditRequest, {}, 'edit'>,
        private figuresCollection: FiguresCollection,
        private holder: ElementHolder,
    ) {
        this.editClient = this.webviewEndpoint.createFromPipe(this.editPipe);
    }

    listen() {
        this.editClient.listenSetRequest(
            _request => this.holder.elements.length,
            ({}, _length) => {
                this.editElement();
            },
        );
    }

    // @setState
    editElement() {
        const element = this.holder.elements[0];
        const delegate = this.figuresCollection.delegate(element);
        if (delegate && delegate.edit instanceof Function) {
            delegate.edit(element);
        }
    }

}
