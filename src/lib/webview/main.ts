import { findMethodIterator } from '@/common/iterators';
import { appearance } from '@/webview/services/appearance';
import { editHub } from '@/webview/services/edit-hub';
import { webviewEndpoint } from '@/webview/services/webview-endpoint';
import { artboard } from '@/webview/services/artboard';
import { artboardMove } from '@/webview/services/artboard-move';

import {
    shapesOutlet,
    editPointsControl,
    groupControls,
    fillControl,
    strokeControl,
    artboardControls,
    editBoxControl,
    // editOnPick,
} from '@/webview/hud';

import { zoomPipe } from '@/shared/pipes/zoom.pipe';
import { remoteAttributePipe } from '@/shared/pipes/remote-attribute.pipe';
import { flushPipe } from '@/shared/pipes/flush.pipe';
import { RemoteAttributeListener } from '@/webview/listeners/remote-attribute.listener';
import { CreateListener } from '@/webview/listeners/create.listener';
import { FlushListener } from '@/webview/listeners/flush.listener';
import { ZoomListener } from '@/webview/listeners/zoom.listener';
import { ArrangeListener } from '@/webview/listeners/arrange.listener';
import { arrangePipe } from '@/shared/pipes/arrange.pipe';
import { pickPipe } from '@/shared/pipes/pick.pipe';
import { groupPipe } from '@/shared/pipes/group.pipe';
import { ElementListener } from '@/webview/listeners/element.listener';
import { picker } from '@/webview/services/picker';
import { zoom } from '@/webview/services/zoom';
import { GroupListener } from '@/webview/listeners/group.listener';
import { cancelListener, artboardListener, artboardStyleListener } from '@/webview/listeners';
import { guides } from '@/webview/services/guides';
import { EditListener } from '@/webview/listeners/edit.listener';
import { AppearanceResponse } from '@/shared/pipes/appearance.pipe';
import { inverseInteractiveEndpoint } from '@/webview/producers/inverse-interactive.producer';
import { MoveKeyListener } from '@/webview/listeners/move-key.listener';
import { ListAttributesListener } from '@/webview/listeners/list-attributes.listener';
import { listAttributesPipe } from '@/shared/pipes/list-attributes.pipe';
import { infomessageEndpoint } from '@/webview/producers/infomessage.producer';
import { hints } from '@/webview/services/hints';
import { UndoListener } from '@/webview/listeners/undo.listener';
import { undoPipe } from '@/shared/pipes/undo.pipe';
import { ConfigListener } from '@/webview/listeners/config.listener';
import { configPipe } from '@/shared/pipes/config.pipe';
import { holder } from '@/webview/services/holder';
import { sprites } from '@/webview/services/sprites';

import '@/webview/sprites';

/**
 * 
 */
guides.createContainer();

/**
 * 
 */
artboardMove.on();


const pickEndpoint = webviewEndpoint.createFromPipe(pickPipe);


/**
 * draw tools svg and selection on artboard move
 */
(async () => {
    const artboardMoveMouseMove = findMethodIterator(artboardMove.onMouseMove);
    for await ( const _event of artboardMoveMouseMove ) {
        guides.setContainerStyles();
        guides.setSelectionStyles(holder.elements);
    }
})();

/**
 * update selection drawing on move selected element(s)
 */
(async () => {
    const pickerMouseMove = findMethodIterator(picker.onMousemove);
    for await ( const _event of pickerMouseMove ) {
        guides.setSelectionStyles(holder.elements);
    }
})();

/**
 * on zoom value changes
 */
(async () => {
    const zoomValues = findMethodIterator(zoom.update);
    for await ( const value of zoomValues ) {
        pickEndpoint.makeSetRequest({ html: `zoom: ${ Math.round(value * 100) }%` });
        guides.setContainerStyles();
        guides.setSelectionStyles(holder.elements);
    }
})();

/**
 * 
 */
picker.listen();

/**
 * 
 */
const zoomListener = new ZoomListener(zoomPipe, zoom);
zoomListener.listen();

/**
 * draw artboard styles on artboard attributes changes
 */
(async () => {
    const artboardPropertyChanges = findMethodIterator(artboardListener.updateAttributes);
    for await (const _pair of artboardPropertyChanges) {
        guides.setContainerStyles();
    }
})();

/**
 * Webview artboard style pipe client
 */
// const artboardStyleListener = new ArtboardStyleListener(webviewEndpoint, artboardStylePipe, artboard, new CssJsNotationConverter());
artboardStyleListener.listen();

/**
 * 
 */
const remoteAttributeListener = new RemoteAttributeListener(remoteAttributePipe, holder);
remoteAttributeListener.listen();

/**
 * 
 */
const createListener = new CreateListener();
createListener.listen();

/**
 * 
 */
const editListener = new EditListener();
editListener.listen();

/**
 * 
 */
const flushListener = new FlushListener(flushPipe);
flushListener.listen();

/**
 * 
 */
const arrangeListener = new ArrangeListener(arrangePipe, holder);
arrangeListener.listen();

/**
 * 
 */
const elementListener = new ElementListener();
elementListener.listen();

/**
 * 
 */
const groupListener = new GroupListener(groupPipe, holder);
groupListener.listen();

/**
 * 
 */
cancelListener.listen();

/**
 * 
 */
const moveKeyListener = new MoveKeyListener();
moveKeyListener.listen();

/**
 * rebuild guides and remove editing mode on arrow key events
 */
(async () => {
    const keys = findMethodIterator(moveKeyListener.fireMoveEvent);
    for await (const _key of keys) {
        editHub.purge();
        guides.setContainerStyles();
        guides.setSelectionStyles(holder.elements);
    }
})();

/**
 * send message to host on element(s) selection
 */
(async () => {
    const elementsHasBeenSet = findMethodIterator(holder.elementsHasBeenSet);
    for await (const elements of elementsHasBeenSet) {
        setTimeout(() => {
            if (elements.length > 0) {
                pickEndpoint.makeSetRequest({
                    html: `selection: [${elements.map(el => [el.nodeName, el.id].filter(str => str).join('#')).join(', ')}]`
                });
                guides.removeSelection();
                guides.drawSelection(elements);
            } else {
                pickEndpoint.makeSetRequest({html: null});
                guides.removeSelection();
            }
        }, 0);
    }
})();

/**
 * change appearance on element(s) selection
 */
(async () => {
    const elementsHasBeenSet = findMethodIterator(holder.elementsHasBeenSet);
    for await (const elements of elementsHasBeenSet) {
        if (elements.length > 0) {
            const lastElement = elements[elements.length - 1];
            const fill = lastElement.getAttribute('fill');
            const stroke = lastElement.getAttribute('stroke');
            if (fill) {
                appearance.fill = fill;
                fillControl.updateFillBtn(fill);
            }
            if (stroke) {
                appearance.stroke = stroke;
                strokeControl.updateStrokeBtn(stroke);
            }
        }
    }
})();

/**
 * hide edit points control when edit on pick mode is on
 */
(async () => {
    const toggles = findMethodIterator(editHub.editModeSet);
    for await (const editMode of toggles) {
        if (editMode !== 'off') {
            editPointsControl.hide();
            editBoxControl.hide();
        }
    }
})();

/**
 * remove editing on selection if edit on pick is off
 * and active element changed
 */
(async () => {
    const elementsSet = findMethodIterator(holder.elementsHasBeenSet);
    for await (const elements of elementsSet) {
        const activeElement = editHub.element;
        if (editHub.editMode === 'off') {
            if (elements.length > 1) {
                editHub.purge();
            }
            if (!activeElement || !elements.includes(activeElement)) {
                editHub.purge();
            }
        }
    }
})();

/**
 * show/hide edit points button on select element
 */
(async () => {
    const elementsHasBeenSet = findMethodIterator(holder.elementsHasBeenSet);
    for await (const elements of elementsHasBeenSet) {
        if (elements.length === 1 && editHub.editMode === 'off') {
            const element = elements[0];
            const sprite = sprites.resolve(element);
            if (sprite && sprite.operators.editPointsOperator) {
                editPointsControl.show();
            } else {
                editPointsControl.hide();
            }
        } else {
            editPointsControl.hide();
        }
    }
})();

/**
 * show/hide edit box button on select element
 */
(async () => {
    const elementsHasBeenSet = findMethodIterator(holder.elementsHasBeenSet);
    for await (const elements of elementsHasBeenSet) {
        if (elements.length === 1 && editHub.editMode === 'off') {
            const element = elements[0];
            const sprite = sprites.resolve(element);
            if (sprite && sprite.operators.editBoxOperator) {
                editBoxControl.show();
            } else {
                editBoxControl.hide();
            }
        } else {
            editBoxControl.hide();
        }
    }
})();

/**
 * 
 */
(async () => {
    const elementsHasBeenSet = findMethodIterator(holder.elementsHasBeenSet);
    for await (const elements of elementsHasBeenSet) {
        if (elements.length !== 1) {
            editHub.purge();
        }
    }
})();

/**
 * edit on pick
 */
(async () => {
    const events = findMethodIterator(picker.onMouseup);
    for await (const _event of events) {
        if (editHub.editMode !== 'off' && holder.elements.length === 1) {
            editHub.startEditing(holder.elements[0]);
        }
    }
})();

(async () => {
    const dispathces = findMethodIterator(editHub.dispatchEditMode);
    for await (const mode of dispathces) {
        if (mode !== 'off' && holder.elements.length === 1) {
            editHub.startEditing(holder.elements[0]);
        }
    }
})();

/**
 * edit on copy
 */
(async () => {
    const copyElement = findMethodIterator(elementListener.copyOneElement);
    for await (const _element of copyElement) {
        if (editHub.editMode !== 'off') {
            editHub.startEditing(holder.elements[0]);
        }
    }
})();

/**
 * 
 */
(async () => {
    const toggles = findMethodIterator(editHub.editModeSet);
    for await (const _val of toggles) {
        holder.elements = [...holder.elements];
    }
})();


/**
 * //
 */
const appearanceRequestCallback = async (response: Promise<AppearanceResponse>) => {
    const { name, value } = await response;
    holder.elements.forEach(el => {
        el.setAttribute(name, value);
    });
};
(async () => {
    const requests = findMethodIterator(fillControl.makeAppearanceGetRequest);
    for await (const request of requests) {
        appearanceRequestCallback(request);
    }
})();
(async () => {
    const requests = findMethodIterator(strokeControl.makeAppearanceGetRequest);
    for await (const request of requests) {
        appearanceRequestCallback(request);
    }
})();

/**
 * Create elements by hud shape tools
 */
(async () => {
    const creates = findMethodIterator(shapesOutlet.createShape);
    for await (const shapeName of creates) {
        inverseInteractiveEndpoint.makeSetRequest({});
        const sprite = sprites.resolve(shapeName);
        if (sprite && sprite.operators.createOperator) {
            sprite.operators.createOperator.create(shapeName, {});
        }
    }
})();

/**
 * group/ungroup selected elements by button
 */
(async () => {
    const group = findMethodIterator(groupControls.fireGroupEvent);
    for await (const _event of group) {
        groupListener.group();
    }
})();
(async () => {
    const ungroup = findMethodIterator(groupControls.fireUngroupEvent);
    for await (const _event of ungroup) {
        groupListener.ungroup();
    }
})();

/**
 * rebuild container and selection on element copy
 */
(async () => {
    const copyElement = findMethodIterator(elementListener.copyOneElement);
    for await (const _element of copyElement) {
        setTimeout(() => {
            guides.setContainerStyles();
            guides.setSelectionStyles(holder.elements);
        }, 0);
    }
})();


/**
 * remove editing on delete
 */
(async () => {
    const deleteElement = findMethodIterator(elementListener.deleteElement);
    for await (const _void of deleteElement) {
        editHub.takeActiveElement(null);
        editHub.takeCancelationFn(() => {});
    }
})();

const listAttributesListener = new ListAttributesListener(listAttributesPipe, holder);
listAttributesListener.listen();

/**
 * send request to host to show info message on hint
 */
(async () => {
    const hintEvents = findMethodIterator(hints.fireHintEvent);
    for await (const hintKey of hintEvents) {
        infomessageEndpoint.makeSetRequest(hintKey);
    }
})();

const undoListener = new UndoListener(undoPipe, holder);
undoListener.listen();

/**
 * draw guides and set artboard controls on undo/redo
 */
(async () => {
    const renders = findMethodIterator(undoListener.renderState);
    for await (const _state of renders) {
        guides.setContainerStyles();
        guides.setSelectionStyles(holder.elements);
        artboardControls.updateArtboardWidth(artboard.width);
        artboardControls.updateArtboardHeight(artboard.height);
    }
})();

const configListener = new ConfigListener(configPipe, appearance);
configListener.listen();

/**
 * Stream of clicks on 'edit point' button inside editing window
 * @todo use editHub.startEditing somehow
 */
(async () => {
    const clicks = findMethodIterator(editPointsControl.editPoints);
    for await ( const _event of clicks ) {
        // inverseInteractiveEndpoint.makeSetRequest({});
        // editHub.startEditing(holder.elements[0]);
        const element = holder.elements[0];
        if (element) {
            const sprite = sprites.resolve(element);
            if (sprite && sprite.operators.editPointsOperator) {
                const fn = sprite.operators.editPointsOperator.edit(element);
                editHub.takeActiveElement(element);
                editHub.takeCancelationFn(fn);
            }
        }
    }
})();

/**
 * Stream of clicks onn 'edit box' button inside editing window
 * @todo use editHub.startEditing somehow
 */
(async () => {
    const events = findMethodIterator(editBoxControl.editBox);
    for await (const _event of events) {
        const element = holder.elements[0];
        if (element) {
            const sprite = sprites.resolve(element);
            if (sprite && sprite.operators.editBoxOperator) {
                const fn = sprite.operators.editBoxOperator.edit(element);
                editHub.takeActiveElement(element);
                editHub.takeCancelationFn(fn);
            }
        }
    }
})();