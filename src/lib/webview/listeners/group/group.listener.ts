import { PipeEndpoint, Pipe } from "@/common/pipe/pipe";
import { webviewEndpoint } from "&resolve/webview-endpoint";
import { artboard } from "@/web/init";
import { ElementHolder } from "@/webview/services/holder/element-holder";
import { setState } from "&resolve/decorators/set-state.decorator";
import { Listener } from "@/webview/models/listener.model";


export class GroupListener implements Listener {

    private groupClient: PipeEndpoint<'group' | 'ungroup', {}, 'group'>;

    constructor(
        private groupPipe: Pipe<'group' | 'ungroup', {}, 'group'>,
        private holder: ElementHolder,
    ) {
        this.groupClient = webviewEndpoint.createFromPipe(this.groupPipe);
    }

    listen() {
        this.groupClient.listenSetRequest(
            _reguest => this.holder.elements.length > 0,
            (command, _true) => {
                this.processCommand(command);
            },
        );
    }

    /**
     * 
     */
    processCommand(command: 'group' | 'ungroup') {
        switch (command) {
            case 'group': this.group(); break;
            case 'ungroup': this.ungroup(); break;
        }
    }

    /**
     * 
     */
    @setState
    group() {
        const tempAttr = 'data-svg-dev-temp-sort';
        this.holder.elements.forEach(el => el.setAttribute(tempAttr, '1'));
        const requestedEls = artboard.svg.querySelectorAll(`[${ tempAttr }]`);
        const els = Array.from(requestedEls);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        artboard.svg.appendChild(g);
        els.forEach(el => g.appendChild(el));
        els.forEach(el => el.removeAttribute(tempAttr));
        this.holder.elements = [g];
    }

    /**
     * 
     */
    @setState
    ungroup() {
        this.holder.elements
        .filter(el => el instanceof SVGGElement)
        .forEach(g => {
            const parent = g.parentElement!;
            const children = Array.from(g.children) as SVGElement[];
            children.forEach(child => {
                parent.appendChild(child);
            });
            parent.removeChild(g);
            this.holder.elements = children;
        });
    }

}
