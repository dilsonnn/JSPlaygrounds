import _ from 'lodash';
import { createSelector } from 'reselect';
import * as ts from "typescript";



const codeSelector = state => state.code;
const OPEN_DELIMITERS = [ '(', '{', '[', '`' ];
const CLOSE_DELIMITERS = [ ')', '}', ']', '`' ];
const DELIMITER_MAP = {
  ')': '(',
  '}': '{',
  ']': '[',
  '`': '`'
};

const findDelimiters = ({ column }, lineContents) =>
  _.intersection(_.takeRight(lineContents, lineContents.length - column), OPEN_DELIMITERS).length



const compilerOptions = {
  module: ts.ModuleKind.CommonJS,
  experimentalDecorators: true,
  target: ts.ScriptTarget.ES2016,
  moduleResolution: ts.ModuleResolutionKind.CommonJS,
};
const getTypescriptErrors = (code) => {
  const filename = 'example.ts';
  const host = {
    getSourceFile: (f) => {
      return ts.createSourceFile(filename, code, "0");
    },
    useCaseSensitiveFileNames: () => false,
    getCanonicalFileName: (f) => f,
    getDefaultLibFileName: () => '',
    getNewLine: () => '\n',
    getCurrentDirectory: () => '/',
    maxNodeModuleJsDepth: 1,
    fileExists: () => false,
    readFile: () => code
  };
  const program = ts.createProgram([filename], {
    maxNodeModuleJsDepth: 1,
    noEmitOnError: true,
    ...compilerOptions
  }, host);

  return program.emit().diagnostics
  .filter(d => d.file)
  .map(f => {
    const pos = f.file.getLineAndCharacterOfPosition(f.start);
    const message = (_.get(f, 'messageText.messageText', f.messageText));
    return (pos.line + 1) + ':' + pos.character + ' - ' + message + '\n';
  }).filter(message => {
    // There may be a better way, but its ok for our purposes.
    if(message.includes("Cannot find name 'console'") > 0){
      return undefined;
    }
    return message;
  });

};

const parseExpressions = (code) => {
  const compiledToTypescript = ts.transpileModule(code, { compilerOptions });
  let compiledCode = compiledToTypescript.outputText;
  var consoleRegex = new RegExp('console.log', 'g');
  compiledCode = compiledCode.replace(consoleRegex, 'logInternal');
  compiledCode = `
    let context = '';
    const logInternal = (args) => {
      context += args + "<console.log>";
    }
    ${compiledCode}
    context;
  `;
  const codeByLine = compiledCode.split('\n');
  const tokenized = esprima.tokenize(compiledCode, { loc: true });
  const parens = { '(': 0, '{': 0, '[': 0 };
  let wasOpen = false;
  const expressions = _.reduce(tokenized, (expressions, { value, loc: { end } }, index) => {
    const lineNumber = end.line;
    const lineContents = codeByLine[lineNumber - 1];
    const lineHasMoreDelimiters = findDelimiters(end, lineContents);
    
    if (expressions[lineNumber]) { return expressions; }

    if (OPEN_DELIMITERS.includes(value)) {
      parens[value] += 1;
      wasOpen = true;
    }

    if (CLOSE_DELIMITERS.includes(value)) {
      parens[DELIMITER_MAP[value]] -= 1;
    }

    if (!lineHasMoreDelimiters && wasOpen && _.every(parens, count => count === 0)) {
      wasOpen = false;
      expressions[lineNumber] = _.take(codeByLine, lineNumber).join('\n');

      return expressions;
    }

    if (!lineHasMoreDelimiters && _.every(parens, count => count === 0)) {
      expressions[lineNumber] = _.take(codeByLine, lineNumber).join('\n');

      return expressions;
    }

    return expressions;
  }, {});
  return {
    expressions,
    errors: getTypescriptErrors(code)
  };
}

export default createSelector(
  codeSelector,
  parseExpressions
);
