import * as vscode from "vscode";
import { PropertyCompletionProvider } from "./completions/properties";
import { FunctionCompletionProvider } from "./completions/functions";
import { ClassNameCompletionProvider } from "./completions/className";
import { FunctionParameterCompletionProvider } from "./completions/functionParam";

import classDefinitions from "./data/classDefinitions";

const fileSelector = {
	scheme: "file",
	language: "lua",
};

export async function activate(context: vscode.ExtensionContext) {
	const classDefs = await classDefinitions();

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			fileSelector,
			new PropertyCompletionProvider(classDefs),
			"{"
		),
		vscode.languages.registerCompletionItemProvider(
			fileSelector,
			new FunctionCompletionProvider(),
			"."
		),
		vscode.languages.registerCompletionItemProvider(
			fileSelector,
			new ClassNameCompletionProvider(classDefs),
			'"',
			"'",
			"`"
		),
		vscode.languages.registerCompletionItemProvider(
			fileSelector,
			new FunctionParameterCompletionProvider(),
			"(",
			'"',
			"'",
			"`",
            "."
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
