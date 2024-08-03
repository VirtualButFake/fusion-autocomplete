<div align="center">

# Fusion Autocomplete

[![License](https://img.shields.io/github/license/virtualbutfake/fusion-autocomplete)](https://github.com/VirtualButFake/fusion-autocomplete/blob/master/LICENSE.md)
[![Version](https://img.shields.io/visual-studio-marketplace/v/Virtual.fusionautocomplete)](https://marketplace.visualstudio.com/items?itemName=Virtual.fusionautocomplete)
[![Installs](https://img.shields.io/visual-studio-marketplace/d/Virtual.fusionautocomplete)](https://marketplace.visualstudio.com/items?itemName=Virtual.fusionautocomplete)
</div>

## 

A Visual Studio Code extension that provides autocomplete for certain Fusion syntax.
This tool is extremely easy to set up, only requiring you to set up aliases for your Fusion variable names and functions.

## Features

- Autocomplete for class names, supporting all string formats ("", '', `` and \[[\]]), and calls both with and without brackets.
- Property autocomplete (dynamically updates, supports all non-`ReadOnly` properties)
- Function autocomplete, automatically importing the required functions and grouping them in the code, in order to keep import order consistent.
- Automatic detection of SpecialKey functions, autocompleting these functions inside of your Fusion table.
- Automatic detection of function parameters, automatically completing for example event names inside `OnEvent`, and properties inside `OnChange`.

This plugin relies on RegEx to detect Fusion syntax, and as such, it may not always be perfect. If you find any issues, please create an issue in this repository.

## Contributing
Contributions are always welcomed.
