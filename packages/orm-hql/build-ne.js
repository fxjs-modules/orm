const fs = require('fs');
const path = require('path');

const pkgJson = require('./package.json');

const nearley = require('nearley');
const Compile = require('nearley/lib/compile.js');

const parserGrammar = nearley.Grammar.fromCompiled(require('nearley/lib/nearley-language-bootstrapped.js'));
const parser = new nearley.Parser(parserGrammar);

const generate = require('nearley/lib/generate.js');
const lint = require('nearley/lib/lint.js');

const version = pkgJson.version;

const sourceFile = path.resolve(__dirname, "./sql.ne")
const targetDirt = path.resolve(__dirname, "./lib")

// main
const neStream = fs.openFile(sourceFile)

let ch
while ((ch = neStream.read()) !== null) parser.feed(ch)
parser.feed('\n');
neStream.close()

var c = Compile(parser.results[0], Object.assign({version: version}));
lint(c, {'out': process.stderr, 'version': version})

try { fs.mkdir(targetDirt) } catch (err) {}
fs.writeTextFile(path.resolve(targetDirt, './sql-parser.js'), generate(c, 'grammar'))
