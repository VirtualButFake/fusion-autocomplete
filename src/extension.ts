import * as vscode from "vscode";
import fetch from "node-fetch";

const isKeyRegex = new RegExp(
	/[{,]\s*(([A-Za-z]+)\s*(?!=\s*([A-Za-z0-9_]+)))$/gi
);
const findClassNameRegex = new RegExp(
	/new\(?["'`]([A-Za-z0-9_]*)["'`][\s)(]*[{][^[{]*$/i
);

const isWritingClassRegex = new RegExp(/new\(?["'`]([A-Za-z0-9_]*)$/i);

const classProperties: { [key: string]: Member[] } = {};

// thanks copilot
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

interface valueType {
	Name: string;
}

interface Member {
	Name: string;
	MemberType: string;
	ValueType: valueType;
	Tags: string[];
}

// this code is inspired by the studio plugin for fusion autocompletes (https://devforum.roblox.com/t/autocomplete-for-listing-object-properties-in-tables-for-roact-and-fusion/2696843)
async function TransferSuperclassPropertiesToList(
	Properties: Member[],
	List: Member[]
) {
	for (const Property of Properties) {
		List.push(Property);
	}
}

async function TransferClassPropertiesToList(
	Class: {
		Name: string;
		Superclass: string;
		Members: Member[];
	},
	list: Member[]
) {
	const superclass = classProperties[Class.Superclass];

	if (superclass) {
		await TransferSuperclassPropertiesToList(superclass, list);
	}

	if (Class.Members) {
		for (const Property of Class.Members) {
			const tags = Property.Tags;

			if (
				Property.MemberType === "Property" ||
				Property.MemberType === "DataType"
			) {
				if (tags) {
					if (tags.includes("ReadOnly")) {
						continue;
					}
				}

				list.push(Property);
			}
		}
	}
}

export async function activate(context: vscode.ExtensionContext) {
	// build class definitions using api dump
	const body = await fetch(
		"https://raw.githubusercontent.com/MaximumADHD/Roblox-Client-Tracker/roblox/API-Dump.json"
	);

	const json = await body.json();

	for (const classDef of json.Classes) {
		let props: Member[] = [];
		await TransferClassPropertiesToList(classDef, props);
		classProperties[classDef.Name] = props;
	}

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			"lua",
			{
				provideCompletionItems(
					document: vscode.TextDocument,
					position: vscode.Position,
					token: vscode.CancellationToken,
					context: vscode.CompletionContext
				) {
					let lines = document.getText().split("\n");
					const line = lines[position.line];
					const linePrefix = line.substring(0, position.character);
					lines[position.line] = linePrefix;
					lines = lines.slice(0, position.line + 1);

					const combinedLines = lines.join("\n");

					// run regex on the available text, see if we're currently in a table
					const isKeyMatch = combinedLines.match(isKeyRegex);

					if (isKeyMatch) {
						const classNameMatch = combinedLines.match(findClassNameRegex);

						if (classNameMatch) {
							const className = classNameMatch[1];
							const properties = classProperties[className];

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
									`**Tags**: ${
										property.Tags ? property.Tags.join(", ") : "None"
									}`
								);
								item.insertText = new vscode.SnippetString(
									`${property.Name} = ${
										autocompleteText[property.ValueType.Name] ?? ""
									}`
								);

								return item;
							});

							return items;
						}
					}

					// check if user is writing class
					const isWritingClassMatch = combinedLines.match(isWritingClassRegex);

					if (isWritingClassMatch) {
						// autocomplete class name
						const classKeys = Object.keys(classProperties);

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
				},
			},
			"{",
			'"',
			"'",
			"`"
		)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
