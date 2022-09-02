import "@citizenfx/client";

export function GetMinimapPosition() {
    const [x, y] = GetActiveScreenResolution();
    const aspect_ratio = GetAspectRatio(false);
    const hidden = IsRadarHidden();
    const safezone = GetSafeZoneSize();

    const safezone_x = 1.0 / 20.0;
    const safezone_y = 1.0 / 20.0;
    const xscale = 1.0 / x;
    const yscale = 1.0 / y;

    const width = xscale * (x / (4 * aspect_ratio)) * x;
    const height = !hidden ? yscale * (y / 5.674) * y : 0;

    return {
        width,
        height,
        X: xscale * (x * (safezone_x * (Math.abs(safezone - 1.0) * 10))) * x,
        Y:
            !hidden &&
            yscale * (y * (safezone_y * (Math.abs(safezone - 1.0) * 10))) * y,
    };
}
