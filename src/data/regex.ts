export default {
	className: new RegExp(/(\w+)[(\s]?["'`]([A-Za-z0-9_]*)["'`][\s)(]*[{\s]*$/i),
	isKey: new RegExp(/[{,;]\s*(([A-Za-z]+)\s*(?!=\s*([A-Za-z0-9_]+)))$/gi),
    isSpecialKey: new RegExp(/[{,;]\s*((\[[A-Za-z]+)\s*(?!=\s*([A-Za-z0-9_]+)))$/gi),
	hasValue: new RegExp(/^[\s]*=/i),
	getFunctionName: new RegExp(/(\w+)[(\s]*?["'`]([A-Za-z0-9_]*)$/i),
	bracketField: new RegExp(/\[\w+$/),
	string: new RegExp(/(["'`]).*?(?<!\\)(\1|$)|(\[\[).*?(?<!\\)(\]\]|$)/g),
	tableField: new RegExp(
		/{[\s\S]*[,;]?\s*(([A-Za-z]+)\s*(?<!=\s*([A-Za-z0-9_]+)))(?![^()]*\))]*$/i
	),
	localVarDecl: new RegExp(/local\s*([A-Za-z0-9_]+)?$/i),
	functionDecl: new RegExp(/function\s*([A-Za-z0-9_]+)?$/i),
	varName: new RegExp(/local\s*([A-Za-z0-9_]+)(\s*?=\s*([^\s]*))?/gi),
};
