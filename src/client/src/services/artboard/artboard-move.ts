import { Artboard } from "./artboard";


export class ArtboardMove {

    private bindedOnMouseDown: (event: MouseEvent) => void;
    private bindedOnMouseMove: (event: MouseEvent) => void;
    private bindedOnMouseUp: (event: MouseEvent) => void;

    private coords: {clientX: number, clientY: number} = {clientX: 0, clientY: 0};

    private marginLeft = 0;
    private marginTop = 0;

    constructor(
        private artboard: Artboard,
    ) {
        this.bindedOnMouseDown = this.onMouseDown.bind(this);
        this.bindedOnMouseMove = this.onMouseMove.bind(this);
        this.bindedOnMouseUp = this.onMouseUp.bind(this);

        const box = this.artboard.box;
        box.style.position = 'absolute';
        box.style.top = '0px';
        box.style.left = '0px';
    }

    get left(): number {
        return this.marginLeft;
    }

    get top(): number {
        return this.marginTop;
    }

    on() {
        window.addEventListener('mousedown', this.bindedOnMouseDown);
    }

    off() {
        window.removeEventListener('mousedown', this.bindedOnMouseDown);
    }

    onMouseDown(event: MouseEvent) {
        const { clientX, clientY } = event;
        const deltaX = clientX - this.coords.clientX;
        const deltaY = clientY - this.coords.clientY;
        Object.assign(this.coords, { clientX: deltaX, clientY: deltaY });
        document.body.style.cursor = 'move';
        event.stopPropagation();
        window.addEventListener('mousemove', this.bindedOnMouseMove);
        window.addEventListener('mouseup', this.bindedOnMouseUp);
    }

    onMouseMove(event: MouseEvent) {
        const { clientX, clientY } = event;
        const box = this.artboard.box;
        const deltaX = clientX - this.coords.clientX;
        const deltaY = clientY - this.coords.clientY;
        this.marginLeft = deltaX;
        this.marginTop = deltaY;
        box.style.top = `${ this.marginTop }px`;
        box.style.left = `${ this.marginLeft }px`;
        event.stopPropagation();
    }

    onMouseUp(event: MouseEvent) {
        const { clientX, clientY } = event;
        const deltaX = clientX - this.coords.clientX;
        const deltaY = clientY - this.coords.clientY;
        Object.assign(this.coords, {clientX: deltaX, clientY: deltaY});
        event.stopPropagation();
        window.removeEventListener('mousemove', this.bindedOnMouseMove);
        window.removeEventListener('mouseup', this.bindedOnMouseUp);
    }

}