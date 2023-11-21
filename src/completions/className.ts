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

export class ClassNameCompletionProvider
	implements vscode.CompletionItemProvider
{
	private classDefinitions: { [key: string]: classDefBuilder.Member[] };

	constructor(classDefinitions: { [key: string]: classDefBuilder.Member[] }) {
		this.classDefinitions = classDefinitions;
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

		// check if user is writing class
		const isWritingClassMatch = combinedLines.match(regex.getFunctionName);

		if (isWritingClassMatch) {
			// check whether the found keyword is a new alias
			const aliases: string[] = (
				(vscode.workspace
					.getConfiguration("fusionautocomplete")
					.get("newAliases") as string[]) ?? []
			).map((alias) => alias.toLowerCase());
			const isAlias = aliases.includes(isWritingClassMatch[1].toLowerCase());

			if (!isAlias) {
				return [];
			}

			// autocomplete class name
			const classKeys = Object.keys(this.classDefinitions);

			// return all class keys
			const items = classKeys.map((classKey) => {
				const item = new vscode.CompletionItem(
					classKey,
					vscode.CompletionItemKind.Class
				);
				item.detail = "Class";

				return item;
			});

			return items;
		}

		return [];
	}
}
