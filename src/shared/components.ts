import "@citizenfx/client";

export function GetMinimapPosition() {
    const [resX, resY] = GetActiveScreenResolution();
    const aspectRatio = GetAspectRatio(true);
    const scaleX = 1 / resX;
    const scaleY = 1 / resY;
    const minimap = {
        width: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        X: 0,
        Y: 0,
    };

    /* GFX */
    SetScriptGfxAlign(76, 66);
    const [minimapRawX, minimapRawY] = GetScriptGfxPosition(
        -0.005,
        0.004 + -0.188888,
    );
    minimap.width = scaleX * (resX / (4 * aspectRatio)) * resX;
    minimap.height = scaleY * (resY / 5.674) * resY;
    ResetScriptGfxAlign();

    /* Positions */
    minimap.left = minimapRawX * resX + 10;
    minimap.right = minimapRawX + minimap.width;
    minimap.top = minimapRawY * resY + 10;
    minimap.bottom = minimapRawY + minimap.height;
    minimap.X = minimapRawX + minimap.width / 2;
    minimap.Y = minimapRawY + minimap.height / 2;

    return minimap;
}
