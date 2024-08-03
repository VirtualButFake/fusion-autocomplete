import vscode from 'vscode';
import { classProperties, Member } from './classDefinitions';

type defs = {
    [key: string]: {
        apiPath: string;
        functions: {
            [key: string]: Function;
        };
    };
};

export type Function = {
    category: string;
    description: string;
    importTitle: string;
    apiPath: string;
    isTableField: boolean;
    dontCall?: boolean;
    updateFunction?: (
        document: vscode.TextDocument,
        position: vscode.Position,
        className: string
    ) => vscode.CompletionItem[];
    noParenthesis?: boolean;
};

function getPropertyAutocomplete(
    position: vscode.Position,
    document: vscode.TextDocument,
    className: string,
    propertyPredicate: (property: Member) => boolean,
    kind: vscode.CompletionItemKind
): vscode.CompletionItem[] {
    const properties = classProperties[className].filter(propertyPredicate);

    if (properties === undefined) {
        return [];
    }

    let lines = document.getText().split('\n');
    const line = lines[position.line];
    const linePrefix = line.substring(0, position.character);
    lines[position.line] = linePrefix;
    lines = lines.slice(0, position.line + 1);

    const combinedLines = lines.join('\n');

    const cutText = document
        .getText()
        .substring(combinedLines.length, document.getText().length);

    const items = properties.map((property) => {
        const item = new vscode.CompletionItem(property.Name, kind);

        if (property.MemberType === 'Event') {
            // using Parameters, make a list of all parameters and their types
            // then, make a string out of that list
            // then, add that string to the documentation

            const parameters: { Name: string; Type: { Name: string } }[] =
                property.Parameters ?? [];

            const parameterString = parameters
                .map((parameter) => {
                    return `${parameter.Name}: ${parameter.Type.Name}`;
                })
                .join(', ');

            item.detail = `(${parameterString})`;
        } else if (property.ValueType) {
            item.detail = property.ValueType.Name;
        }

        item.documentation = new vscode.MarkdownString(
            `**Tags**: ${property.Tags ? property.Tags.join(', ') : 'None'}`
        );

        item.insertText = new vscode.SnippetString(property.Name);

        const indices = [
            cutText.indexOf('='),
            cutText.indexOf(']'),
            cutText.indexOf(')'),
            cutText.indexOf('"'),
        ];

        let moveValue =
            indices.find(
                (index) => index !== -1 && index < property.Name.length + 4
            ) ?? -1;

        if (moveValue > -1) {
            item.command = {
                title: 'move cursor to end of character',
                command: 'cursorMove',
                arguments: [
                    {
                        to: 'right',
                        by: 'character',
                        value: moveValue + 1,
                    },
                ],
            };
        }

        return item;
    });

    return items;
}

const fusionDefinitions: defs = {
    ['0.2']: {
        apiPath: 'https://elttob.uk/Fusion/0.2/api-reference/',
        functions: {
            Computed: {
                category: 'State',
                description:
                    'Calculates a single value based on the returned values from other state objects.',
                importTitle: 'Computed',
                apiPath: 'state/computed',
                isTableField: false,
            },
            cleanup: {
                category: 'State',
                description:
                    'Attempts to destroy all destructible objects passed to it.',
                importTitle: 'clean',
                apiPath: 'state/cleanup',
                isTableField: false,
                dontCall: true,
            },
            doNothing: {
                category: 'State',
                description:
                    'No-op function - does nothing at all, and returns nothing at all. Intended for use as a destructor when no destruction is needed.',
                importTitle: 'doNothing',
                apiPath: 'state/doNothing',
                isTableField: false,
                dontCall: true,
            },
            ForKeys: {
                category: 'State',
                description:
                    'Processes a table from another state object by transforming its keys only.',
                importTitle: 'ForKeys',
                apiPath: 'state/forkeys',
                isTableField: false,
            },
            ForValues: {
                category: 'State',
                description:
                    'Processes a table from another state object by transforming its values only.',
                importTitle: 'ForValues',
                apiPath: 'state/forvalues',
                isTableField: false,
            },
            ForPairs: {
                category: 'State',
                description:
                    'Processes a table from another state object by transforming its keys and values.',
                importTitle: 'ForPairs',
                apiPath: 'state/forpairs',
                isTableField: false,
            },
            Observer: {
                category: 'State',
                description:
                    'Observes various updates and events on a given dependency.',
                importTitle: 'Observer',
                apiPath: 'state/observer',
                isTableField: false,
            },
            Value: {
                category: 'State',
                description:
                    'Stores a single value which can be updated at any time.',
                importTitle: 'Value',
                apiPath: 'state/value',
                isTableField: false,
            },
            Children: {
                category: 'Instances',
                description:
                    'Allows parenting children to an instance, both statically and dynamically.',
                importTitle: 'Children',
                apiPath: 'instances/children',
                isTableField: true,
                dontCall: true,
            },
            Cleanup: {
                category: 'Instances',
                description:
                    'Cleans up all items given to it when the instance is destroyed, equivalent to passing the items to `Fusion.cleanup`.',
                importTitle: 'Cleanup',
                apiPath: 'instances/cleanup',
                isTableField: true,
                dontCall: true,
            },
            Hydrate: {
                category: 'Instances',
                description:
                    'Given an instance, returns a component which modifies that instance. The property table may specify properties to set on the instance, or include special keys for more advanced operations.',
                importTitle: 'Hydrate',
                apiPath: 'instances/hydrate',
                isTableField: false,
            },
            New: {
                category: 'Instances',
                description:
                    'Given a class name, returns a component which creates instances of that class. The property table may specify properties to set on the instance, or include special keys for more advanced operations.',
                importTitle: 'New',
                apiPath: 'instances/new',
                isTableField: false,
                noParenthesis: true,
            },
            OnChange: {
                category: 'Instances',
                description:
                    "Given a property name, returns a special key which connects to that property's change events. It should be used with a handler callback, which may accept the new value of the property.",
                importTitle: 'Change',
                apiPath: 'instances/onchange',
                isTableField: true,
                updateFunction(document, position, className) {
                    return getPropertyAutocomplete(
                        position,
                        document,
                        className,
                        (property) =>
                            property.MemberType === 'Property' ||
                            property.MemberType === 'DataType',
                        vscode.CompletionItemKind.Property
                    );
                },
                noParenthesis: true,
            },
            OnEvent: {
                category: 'Instances',
                description:
                    'Given an event name, returns a special key which connects to that event. It should be used with a handler callback, which may accept the arguments of the event.',
                importTitle: 'Event',
                apiPath: 'instances/onevent',
                isTableField: true,
                noParenthesis: true,
                updateFunction(document, position, className) {
                    return getPropertyAutocomplete(
                        position,
                        document,
                        className,
                        (property) => property.MemberType === 'Event',
                        vscode.CompletionItemKind.Event
                    );
                },
            },
            Out: {
                category: 'Instances',
                description:
                    'Given a property name, returns a special key which outputs the value of properties with that name. It should be used with a value.',
                importTitle: 'Out',
                apiPath: 'instances/out',
                isTableField: true,
                updateFunction(document, position, className) {
                    return getPropertyAutocomplete(
                        position,
                        document,
                        className,
                        (property) =>
                            property.MemberType === 'Property' ||
                            property.MemberType === 'DataType',
                        vscode.CompletionItemKind.Property
                    );
                },
                noParenthesis: true,
            },
            Ref: {
                category: 'Instances',
                description:
                    'When applied to an instance, outputs the instance to a state object. It should be used with a value.',
                importTitle: 'Ref',
                apiPath: 'instances/ref',
                isTableField: true,
            },
            Tween: {
                category: 'Animation',
                description:
                    'Represents types that can be animated component-wise. If a data type can reasonably be represented as a fixed-length array of numbers, then it is animatable.',
                importTitle: 'Tween',
                apiPath: 'animation/tween',
                isTableField: false,
            },
            Spring: {
                category: 'Animation',
                description:
                    'Follows the value of another state object, as if linked by a damped spring. If the state object is not animatable, the spring will just snap to the goal value.',
                importTitle: 'Spring',
                apiPath: 'animation/spring',
                isTableField: false,
            },
        },
    },
};

export default fusionDefinitions as defs;
