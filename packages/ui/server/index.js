const fs = require('fs');
const path = require('path');
const http = require('http');
const mq = require('mq');
const vm = require('vm');
const fxHb = require('@fxjs/handbag');

const detectPort = require('@fibjs/detect-port');
const moduleList = require('@fibjs/builtin-modules')

const port = detectPort(process.env.PORT);

const vbox = new vm.SandBox({}, name => require(name));
const commonOptions = {
	burnout_timeout: -500,
	hooks: {
		'nirvana:mchanged' ({ info }) {
			console.log('[react]mchanged', info)
		}
	}
};

;[
	['system', ['.mjs', '.system.jsx', '.system.tsx']],
	['umd', ['.jsx', '.tsx']],
].forEach(([format, suffix]) => {
	fxHb.registers.react.registerReactAsRollupedJavascript(vbox, {
		...commonOptions,
		suffix: suffix,
		transpileLib: 'babel',
		rollup: {
			onGenerateUmdName: (_, info) => {
				switch (format) {
					case 'system':
						return info.name
					case 'umd':
					case 'iife':
						let rel = path.relative(
							pathDict.root, info.filename
						)
						const ext = path.extname(rel)
		
						if (ext) {
							rel = rel.slice(0, rel.lastIndexOf(ext))
						}
		
						// return `_components_/${rel.replace(/\//g, '_')}`
						return `_components_/${rel}`
				}
			},
			bundleConfig: {
				external: moduleList.concat(
					['react', 'react-dom']
				).concat(
					['semantic-ui-react']
				)
			},
			writeConfig: {
				output: {
					globals: {
						'react': 'React',
						'react-dom': 'ReactDOM',
						'semantic-ui-react': 'semanticUIReact'
					},
					format: format
				}
			}
		}
	})
});

fxHb.registers.plain.registerAsPlain(vbox, {...commonOptions, suffix: ['.html']})
fxHb.registers.pug.registerPugAsHtml(vbox, {...commonOptions, suffix: ['.pug'] })
fxHb.registers.stylus.registerStylusAsCss(vbox, {...commonOptions, suffix: ['.styl', '.stylus']})

const EXT_MIME_MAPPER = {
	'.js': 'application/javascript; charset=utf-8',
	'.jsx': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.styl': 'text/css; charset=utf-8',
	'.stylus': 'text/css; charset=utf-8',
	'.pug': 'text/html; charset=utf-8'
}

const pathDict = {
	root: path.resolve(__dirname, '../'),
	static: path.resolve(__dirname, '../static'),
	node_modules: path.resolve(__dirname, '../node_modules'),
}
const fHandlers = {
	root: http.fileHandler(pathDict.root),
	static: http.fileHandler(pathDict.static),
}

function safeRequire (filename, dirname) {
	try {
		filename = vbox.resolve(filename, dirname)
	} catch (error) {
		return ;
	}
	
	if (
		filename.endsWith('.js')
		|| filename.endsWith('.json')
	)
		return fs.readFile(filename)
	
	return vbox.require(filename, dirname)
}

const routing = new mq.Routing({
	'(.*).html$': (req, _path) => req.response.write(safeRequire(`../views/${_path}`, __dirname)),
	// '(.*).jsx$': jsHandler,
	'*': (req) => {
		const req_value = req.value
		switch (req_value) {
			case '':
			case '/':
				req.response.write(
					vbox.require(`../views/index.pug`, __dirname)
				)
				break
			default:
				if (req_value.startsWith('/static/')) {
					mq.invoke(fHandlers.root, req)
					break
				} else {
					let existed_path = null, content = null

					const checkors = [
						() => existed_path = vbox.resolve(path.join(`../views/pages`, req_value), __dirname),
						() => existed_path = vbox.resolve(path.join(`../views/pages`, req_value, './index.html'), __dirname),
						() => existed_path = vbox.resolve(path.join(`../views`, req_value), __dirname),
						() => {
							const relpath = `./${path.join('./', req_value)}`
							existed_path = vbox.resolve(relpath, pathDict.node_modules)
						},
					];
					
					let checkor = null
					while (checkor = checkors.shift()) {
						try {
							checkor();
						} catch (error) {}

						if (existed_path)
							break ;
					}

					if (existed_path && (content = safeRequire(existed_path, __dirname))) {
						req.response.write(content)

						const ext = path.extname(existed_path)
						if (ext && EXT_MIME_MAPPER[ext])
							req.response.setHeader({ 'Content-Type': EXT_MIME_MAPPER[ext] })
							
					} else {
						mq.invoke(fHandlers.static, req)
					}
				}
				break
		}
		
	}
})

const server = new http.Server(port, routing)

server.run(() => void 0);
console.log(`server started on listening ${port}`)

process.on('SIGINT', () => {
	server.stop()
	process.exit()
});
