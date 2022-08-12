import {
    CreateThread,
    CreatePromise,
} from "./lib";
import { RESOURCE_NAME, IS_RESOURCE_SERVER } from "./variables";
import DeepProxy from "proxy-deep";
import "@citizenfx/server";

export interface Method {
    name: string;
    handler: (...args: any[]) => void;
}

export type Promisified<T> = {
    [K in keyof T]: T[K] extends (...args: any) => infer R
        ? (...args: Parameters<T[K]>) => Promise<R>
        : T;
};

export function CreateResourceExport(object?: object) {
    let methods: Method[] = [];
    const resource = RESOURCE_NAME;
    const isServer = IS_RESOURCE_SERVER;

    function mapObject(object) {
        const entries = [];

        function isObject(obj) {
            return !!obj && obj.constructor === Object;
        }

        function mapper(obj, dkey = "") {
            Object.entries(obj).map(e => {
                const key = e[0];
                const value = e[1];
                const separator = dkey === "" ? "" : ".";

                if (isObject(value)) {
                    mapper(value, `${dkey}${separator}${key}`);
                } else if (Array.isArray(value)) {
                    throw new Error(
                        "GameAPI: An array cannot be rendered on the export object!",
                    );
                } else {
                    entries.push(`${dkey}${separator}${key}`);
                }
            });
        }

        if (isObject(object)) {
            mapper(object);
        } else {
            throw new Error("GameAPI: The create argument was not an object!");
        }

        return entries;
    }

    function fetchFromObject(obj, prop) {
        if (typeof obj === "undefined") {
            return false;
        }

        const _index = prop.indexOf(".");
        if (_index > -1) {
            return fetchFromObject(
                obj[prop.substring(0, _index)],
                prop.substr(_index + 1),
            );
        }

        return obj[prop];
    }

    if (object) {
        const entries = mapObject(object);
        entries.map(e => {
            const handler = fetchFromObject(object, e);
            methods.push({ name: e, handler: handler });
        });
    }

    function Add(method: string, handler: (...args: any[]) => void) {
        if (!methods.find(m => m.name === method)) {
            methods.push({ name: method, handler });
            return true;
        } else {
            throw new Error(`GameAPI: The method ${method} alredy exists!`);
        }
    }

    function Rem(method: string) {
        if (methods.find(m => m.name === method)) {
            methods = methods.filter(m => m.name !== method);
            return true;
        } else {
            throw new Error(`GameAPI: The method ${method} don't exists!`);
        }
    }

    onNet(
        `${resource}.request`,
        async (name: string, args: any[], incomingIsServer: boolean) => {
            const method = methods.find(m => m.name === name);
            const _source = (global as any).source;

            if (
                (isServer && incomingIsServer) ||
                (!isServer && incomingIsServer) ||
                (!isServer && !incomingIsServer)
            ) {
                emit(`${resource}.received`, name);
            }

            if (isServer) {
                if (!incomingIsServer)
                    emitNet(`${resource}.received`, _source, name);
            } else {
                if (incomingIsServer) emitNet(`${resource}.received`, name);
                else emit(`${resource}.received`, name);
            }

            async function execute() {
                if (method) {
                    const result = await method.handler(...args);

                    if (
                        (isServer && incomingIsServer) ||
                        (!isServer && incomingIsServer) ||
                        (!isServer && !incomingIsServer)
                    ) {
                        emit(`${resource}.response`, name, result);
                    }

                    if (isServer) {
                        if (!incomingIsServer)
                            emitNet(
                                `${resource}.response`,
                                _source,
                                name,
                                result,
                            );
                    } else {
                        if (incomingIsServer)
                            emitNet(`${resource}.response`, name, result);
                        else emit(`${resource}.response`, name, result);
                    }
                } else {
                    if (!isServer && incomingIsServer) {
                        emit(
                            `${resource}.error`,
                            `GameAPI: The request method ${name} don't exists!`,
                        );
                    }
                    throw new Error(
                        `GameAPI: The request method ${name} don't exists!`,
                    );
                }
            }

            CreateThread(execute);
        },
    );

    return { Add, Rem };
}

function RequestResolver(target: object, thisArg: any, args: any[]) {
    const resource = this.resource;
    const sameResourceType = this.sameResourceType;
    const isServer = IS_RESOURCE_SERVER;

    let path: any = [];

    function isNumeric(value) {
        return /^-?\d+$/.test(value);
    }

    this.path.map((p: string) => {
        if (isNumeric(p)) {
            path[path.length - 1] += `[${p}]`;
        } else {
            path.push(p);
        }
    });

    path = path.join(".");

    if (path) {
        return CreatePromise(function (resolve) {
            CreateThread(function () {
                const _source = args[0];
                const nested_args = args.filter((_, i) => i !== 0);
                const interval = setInterval(function () {
                    if (
                        (isServer && sameResourceType) ||
                        (!isServer && sameResourceType)
                    ) {
                        emit(`${resource}.request`, path, args, isServer);
                    }

                    if (!isServer && !sameResourceType) {
                        emitNet(`${resource}.request`, path, args, isServer);
                    }

                    if (isServer) {
                        if (!sameResourceType)
                            emitNet(
                                `${resource}.request`,
                                _source,
                                path,
                                nested_args,
                                isServer,
                            );
                    } else {
                        if (sameResourceType)
                            emit(`${resource}.request`, path, args, isServer);
                    }
                }, 500);

                onNet(`${resource}.response`, (p: string, result: any) => {
                    if (path === p) resolve(result);
                });

                onNet(`${resource}.received`, (p: string) => {
                    if (path === p) clearInterval(interval);
                });

                onNet(`${resource}.error`, (error: string) => {
                    throw new Error(error);
                });
            });
        });
    }

    return resource;
}

export function GetResourceExport<T = any>(
    sameResourceType = true,
    resource: string = RESOURCE_NAME,
): Promisified<T> {
    return new DeepProxy<any>(
        {},
        {
            get() {
                return this.nest(() => {});
            },
            apply: RequestResolver,
        },
        {
            userData: {
                resource: resource,
                sameResourceType: sameResourceType,
            },
        },
    );
}
