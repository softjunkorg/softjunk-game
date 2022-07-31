export interface Identifiers {
    steam: string;
    license: string;
    live: string;
    discord: string;
    fivem: string;
    license2: string;
    ip: string;
}

export function ExtractIdentifiers(src: string): Partial<Identifiers> {
    const identifiers = {
        steam: null,
        license: null,
        live: null,
        discord: null,
        fivem: null,
        license2: null,
        ip: GetPlayerEndpoint(src),
    };

    getPlayerIdentifiers(src).map(i => {
        const [key] = i.split(":");
        if (key !== "ip") identifiers[key] = i;
    });

    return identifiers;
}
