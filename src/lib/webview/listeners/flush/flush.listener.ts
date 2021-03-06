import { Pipe, PipeEndpoint } from "@/common/pipe/pipe";
import { webviewEndpoint } from "&resolve/webview-endpoint";
import { artboard } from "@/web/init";
import { FlushPayload } from "@/shared/pipes/flush.pipe";
import { Listener } from "@/webview/models/listener.model";


export class FlushListener implements Listener {
    private flushEndpoint: PipeEndpoint<FlushPayload, FlushPayload, "flush">;

    constructor(
        private flushPipe: Pipe<FlushPayload, FlushPayload, 'flush'>,
    ) {
        this.flushEndpoint = webviewEndpoint.createFromPipe(this.flushPipe);
    }

    listen() {
        this.flushEndpoint.listenGetRequest(
            _request => artboard.svg,
            ({}, svg) => {
                const content = this.format(svg.outerHTML);
                return { content };
            },
        );
    }

    format(html: string): string {
        const tab = '  ';
        let repeat = 0;
        return html.replace(/\<\/?/g, (search) => {
            switch (search) {
                case '<': return `\n${ tab.repeat(repeat++) }${ search }`;
                case '</': return `\n${ tab.repeat(--repeat) }${ search }`;
                default: return '';
            }
        }).trim();
    }

}
