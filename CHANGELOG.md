# Changelog

## 1.0.0
- Added autocomplete for class names
- Added autocomplete for properties

## 1.0.1
- Added semicolon to "isKey" regex
- Added whitespace characters as an optional character in regex alongside `(` and `)`. There was a bug that wouldn't autocomplete `New "Frame"` because it had a space.

## 1.0.2
- Fix bug where autocomplete would add a value onto a key that already had a value (i.e. adding ``= UDim2.new()`` onto ``Si = UDim2.new()`` when autocompleting Size)

## 1.0.3
- Setup publishing workflow & add Visual Studio marketplace link to README.md

## 1.1.0
- Allows configuration to be used to provide a list of strings that'll be seen as calls to `Fusion.New`.

## 1.1.1
- More descriptive function naming
- Made settings refresh on configuration change

# 1.2.0
- Added autocomplete & auto-import for Fusion functions and parameters on certain functions (Out, OnChange, OnEvent). This looks for a `Fusion` (customizable) variable and automatically imports these functions if they are not already imported. I tried to make autocompletion stick to the way existing extensions do it (so no automatic brackets, etc) because this extension only takes care of the first time they are used. 
- You can customize the casing options for these variables in the options (default: camelCase)
- You can customize the grouping of these variables in the options (either alphabetically or categorically)
- Currently only Fusion 0.2 is supported, but when 0.3 gets released support will be added.


- Fix types in code
- Cleaned up & refactored code a lot
- Fixed bug where properties would not be autocompleted if a property that took a table was used before it (i.e. Children).
- Fixed a bug where autocompletion would still occur if the user was typing directly after a table.
- Fixed a bug where autocompletion would not occur if it was done after a table inside a ``New()`` call

# 1.2.1
- Added setting for adding characters at the end of a completion with pre-set values (useful for adding i.e. a comma after a property)
- Fix bug where brackets before a ``New()`` call would not autocomplete