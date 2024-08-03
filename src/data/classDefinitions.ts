import fetch from 'node-fetch';

interface valueType {
    Name: string;
}

export interface Member {
    Name: string;
    MemberType: string;
    ValueType: valueType;
    Tags: string[];
    Parameters: { Name: string; Type: valueType }[];
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
    list: Member[],
    classProperties: { [key: string]: Member[] }
) {
    const superclass = classProperties[Class.Superclass];

    if (superclass) {
        await TransferSuperclassPropertiesToList(superclass, list);
    }

    if (Class.Members) {
        for (const Property of Class.Members) {
            const tags = Property.Tags;

            if (tags) {
                if (tags.includes('ReadOnly')) {
                    continue;
                }
            }

            list.push(Property);
        }
    }
}

export let classProperties: { [key: string]: Member[] } = {};

export default async function (): Promise<{ [key: string]: Member[] }> {
    // build class definitions using api dump
    const body = await fetch(
        'https://raw.githubusercontent.com/MaximumADHD/Roblox-Client-Tracker/roblox/API-Dump.json'
    );

    const json = await body.json();

    for (const classDef of json.Classes) {
        let props: Member[] = [];
        await TransferClassPropertiesToList(classDef, props, classProperties);
        classProperties[classDef.Name] = props;
    }

    return classProperties;
}
