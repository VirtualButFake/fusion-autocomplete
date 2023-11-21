import * as vscode from "vscode";
import regex from "../data/regex";
import { Function } from "../data/fusionDefinitions";
import fusionDefinitions from "../data/fusionDefinitions";
import { toCamelCase, toSnakeCase, toPascalCase } from "js-convert-case";
import { PropertyCompletionProvider } from "./properties";

interface functionData {
	RegEx: RegExp;
	ValidationFunction: (
		matches: RegExpMatchArray,
		document: vscode.TextDocument,
		position: number,
		text: string
	) => boolean;
}

const functionValidityRegex: functionData[] = [
	// function declaration
	{
		RegEx: regex.functionDecl,
		ValidationFunction: () => true,
	},
	// variable declaration
	{
		RegEx: regex.localVarDecl,
		ValidationFunction: () => true,
	},
	// table field
	{
		RegEx: regex.tableField,
		ValidationFunction: (match: RegExpMatchArray) => {
			if (match && match[0].match(regex.bracketField)) {
				return false;
			}

			// make sure this regex isn't registering strings just outside a table as a table field
			if (match.index) {
				let bracketCount = 1;
				let index = match[0].length;

				while (index > 0) {
					index--;

					const char = match[0][index];

					if (char === "{") {
						bracketCount++;
					} else if (char === "}") {
						bracketCount--;
					}
				}

				return bracketCount === 2;
			}

			return true;
		},
	},
	// string
	{
		RegEx: regex.string,
		ValidationFunction: (
			matches: RegExpMatchArray,
			document: vscode.TextDocument,
			position: number,
			text: string
		) => {
			// go through all matches, see if our cursor is inside a match
			for (const match of matches) {
				const matchIndex = text.indexOf(match);
				const matchEndIndex = matchIndex + match.length;

				if (position >= matchIndex && position <= matchEndIndex) {
					return true;
				}
			}

			return false;
		},
	},
];

function doCasing(input: string) {
	let casedInput = input;
	const casingMode =
		vscode.workspace.getConfiguration("fusionautocomplete").get("casingMode") ??
		"camelCase";

	if (casingMode === "snake_case") {
		casedInput = toSnakeCase(casedInput);
	} else if (casingMode === "PascalCase") {
		casedInput = toPascalCase(casedInput);
	} else if (casingMode === "camelCase") {
		casedInput = toCamelCase(casedInput);
	}

	return casedInput;
}

export class FunctionCompletionProvider
	implements vscode.CompletionItemProvider
{
	static async getDefinedFunctions(document: vscode.TextDocument) {
		const text = document.getText();
		const fusionVersion: string =
			vscode.workspace
				.getConfiguration("fusionautocomplete")
				.get("fusionVersion") ?? "0.2";

		const aliases: string[] = (
			(vscode.workspace
				.getConfiguration("fusionautocomplete")
				.get("fusionAliases") as string[]) ?? []
		).map((alias) => alias.toLowerCase());

		const existingFunctions: {
			name: string;
			varName: string;
			startPosition: number;
			endPosition: number;
			function: Function;
		}[] = [];

		let fusionData:
			| {
					name: string;
					position: number;
			  }
			| undefined;

		for (const match of text.matchAll(regex.varName)) {
			if (
				aliases.includes(match[1].toLowerCase()) &&
				match.index !== undefined
			) {
				fusionData = {
					name: match[1],
					position: match.index + match[0].length,
				};
				break;
			}
		}

		if (fusionData) {
			for (const match of text.matchAll(
				/local\s*([A-Za-z0-9_]+)\s*=\s*(\w+).(\w+)/gi
			)) {
				const moduleName = match[2];
				const propertyName = match[3];

				const functionDefinition: Function =
					fusionDefinitions[fusionVersion].functions[propertyName];

				if (
					moduleName === fusionData.name &&
					match.index &&
					functionDefinition
				) {
					existingFunctions.push({
						name: propertyName,
						varName: match[1],
						startPosition: match.index,
						endPosition: match.index + match[0].length,
						function: functionDefinition,
					});
				}
			}

			return { existingFunctions, tempData: fusionData };
		}

		return { existingFunctions: [], tempData: undefined };
	}

	public async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	) {
		const fusionVersion: string =
			vscode.workspace
				.getConfiguration("fusionautocomplete")
				.get("fusionVersion") ?? "0.2";

		let lines = document.getText().split("\n");
		const line = lines[position.line];
		const linePrefix = line.substring(0, position.character);
		lines[position.line] = linePrefix;
		lines = lines.slice(0, position.line + 1);

		const combinedLines = lines.join("\n");

		// iterate through all regexes, run validationfunction. if any is true, don't provide completion
		const scaledPosition =
			position.character + combinedLines.length - linePrefix.length;

		for (const regex of functionValidityRegex) {
			const preMatch = combinedLines.match(regex.RegEx);

			if (
				preMatch &&
				regex.ValidationFunction(
					preMatch,
					document,
					scaledPosition,
					combinedLines
				)
			) {
				return [];
			}
		}

		const bracketMatch = combinedLines.match(regex.bracketField);

		const { existingFunctions, tempData } =
			await FunctionCompletionProvider.getDefinedFunctions(document);

		if (!tempData) {
			return;
		}

		const fusionData = tempData as { name: string; position: number };

		function getAdditionalEdits(
			key: string,
			func: Function,
			item: vscode.CompletionItem
		) {
			// convert endPosition to line and character
			// get all existing functions & add this key, then sort based on configuration & set position to end of function before ours

			let names: {
				name: string;
				category: string;
				importTitle: string;
				varName?: string;
			}[] = [];

			for (const func of existingFunctions) {
				names.push({
					name: func.name,
					category: func.function.category,
					importTitle: func.function.importTitle,
					varName: func.varName,
				});
			}

			names.push({
				name: key,
				category: func.category,
				importTitle: func.importTitle,
			});

			const sortMode =
				vscode.workspace
					.getConfiguration("fusionautocomplete")
					.get("groupingMode") ?? "alphabetical";

			if (sortMode === "alphabetical") {
				names.sort((a, b) => a.name.localeCompare(b.name));
			} else if (sortMode === "category") {
				names.sort((a, b) => {
					// first sort on category, and then on it's name (alphabetical). categories should be grouped together
					if (a.category === b.category) {
						return a.name.localeCompare(b.name);
					}

					return a.category.localeCompare(b.category);
				});
			}

			/*// find the function 1 above our own
			const index = names.findIndex((name) => name.name === key);
			const nextFunction = names[index + 1];

			const startPosition: number = (
				nextFunction
					? existingFunctions.find(
							(existingFunction) => existingFunction.name === nextFunction.name
					  )?.startPosition
					: fusionData.position
			) as number;*/

			/*let prefix = "";
			let suffix = "";

			if (sortMode === "category") {
				// group all functions by category
				const categoryGroups: {
					[key: string]: {
						name: string;
						startPosition: number;
						function: Function;
					}[];
				} = {};

				for (const func of existingFunctions) {
					if (!categoryGroups[func.function.category]) {
						categoryGroups[func.function.category] = [];
					}

					categoryGroups[func.function.category].push(func);
				}

				// sort all functions within the categories alphabetically
				for (const category in categoryGroups) {
					categoryGroups[category].sort((a, b) => a.name.localeCompare(b.name));
				}

                vscode.TextEdit.
			}

			const topElement = fusionData.position === startPosition;

			item.additionalTextEdits = [
				vscode.TextEdit.insert(
					document.positionAt(startPosition ?? 0),
					`${topElement ? "\n" : ""}${prefix}local ${casedInput} = ${
						fusionData.name
					}.${key}${topElement ? "" : "\n"}${suffix}`
				),
			];*/

			// find very first function (sort all existingfunctions and find lowest startPosition)
			existingFunctions.sort((a, b) => a.startPosition - b.startPosition);

			const firstFunction = existingFunctions[0];

			// find very last function (sort all existingfunctions and find highest endPosition)
			existingFunctions.sort((a, b) => b.endPosition - a.endPosition);
			const lastFunction = existingFunctions[0];

			// now make a string that contains all var definitions, basically remap the entire vardecl part to our sorted list
			let varDecl = !firstFunction && !lastFunction ? "\n" : "";
			let lastCategory = "";

			for (const func of names) {
				if (
					lastCategory !== func.category &&
					lastCategory !== "" &&
					sortMode === "category"
				) {
					varDecl += "\n";
				}

				lastCategory = func.category;

				varDecl += `local ${func.varName ?? doCasing(func.importTitle)} = ${
					fusionData.name
				}.${func.name}${func === names[names.length - 1] ? "" : "\n"}`;
			}

			const startPosition = firstFunction
				? firstFunction.startPosition
				: fusionData.position;
			const endPosition = lastFunction
				? lastFunction.endPosition
				: fusionData.position;

			item.additionalTextEdits = [
				vscode.TextEdit.replace(
					new vscode.Range(
						document.positionAt(startPosition),
						document.positionAt(endPosition)
					),
					varDecl
				),
			];

			let postCharacters = "";

			if (!func.dontCall && func.noParenthesis) {
				postCharacters = " ";
			}

			item.insertText = new vscode.SnippetString(
				`${doCasing(func.importTitle)}${postCharacters}`
			);

			item.command = {
				command: "editor.action.triggerSuggest",
				title: "refresh completion",
			};
		}

		if (bracketMatch) {
			const classNameMatch = await PropertyCompletionProvider.getClassName(
				document,
				position,
				true
			);

			if (!classNameMatch) {
				return [];
			}

			// special keys
			const items = Object.keys(fusionDefinitions[fusionVersion].functions)
				.filter((key) => {
					return (
						fusionDefinitions[fusionVersion].functions[key].isTableField &&
						!existingFunctions.find((func) => func.name === key)
					);
				})
				.map((key) => {
					const func = fusionDefinitions[fusionVersion].functions[key];
					const item = new vscode.CompletionItem(
						key,
						vscode.CompletionItemKind.Function
					);
					item.detail = func.description;
					item.documentation = new vscode.MarkdownString(
						`[${func.importTitle}](${fusionDefinitions[fusionVersion].apiPath}${func.apiPath})`
					);

					getAdditionalEdits(key, func, item);

					return item;
				});

			return items;
		} else {
			// generate completion items, only use functions that are not special keys
			const items = Object.keys(fusionDefinitions[fusionVersion].functions)
				.filter((key) => {
					return (
						!fusionDefinitions[fusionVersion].functions[key].isTableField &&
						!existingFunctions.find((func) => func.name === key)
					);
				})
				.map((key) => {
					const func = fusionDefinitions[fusionVersion].functions[key];
					const item = new vscode.CompletionItem(
						key,
						vscode.CompletionItemKind.Function
					);
					item.detail = func.description;
					item.documentation = new vscode.MarkdownString(
						`[${key}](${fusionDefinitions[fusionVersion].apiPath}${func.apiPath})`
					);

					getAdditionalEdits(key, func, item);

					return item;
				});

			return items;
		}
	}
}
