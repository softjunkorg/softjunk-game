export function GenRandomInt(min: number, max: number): number {
    return Math.floor(
        Math.random() * (Math.floor(max) - Math.ceil(min)) + Math.ceil(min)
    );
}
