import { workspace, window } from "vscode";

export function findAllMatches(text: string, regexStr: string) {
    const regex = new RegExp(regexStr, "g");
    const matches = [...text.matchAll(regex)];
    return matches;
}

export function countMatches(text: string, regexStr: string) {
    const matches = findAllMatches(text, regexStr);
    return matches.length;
}

export function uniqueMatches(text: string, regexStr: string, capturingGroup: number) {
    const matches = findAllMatches(text, regexStr);
    const uniqueValues = Array.from(
        new Set(matches.map(match => match[capturingGroup])) // Extract group 1 values and create a Set to ensure uniqueness
    );
    return uniqueValues;
}

export function getFirstOccurance(text: string, regexStr: string) {
    const matches = findAllMatches(text, regexStr);
    return matches.length > 0 ? matches[0] : null;
}

export function getLastOccurance(text: string, regexStr: string) {
    const matches = findAllMatches(text, regexStr);
    return matches.length > 0 ? matches[matches.length-1] : null;
}

export function getPrevOccurance(text: string, currentIndex: number, regexStr: string) {
    const textBeforeCurrentPos = text.substring(0, currentIndex);
    const regex = new RegExp(regexStr, "g");
    const matches = [];
    let match;
    while ((match = regex.exec(textBeforeCurrentPos)) !== null) {
        matches.push(match);
    }
    return matches.length > 0 ? matches[matches.length - 1] : null;
}

export function getIndexOfPrevOccurance(text: string, currentIndex: number, regexStr: string) {
    const match = getPrevOccurance(text, currentIndex, regexStr);
    return match ? match.index : null;
}

export function getNextOccurance(text: string, currentIndex: number, regexStr: string) {
    const regex = new RegExp(regexStr, "g");
    regex.lastIndex = currentIndex;
    const match = regex.exec(text);
    return match ? match : null;
}

export function getIndexOfNextOccurance(text: string, currentIndex: number, regexStr: string) {
    const match = getNextOccurance(text, currentIndex, regexStr);
    return match ? match.index : null;
}

export function matchTraceTimestamps(text: string) {
    const timestampRegex = workspace.getConfiguration('tracetool').get<string>('regex.traceTimestamp');
    if (!timestampRegex) {
        window.showErrorMessage("Setting 'regex.traceTimestamp' is undefined");
        return []; 
    }
    return findAllMatches(text, timestampRegex);
}