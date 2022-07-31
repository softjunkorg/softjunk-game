import variables from "./variables";

let is_initiazated = false;

export function CreateThread(handler: () => void): void {
    function call(resource) {
        if (resource === variables.RESOURCE_NAME) {
            is_initiazated = true;
            handler();
        }
    }

    if (is_initiazated) {
        call(variables.RESOURCE_NAME);
    }

    if (!is_initiazated)
        if (variables.IS_RESOURCE_SERVER) on("onServerResourceStart", call);
        else on("onClientResourceStart", call);
}

if (variables.IS_RESOURCE_SERVER)
    on("onServerResourceStart", () => (is_initiazated = true));
else on("onClientResourceStart", () => (is_initiazated = true));

export function CreatePromise(
    handler: (
        resolve: (value: unknown) => void,
        reject: (reason?: any) => void,
    ) => void,
): Promise<unknown> {
    return new Promise(handler);
}

export function Wait(milliseconds: number): Promise<unknown> {
    return CreatePromise(resolve => setTimeout(resolve, milliseconds));
}
