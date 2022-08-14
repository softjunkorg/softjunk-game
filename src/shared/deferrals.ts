export function FormatCard(card: object, object: object) {
    const stringified = JSON.stringify(card);
    const regex = /{{(.*?)}}/g;
    let result: string = stringified;

    stringified.match(regex)?.map(ex => {
        const f = object[ex.replace(/[{{()}}]/g, "")];
        result = result.replace(ex, f);
    });

    return result;
}
