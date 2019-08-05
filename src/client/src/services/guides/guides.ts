import { Artboard } from "../artboard/artboard";
import { ClientEvent, connectEvent } from "../../entities/client-event";
import { Spawn } from "../../../../lib/dom/spawner/spawn";


const enum GuidesEvents {
    selectionDrawn = 'selectionDrawn',
    selectionDestroyed = 'selectionDestroyed',
}


/**
 * 
 */
export class Guides {
    private readonly borderStyle = '1px dotted #666';

    private container: SVGSVGElement | null = null;
    private selection: SVGRectElement | null = null;

    public readonly [GuidesEvents.selectionDrawn] = new ClientEvent<ClientRect>();
    public readonly [GuidesEvents.selectionDestroyed] = new ClientEvent<null>();

    constructor(
        private artboard: Artboard,
        private spawn: Spawn,
    ) {
        // this.artboard.tools.style.pointerEvents = 'none';
    }

    get guidesContainer(): SVGSVGElement | null {
        return this.container;
    }

    /**
     * 
     */
    get exists(): boolean {
        return !!this.container;
    }

    /**
     * 
     */
    createContainer() {
        this.container = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.artboard.tools.appendChild(this.container);
        this.setContainerStyles();
    }

    setContainerStyles() {
        if (this.container) {
            const { left, top, width, height } = this.artboard.svg.getBoundingClientRect();
            Object.assign(this.container.style, {
                position: 'absolute',
                border: this.borderStyle,
                left: `${ left - 0.5 }px`,
                top: `${ top - 0.5 }px`,
                width: `${ width }px`,
                height: `${ height }px`,
                // pointerEvents: 'none',
            });
        }
    }

    /**
     * 
     */
    destroyContainer() {
        if (this.container) {
            this.artboard.tools.removeChild(this.container);
            this.container = null;
        }
    }

    /**
     * 
     */
    drawSelection(elements: Element[]): void {
        if (this.container) {
            // this.selection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.selection = this.spawn.svg.rect();
            this.container.appendChild(this.selection);
            this.setSelectionStyles(elements);
        }
    }

    /**
     * 
     */
    setSelectionStyles(elements: Element[]): void {
        if (this.container && this.selection) {
            const rects = elements.map(el => el.getBoundingClientRect());
            const left = rects.map(({ left }) => left).reduce((acc, left) => left < acc ? left : acc, Infinity);
            const top = rects.map(({ top }) => top).reduce((acc, top) => top < acc ? top : acc, Infinity);
            const right = rects.map(({ right }) => right).reduce((acc, right) => right > acc ? right : acc, -Infinity);
            const bottom = rects.map(({ bottom }) => bottom).reduce((acc, bottom) => bottom > acc ? bottom : acc, -Infinity);
            const { left: containerLeft, top: containerTop } = this.container.getBoundingClientRect();
            if ( [left, top, bottom, right].every(d => Number.isFinite(d)) ) {
                this.spawn.svg.update(this.selection, {
                    'x': `${ left - containerLeft - 1 }`,
                    'y': `${ top - containerTop - 1 }`,
                    'width': `${ right - left + 1 }`,
                    'height': `${ bottom - top + 1 }`,
                    'fill': 'none',
                    'stroke': 'blue',
                    'stroke-width': '1',
                    'stroke-dasharray': '1',
                });
                this.selectionStylesIsSet();
            }
        }
    }

    /**
     * 
     */
    @connectEvent(GuidesEvents.selectionDrawn)
    selectionStylesIsSet() {
        return this.selection!.getBoundingClientRect();
    }

    /**
     * 
     */
    removeSelection(): void {
        if (this.container && this.selection) {
            this.container.removeChild(this.selection);
            this.selection = null;
            // this.selectionDestroyed.emit(null);
            this.selectionIsRemoved();
        }
    }

    /**
     * 
     */
    @connectEvent(GuidesEvents.selectionDestroyed)
    selectionIsRemoved() {
        return null;
    }

    /**
     * 
     */
    disposeContainerChildren(): void {
        if (this.container) {
            for (let i = 0; i < this.container.children.length; i++) {
                const el = this.container.children[i];
                this.container.removeChild(el);
            }
        }
    }

}
