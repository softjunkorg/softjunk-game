export function SendNUIData(action: string, data: any): void {
    return SendNUIMessage(JSON.stringify({ action, data }));
}

export function RegisterNUICallback(
    name: string,
    action: (...result: any[]) => void,
): void {
    RegisterNuiCallbackType(name);
    on(`__cfx_nui:${name}`, action);
}
