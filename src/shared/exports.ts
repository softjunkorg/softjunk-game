import { CreateThread, CreatePromise } from "./lib";
import DeepProxy from "proxy-deep";
import Variables from "./variables";

export interface Method {
    name: string;
    handler: (...args: any[]) => void;
}

export function CreateResourceExport(object?: object) {
    let methods: Method[] = [];
    const resource = Variables.RESOURCE_NAME;
    const isServer = Variables.IS_RESOURCE_SERVER;

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
                    value.map((v, i) => {
                        if (isObject(v)) {
                            mapper(v, `${dkey}${separator}${key}[${i}]`);
                        } else {
                            entries.push(`${dkey}${separator}${key}[${i}]`);
                        }
                    });
                } else {
                    entries.push(`${dkey}${separator}${key}`);
                }
            });
        }

        if (isObject(object)) {
            mapper(object);
        } else {
            throw new Error("Not an object");
        }

        return entries;
    }

    const entries = mapObject(object);

    entries.map(e => {
        methods.push({ name: e, handler: object[e] });
    });

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
            }

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
                        emitNet(`${resource}.response`, _source, name, result);
                } else {
                    if (incomingIsServer)
                        emitNet(`${resource}.response`, name, result);
                }
            } else {
                throw new Error(
                    `GameAPI: The request method ${name} don't exists!`,
                );
            }
        },
    );

    return { Add, Rem };
}

function RequestResolver(target: object, thisArg: any, args: any[]) {
    const resource = this.resource;
    const local = this.local;
    const path = this.path.join(".");
    const isServer = Variables.IS_RESOURCE_SERVER;

    if (path) {
        return CreatePromise(function (resolve) {
            CreateThread(function () {
                const _source = args[0];
                const nested_args = args.filter((_, i) => i !== 0);
                const interval = setInterval(function () {
                    if (
                        (isServer && local) ||
                        (!isServer && local) ||
                        (!isServer && !local)
                    ) {
                        emit(`${resource}.request`, path, args, isServer);
                    }

                    if (isServer) {
                        if (!local)
                            emitNet(
                                `${resource}.request`,
                                _source,
                                path,
                                nested_args,
                                isServer,
                            );
                    } else {
                        if (local)
                            emitNet(
                                `${resource}.request`,
                                path,
                                args,
                                isServer,
                            );
                    }
                }, 500);

                onNet(`${resource}.response`, (p: string, result: any) => {
                    if (path === p) resolve(result);
                });

                onNet(`${resource}.received`, (p: string) => {
                    if (path === p) clearInterval(interval);
                });
            });
        });
    }

    return resource;
}

export function GetResourceExport(
    local = true,
    resource: string = Variables.RESOURCE_NAME,
): any {
    return new DeepProxy(
        {},
        {
            get() {
                return this.nest(function () {});
            },
            apply: RequestResolver,
        },
        {
            userData: {
                resource: resource,
                local: local,
            },
        },
    );
}
