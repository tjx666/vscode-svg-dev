import { Pipe, PipeEndpoint } from "../../../lib/common/pipe/pipe";
import { PipeConnection } from "../../../services/connection/pipe-connection";
import { WebviewEndpoint } from "../../../client/src/services/endpoint/webview-endpoint";


/**
 * 
 */
export interface FeatureParams<
    Tag extends string,
> {
    tag: Tag;
    commandName: string;
    commandCall: () => Function;
}

/**
 * 
 */
export class FeatureManager<
    T extends string, A, B,
> {

    constructor() {}

    create(params: FeatureParams<T>) {
        return new Feature(params);
    }

}

/**
 * 
 */
export class Feature<
    T extends string, A, B,
> {

    private pipe: Pipe<A, B, T>;
    private connection: PipeConnection<A, B, T>;

    constructor(
        private params: FeatureParams<T>,
    ) {
        this.pipe = new Pipe<A, B, T>(this.params.tag);
        this.connection = new PipeConnection(this.pipe);
    }

    getCommand(commandCreator: (
        pipe: Pipe<A, B, T>,
        connection: PipeConnection<A, B, T>,
    ) => Function): [string, Function] {
        const { pipe, connection } = this;
        return [
            this.params.commandName,
            commandCreator(pipe, connection),
        ];
    }

    getWebviewListener(
        webviewEndpoint: WebviewEndpoint,
        clientFn: (pipeWebviewEndpoint: PipeEndpoint<A, B, T>) => void,
    ) {
        const pipeWebviewEndpoint = webviewEndpoint.createFromPipe(this.pipe);
        clientFn(pipeWebviewEndpoint);
    }

}