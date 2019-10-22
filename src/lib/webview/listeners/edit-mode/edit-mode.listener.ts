import { webviewEndpoint } from "@/webview/services/webview-endpoint";
import { editPointsHub } from "@/webview/services/edit-points-hub";
import { editModePipe } from "../../../shared/pipes/edit-mode.pipe";


export class EditModeListener {
    private editModeClient = webviewEndpoint.createFromPipe(editModePipe);

    listen() {
        this.editModeClient.listenSetRequest(
            _request => true,
            (request, _true) => {
                const { mode } = request;
                editPointsHub.dispatchEditMode(mode);
            },
        );
    }

}
