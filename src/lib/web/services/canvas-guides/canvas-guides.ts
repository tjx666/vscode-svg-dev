import { spawner } from "@/dom/spawner";
import { LayerComponent } from "@/web/components/layer.component";


export class CanvasGuides {

    /**
     * @todo move to appearance
     */
    private readonly borderStyle = '1px dotted #666';

    private selection: SVGRectElement | null = null;

    constructor(
        private guidesLayer: LayerComponent,
        private artboardLayer: LayerComponent,
    ) {}

    /**
     * 
     */
    get guidesContainer(): SVGSVGElement {
        return this.guidesLayer.svg;
    }

    /**
     * 
     */
    get div(): HTMLDivElement {
        return this.guidesLayer.div;
    }

    /**
     * 
     */
    setContainerStyles() {
        const { left, top, width, height } = this.artboardLayer.svg.getBoundingClientRect();
        spawner.html.update(this.guidesLayer.div, {}, {
            position: 'absolute',
            outline: this.borderStyle,
            left: `${ left }px`,
            top: `${ top }px`,
        });
        spawner.svg.update(this.guidesLayer.svg, {}, {
            position: 'relative',
            left: '0px',
            top: '0px',
            width: `${ width }px`,
            height: `${ height }px`,
        });
    }

    /**
     * 
     */
    drawSelection(elements: Element[]): void {
        this.selection = spawner.svg.rect();
        const firstChild = this.guidesLayer.svg.children[0];
        if (firstChild) {
            firstChild.insertAdjacentElement('beforebegin', this.selection);
        } else {
            this.guidesLayer.svg.appendChild(this.selection);
        }
        this.setSelectionStyles(elements);
    }

    /**
     * 
     */
    setSelectionStyles(elements: Element[]): void {
        if (this.selection) {
            const rects = elements.map(el => el.getBoundingClientRect());
            const left = rects.map(({ left }) => left).reduce((acc, left) => left < acc ? left : acc, Infinity);
            const top = rects.map(({ top }) => top).reduce((acc, top) => top < acc ? top : acc, Infinity);
            const right = rects.map(({ right }) => right).reduce((acc, right) => right > acc ? right : acc, -Infinity);
            const bottom = rects.map(({ bottom }) => bottom).reduce((acc, bottom) => bottom > acc ? bottom : acc, -Infinity);
            const { left: containerLeft, top: containerTop } = this.guidesLayer.svg.getBoundingClientRect();
            if ( [ left, top, bottom, right ].every(d => Number.isFinite(d)) ) {
                spawner.svg.update(this.selection, {
                    'x': `${ left - containerLeft - 1 }`,
                    'y': `${ top - containerTop - 1 }`,
                    'width': `${ right - left + 1 }`,
                    'height': `${ bottom - top + 1 }`,
                    'fill': 'none',
                    'stroke': 'blue',
                    'stroke-width': '1',
                    'stroke-dasharray': '1',
                });
            }
        }
    }

    /**
     * 
     */
    removeSelection(): void {
        if (this.selection) {
            this.guidesLayer.svg.removeChild(this.selection);
            this.selection = null;
        }
    }


    /**
     * 
     */
    disposeContainerChildren(): void {
        for (let i = 0; i < this.guidesLayer.svg.children.length; i++) {
            const el = this.guidesLayer.svg.children[i];
            this.guidesLayer.svg.removeChild(el);
        }
    }

    /**
     * 
     */
    appendControlPoint(element: SVGElement) {
        if (this.selection) {
            this.selection.insertAdjacentElement('afterend', element);
        } else {
            this.guidesLayer.svg.appendChild(element);
        }
    }

}
