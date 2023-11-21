import * as vscode from "vscode";
import regex from "../data/regex";
import * as classDefBuilder from "../data/classDefinitions";

const autocompleteText: { [key: string]: string } = {
	CFrame: "CFrame.new(${1})",
	Color3: "Color3.new(${1})",
	ColorSequence: "ColorSequence.new(${1})",
	ColorSequenceKeypoint: "ColorSequenceKeypoint.new(${1})",
	NumberRange: "NumberRange.new(${1})",
	NumberSequence: "NumberSequence.new(${1})",
	NumberSequenceKeypoint: "NumberSequenceKeypoint.new(${1})",
	PhysicalProperties: "PhysicalProperties.new(${1})",
	Ray: "Ray.new(${1})",
	Rect: "Rect.new(${1})",
	Region3: "Region3.new(${1})",
	Region3int16: "Region3int16.new(${1})",
	UDim: "UDim.new(${1})",
	UDim2: "UDim2.new(${1})",
	Vector2: "Vector2.new(${1})",
	Vector2int16: "Vector2int16.new(${1})",
	Vector3: "Vector3.new(${1})",
	Vector3int16: "Vector3int16.new(${1})",
};

export class PropertyCompletionProvider
	implements vscode.CompletionItemProvider
{
	private classDefinitions: { [key: string]: classDefBuilder.Member[] };

	constructor(classDefinitions: { [key: string]: classDefBuilder.Member[] }) {
		this.classDefinitions = classDefinitions;
	}

	static async getClassName(
		document: vscode.TextDocument,
		position: vscode.Position,
		ignoreBrackets?: boolean
	) {
		// run regex on the available text, see if we're currently in a table
		let lines = document.getText().split("\n");
		const line = lines[position.line];
		const linePrefix = line.substring(0, position.character);
		lines[position.line] = linePrefix;
		lines = lines.slice(0, position.line + 1);

		const combinedLines = lines.join("\n");
		const isKeyMatch = combinedLines.match(
			ignoreBrackets ? regex.isSpecialKey : regex.isKey
		);

		if (isKeyMatch) {
			// find first unclosed bracket
			const lastBracketIndex = combinedLines.lastIndexOf("}");
			let bracketIndex =
				lastBracketIndex !== -1 ? lastBracketIndex : combinedLines.length;
			let bracketCount = 1;
			let classNameMatch;

			while (bracketCount > 0 && combinedLines[bracketIndex - 1]) {
				bracketIndex--;
				const char = combinedLines[bracketIndex];
				if (char === "{") {
					// try matching with classnamematch
					classNameMatch = combinedLines
						.substring(0, bracketIndex)
						.match(regex.className);

					if (classNameMatch) {
						break;
					}

					bracketCount++;
				} else if (char === "}") {
					bracketCount--;
				}
			}

			if (classNameMatch) {
				const aliases: string[] = (
					(vscode.workspace
						.getConfiguration("fusionautocomplete")
						.get("newAliases") as string[]) ?? []
				).map((alias) => alias.toLowerCase());
				const isAlias = aliases.includes(classNameMatch[1].toLowerCase());

				if (!isAlias) {
					return [];
				}

				return classNameMatch;
			}
		}
	}

	public async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	) {
		let lines = document.getText().split("\n");
		const line = lines[position.line];
		const linePrefix = line.substring(0, position.character);
		lines[position.line] = linePrefix;
		lines = lines.slice(0, position.line + 1);

		const combinedLines = lines.join("\n");
		const text = document.getText();

		const classNameMatch = await PropertyCompletionProvider.getClassName(
			document,
			position
		);

		if (!classNameMatch) {
			return [];
		}

		const className = classNameMatch[2];
		const properties = this.classDefinitions[className].filter(
			(prop) => prop.MemberType === "Property" || prop.MemberType === "DataType"
		);

		if (properties === undefined) {
			return [];
		}

		const items = properties.map((property) => {
			const item = new vscode.CompletionItem(
				property.Name,
				vscode.CompletionItemKind.Property
			);
			item.detail = property.ValueType.Name;
			item.documentation = new vscode.MarkdownString(
				`**Tags**: ${property.Tags ? property.Tags.join(", ") : "None"}`
			);

			const hasValue = text
				.substring(combinedLines.length, text.length)
				.match(regex.hasValue);

			if (hasValue) {
				item.insertText = new vscode.SnippetString(property.Name);
			} else {
				item.insertText = new vscode.SnippetString(
					`${property.Name} = ${
						autocompleteText[property.ValueType.Name] ?? ""
					}`
				);
			}

			return item;
		});

		return items;
	}
}