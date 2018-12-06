import * as vscode from 'vscode';
import { RemoteAttribute } from "../remote-attribute/remote-attribute";
import { PipeEndpoint } from "../../shared/services/pipe/pipe";
import { RemoteAttributeRequest, RemoteAttributeResponse } from "../../shared/pipes/remote-attribute.pipe";


export class RemoteAttributeInput<Attribute extends string> {

    private remoteAttribute: RemoteAttribute<Attribute>;

    constructor(
        private hostEndpoint: PipeEndpoint<RemoteAttributeRequest, RemoteAttributeResponse, 'remoteAttribute'>,
        private attribute: Attribute,
    ) {
        this.remoteAttribute = new RemoteAttribute(this.hostEndpoint, this.attribute);
    }

    async change() {
        const { value } = await this.remoteAttribute.get();
        const newValue = await vscode.window.showInputBox({value: value || ''});
        this.remoteAttribute.set(newValue || '');
    }

}