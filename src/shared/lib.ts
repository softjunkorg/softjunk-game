import * as Variables from "./variables";

let is_initiazated = false;

export function CreateThread(handler: () => void): void {
    function call(resource) {
        if (resource === Variables.RESOURCE_NAME) {
            is_initiazated = true;
            handler();
        }
    }

    if (is_initiazated) {
        call(Variables.RESOURCE_NAME);
    }

    if (!is_initiazated)
        if (Variables.IS_RESOURCE_SERVER) on("onServerResourceStart", call);
        else on("onClientResourceStart", call);
}

if (Variables.IS_RESOURCE_SERVER)
    on("onServerResourceStart", () => (is_initiazated = true));
else on("onClientResourceStart", () => (is_initiazated = true));

export function CreatePromise<T = any>(
    handler: (
        resolve: (value: any) => void,
        reject: (reason?: any) => void,
    ) => void,
): Promise<T> {
    return new Promise(handler);
}

export function Wait(milliseconds: number): Promise<any> {
    return CreatePromise(resolve => setTimeout(resolve, milliseconds));
}
