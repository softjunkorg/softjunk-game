import { CreatePromise } from "./lib";

export function LoadModel(model: string): Promise<any> {
    return CreatePromise(resolve => {
        const hash = IsModelValid(model) ? parseInt(model) : GetHashKey(model);

        RequestModel(hash);

        const tick = setTick(() => {
            if (HasModelLoaded(hash)) {
                clearTick(tick);
                resolve(true);
            }
        });
    });
}

export function LoadStreamedTextureDict(dict: string): Promise<any> {
    return CreatePromise(resolve => {
        RequestStreamedTextureDict(dict, false);

        const tick = setTick(() => {
            if (HasStreamedTextureDictLoaded(dict)) {
                clearTick(tick);
                resolve(true);
            }
        });
    });
}

export function LoadAnimDict(dict: string): Promise<any> {
    return CreatePromise(resolve => {
        RequestAnimDict(dict);

        const tick = setTick(() => {
            if (HasAnimDictLoaded(dict)) {
                clearTick(tick);
                resolve(true);
            }
        });
    });
}

export function LoadResourceJson(resource: string, fileName: string): JSON {
    return JSON.parse(LoadResourceFile(resource, fileName));
}
