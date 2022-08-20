import { RESOURCE_NAME } from "./variables";

export function CreateDebugLine(message: string, customSender?: string): void {
    const split = ((customSender || RESOURCE_NAME).charCodeAt(0) - 97)
        .toString()
        .split("");
    const number = Number(split[1] ? split[1] : split[0]) || 1;

    console.log(
        `[^${number}${
            (customSender || RESOURCE_NAME).charAt(0).toUpperCase() +
            (customSender || RESOURCE_NAME).slice(1)
        }^0]: ${message}`,
    );
}
