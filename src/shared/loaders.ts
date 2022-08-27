import { CreatePromise } from "./lib";

const maxTimeout = 60 * 5;

export function LoadModel(model: string | number): Promise<boolean> {
    return CreatePromise(resolve => {
        if (IsModelValid(model)) {
            const hash = typeof model === "string" ? GetHashKey(model) : model;
            RequestModel(hash);

            const tick = setTick(() => {
                if (HasModelLoaded(hash)) {
                    clearTick(tick);
                    resolve(true);
                }
            });

            setTimeout(() => {
                clearTick(tick);
                resolve(false);
            }, maxTimeout);
        }
    });
}

export function LoadStreamedTextureDict(dict: string): Promise<boolean> {
    return CreatePromise(resolve => {
        RequestStreamedTextureDict(dict, false);

        const tick = setTick(() => {
            if (HasStreamedTextureDictLoaded(dict)) {
                clearTick(tick);
                resolve(true);
            }
        });

        setTimeout(() => {
            clearTick(tick);
            resolve(false);
        }, maxTimeout);
    });
}

export function LoadAnimDict(dict: string): Promise<boolean> {
    return CreatePromise(resolve => {
        RequestAnimDict(dict);

        const tick = setTick(() => {
            if (HasAnimDictLoaded(dict)) {
                clearTick(tick);
                resolve(true);
            }
        });

        setTimeout(() => {
            clearTick(tick);
            resolve(false);
        }, maxTimeout);
    });
}

export function LoadResourceJson<T>(
    resource: string,
    fileName: string,
): T extends null ? JSON : T {
    return JSON.parse(LoadResourceFile(resource, fileName));
}
