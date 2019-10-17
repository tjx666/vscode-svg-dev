import { findMethodIterator } from "@/common/iterators";
import { fromDomEvent } from "@/dom/iterators";
import { spawner } from "@/dom/spawner";
import { appearance } from "@/webview/services/appearance";
import { artboard } from "@/webview/services/artboard";

import { zoom } from "../services/zoom";
import { guides } from "../services/guides";


/**
 * refactor to Sets
 */
type ControlPointsCollection = SVGCircleElement[];
type ReturnablesCollection = AsyncIterableIterator<MouseEvent>[];


export abstract class BasePointsEditor<E extends SVGElement> {

    abstract getPoints(_element: E): [number, number][];

    abstract onMove(
        element: E,
        circleIndex: number,
        relDelta: [number, number],
        mirror: [boolean, boolean],
    ): void;

    createCircles(points: number[][]) {
        return points.map(point => {
            const [ cx, cy ] = point;
            const { value: zoomValue } = zoom;
            const circle = spawner.svg.circle(
                {
                    cx: `${ cx * zoomValue }`,
                    cy: `${ cy * zoomValue }`,
                    fill: appearance.editControlPointFill,
                    stroke: appearance.editControlPointStroke,
                    'stroke-dasharray': appearance.editControlPointStrokeDasharray,
                    r: appearance.editControlPointRadius,
                },
                {
                    pointerEvents: 'fill',
                }
            );
            guides.appendControlPoint(circle);
            return circle;
        });
    }

    destroyCircles(circles: ControlPointsCollection) {
        circles.forEach(circle => guides.guidesContainer!. removeChild(circle));
        circles.length = 0;
    }

    destroyReturnables(returnables: ReturnablesCollection) {
        returnables.forEach(r => r.return! ());
        returnables.length = 0;
    }

    updateCircles(
        element: E,
        circles: ControlPointsCollection,
        returnables: ReturnablesCollection,
    ) {
        this.destroyCircles(circles);
        this.destroyReturnables(returnables);

        const points = this.getPoints(element);
        const newCircles = this.createCircles(points);

        circles.push(...newCircles);

        newCircles.forEach((circle, circleIndex) => {
            const mirror: [boolean, boolean] = [false, false];
            const circleMouseDown = fromDomEvent<MouseEvent>(circle, 'mousedown');
            returnables.push(circleMouseDown);
            (async () => {
                for await (const circleDownEvent of circleMouseDown) {
                    circleDownEvent.stopPropagation();
                    guides.removeSelection();
                    const {
                        clientX,
                        clientY,
                    } = circleDownEvent;
                    const downX = clientX;
                    const downY = clientY;
                    const listeningElement = window;
                    const circleMouseMove = fromDomEvent<MouseEvent>(listeningElement, 'mousemove');
                    const circleMouseUp = fromDomEvent<MouseEvent>(listeningElement, 'mouseup');
                    let usedDeltaX = 0;
                    let usedDeltaY = 0;
                    (async () => {
                        for await (const circleMoveEvent of circleMouseMove) {
                            const {
                                clientX,
                                clientY,
                            } = circleMoveEvent;
                            const { value: zoomValue } = zoom;
                            const absDeltaX = (clientX - downX) / zoomValue;
                            const absDeltaY = (clientY - downY) / zoomValue;
                            const relDeltaX = absDeltaX - usedDeltaX;
                            const relDeltaY = absDeltaY - usedDeltaY;
                            usedDeltaX += relDeltaX;
                            usedDeltaY += relDeltaY;
                            this.onMove(element, circleIndex, [relDeltaX, relDeltaY], mirror);
                            this.updateCircles(element, circles, returnables);
                        }
                    })();
                    (async () => {
                        for await (const circleUpEvent of circleMouseUp) {
                            circleUpEvent.stopPropagation();
                            circleMouseMove.return! ();
                            circleMouseUp.return! ();
                            this.updateCircles(element, circles, returnables);
                        }
                    })();
                }
            })();
        });
    }



    edit(element: E) {
        const returnables: ReturnablesCollection = Array<AsyncIterableIterator<MouseEvent>>();
        const circles: ControlPointsCollection = Array<SVGCircleElement>();
        let mouseMoveIter: AsyncIterableIterator<MouseEvent>;
        let mouseUpIter: AsyncIterableIterator<MouseEvent>;
        const mouseDownIter = fromDomEvent(element, 'mousedown');
        (async () => {
            for await (const _down of mouseDownIter) {
                const listeningTarget = artboard.svg;
                mouseMoveIter = fromDomEvent(listeningTarget, 'mousemove');
                mouseUpIter = fromDomEvent(listeningTarget, 'mouseup');
                (async () => {
                    for await (const _moveEvent of mouseMoveIter) {
                        this.updateCircles(element, circles, returnables);
                    }
                })();
                (async () => {
                    for await (const _upEvent of mouseUpIter) {
                        mouseUpIter.return! ();
                        mouseMoveIter.return! ();
                        this.updateCircles(element, circles, returnables);
                    }
                })();
            }
        })();

        this.updateCircles(element, circles, returnables);
        const zoomIter = findMethodIterator(zoom.update);
        (async () => {
            for await (const _value of zoomIter) {
                this.updateCircles(element, circles, returnables);
            }
        })();

        const cancel = () => {
            [
                zoomIter,
                mouseDownIter,
                mouseMoveIter,
                mouseUpIter,
            ]
            .filter(iter => iter)
            .forEach(iter => {
                iter.return!();
            });
            this.destroyCircles(circles);
            this.destroyReturnables(returnables);
        };
        return cancel;
    }

}
