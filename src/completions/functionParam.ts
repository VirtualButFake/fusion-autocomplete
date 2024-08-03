import regex from '../data/regex';
import { FunctionCompletionProvider } from './functions';
import { PropertyCompletionProvider } from './properties';
import * as vscode from 'vscode';

// support only 1 kind of syntax: func("x") (so 1 string param)

export class FunctionParameterCompletionProvider
    implements vscode.CompletionItemProvider
{
    public async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        const { existingFunctions } =
            await FunctionCompletionProvider.getDefinedFunctions(document);
        // see which one we're currently editing, if any (editing = within string)
        let lines = document.getText().split('\n');
        const line = lines[position.line];
        const linePrefix = line.substring(0, position.character);
        lines[position.line] = linePrefix;
        lines = lines.slice(0, position.line + 1);

        const combinedLines = lines.join('\n');

        // check if we're currently in a New call
        const match = combinedLines.match(regex.getFunctionName);

        // see if we can find this in existingfunctions
        const matchingFunction = existingFunctions.find(
            (func) => func.varName === match?.[1]
        );

        if (
            matchingFunction &&
            matchingFunction.function.updateFunction &&
            match &&
            match.index
        ) {
            // back up our position to the start of the specialkey, so outside the function call
            const newPosition = document.positionAt(
                match.index + match[1].length
            );
            const classNameMatch =
                await PropertyCompletionProvider.getClassName(
                    document,
                    newPosition,
                    true
                );

            if (!classNameMatch) {
                return;
            }

            return matchingFunction.function.updateFunction(
                document,
                position,
                classNameMatch[2]
            );
        }

        return [];
    }
}
