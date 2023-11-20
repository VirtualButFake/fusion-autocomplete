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