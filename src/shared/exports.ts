import { CreateThread, CreatePromise } from "./lib";
import { RESOURCE_NAME, IS_RESOURCE_SERVER } from "./variables";
import { GenRandomInt } from "./numbers";
import DeepProxy from "proxy-deep";
import "@citizenfx/client";
import "@citizenfx/server";

type CheckPromise<U> = U extends Promise<any> ? U : Promise<U>;

export interface Method {
    name: string;
    handler: (...args: any[]) => void;
}

type Transformer<T, F> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer U
        ? F extends true
            ? (clientTarget: number, ...args: A) => CheckPromise<U>
            : (...args: A) => Promise<U>
        : Transformer<T[K], F>;
};

export function CreateResourceExport<T>(object?: T): T {
    const methods: Method[] = [];
    const resource = RESOURCE_NAME;
    const isServer = IS_RESOURCE_SERVER;

    function mapObject(object: any) {
        const entries: string[] = [];

        function isObject(obj: object) {
            return !!obj && obj.constructor === Object;
        }

        function mapper(obj: object, dkey = "") {
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

    function fetchFromObject(obj: any, prop: string): any {
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

    onNet(
        `${resource}.request`,
        async (
            name: string,
            args: any[],
            incomingIsServer: boolean,
            requestID: string,
        ) => {
            const method = methods.find(m => m.name === name);
            const _source = (global as any).source;

            if (
                (isServer && incomingIsServer) ||
                (!isServer && incomingIsServer) ||
                (!isServer && !incomingIsServer)
            ) {
                emit(`${resource}:${requestID}.received`, name);
            }

            if (isServer) {
                if (!incomingIsServer)
                    emitNet(`${resource}:${requestID}.received`, _source, name);
            } else {
                if (incomingIsServer)
                    emitNet(`${resource}:${requestID}.received`, name);
                else emit(`${resource}:${requestID}.received`, name);
            }

            async function execute() {
                if (method) {
                    const result = await method.handler(...args);

                    if (
                        (isServer && incomingIsServer) ||
                        (!isServer && incomingIsServer) ||
                        (!isServer && !incomingIsServer)
                    ) {
                        emit(`${resource}:${requestID}.response`, name, result);
                    }

                    if (isServer) {
                        if (!incomingIsServer)
                            emitNet(
                                `${resource}:${requestID}.response`,
                                _source,
                                name,
                                result,
                            );
                    } else {
                        if (incomingIsServer)
                            emitNet(
                                `${resource}:${requestID}.response`,
                                name,
                                result,
                            );
                        else
                            emit(
                                `${resource}:${requestID}.response`,
                                name,
                                result,
                            );
                    }
                } else {
                    if (!isServer && incomingIsServer) {
                        emit(
                            `${resource}:${requestID}.error`,
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

    return object as unknown as T;
}

function RequestResolver(target: object, thisArg: any, args: any[]) {
    const resource = this.resource;
    const sameResourceType = this.sameResourceType;
    const isServer = IS_RESOURCE_SERVER;

    let path: any = [];

    function isNumeric(value: any) {
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
                const requestID = GenRandomInt(0, 1000000000);

                const interval = setInterval(function () {
                    if (
                        (isServer && sameResourceType) ||
                        (!isServer && sameResourceType)
                    ) {
                        emit(
                            `${resource}.request`,
                            path,
                            args,
                            isServer,
                            requestID,
                        );
                    }

                    if (!isServer && !sameResourceType) {
                        emitNet(
                            `${resource}.request`,
                            path,
                            args,
                            isServer,
                            requestID,
                        );
                    }

                    if (isServer) {
                        if (!sameResourceType)
                            emitNet(
                                `${resource}.request`,
                                _source,
                                path,
                                nested_args,
                                isServer,
                                requestID,
                            );
                    } else {
                        if (sameResourceType)
                            emit(
                                `${resource}.request`,
                                path,
                                args,
                                isServer,
                                requestID,
                            );
                    }
                }, 500);

                onNet(
                    `${resource}:${requestID}.response`,
                    (p: string, result: any) => {
                        if (path === p) resolve(result);
                    },
                );

                onNet(`${resource}:${requestID}.received`, (p: string) => {
                    if (path === p) clearInterval(interval);
                });

                onNet(`${resource}:${requestID}.error`, (error: string) => {
                    throw new Error(error);
                });
            });
        });
    }

    return resource;
}

export function GetResourceExport<T = any, F extends boolean = false>(
    sameResourceType = true,
    resource: string = RESOURCE_NAME,
): Transformer<T, F> {
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
