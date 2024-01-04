# Fusion Autocomplete

[Get on Visual Studio marketplace](https://marketplace.visualstudio.com/items?itemName=Virtual.fusionautocomplete)

---

A Visual Studio Code extension that provides autocomplete for certain Fusion syntax.
This tool is extremely easy to set up, only requiring you to set up aliases for your Fusion variable names and functions.
It currently provides the following features:

- Autocomplete for class names, supporting all string formats ("", '', `` and ``[[]]``), and calls both with and without brackets.
- Property autocomplete (dynamically updates, supports all non-`ReadOnly` properties)
- Function autocomplete, automatically importing the required functions and grouping them in the code, in order to keep import order consistent.
- Automatic detection of SpecialKey functions, autocompleting these functions inside of your Fusion table.
- Automatic detection of function parameters, automatically completing for example event names inside `OnEvent`, and properties inside `OnChange`.

Contributions are always welcomed.
Fusion 0.3 support will be added when it is officially released.
