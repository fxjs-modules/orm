const fs = require('fs');
const path = require('path');
const http = require('http');
const mq = require('mq');
const vm = require('vm');

const rpc = require('fib-rpc')

const detectPort = require('@fibjs/detect-port');
const getModuleDict = require('@fibjs/builtin-modules/lib/util/get-builtin-module-hash')

const { registerAsJavascript } = require('./utils/register')
const { setupVboxForFrontend, commonOptions: registerCommonOptions } = require('./utils/setup')
const { safeRequireFEResources, pathDict: fePathDict, fHandlers } = require('./utils/fe')
const { EXT_MIME_MAPPER } = require('./utils/mime')

/* setup fe resource :start */
const [
	vboxFe,
	vboxBk,
] = [
	new vm.SandBox({}, name => require(name)),
	new vm.SandBox(getModuleDict(), name => require(name)),
]
setupVboxForFrontend({ vbox: vboxFe, project_root: fePathDict.root });
/* setup fe resource :end */

/* setup backend :start */
registerAsJavascript(vboxBk, {
	...registerCommonOptions,
	hooks: {
		'nirvana:mchanged' ({ info }) {
			console.log('[backends]mchanged', info)
			if (info.filename !== bkEntryPath) {
				vboxBk.remove(bkEntryPath)
				vboxBk.require(bkEntryPath, __dirname)
			}
			
			process.nextTick(() => {
				buildJsRpcServer()
			});
		}
	}
});
const bkEntryPath = vboxBk.resolve('./backends', __dirname)

let [
	jsBackends,
	buildJsRpcServer,
] = [
	null,
	function () {
		const methods = vboxBk.require(bkEntryPath, __dirname);
		return jsBackends = rpc.open_handler(
			{
				...methods
			}
		)
	}
]
/* setup backend :end */

/* setup server handler :start */
function buildApiHandler () {
	buildJsRpcServer()

	const parseQueryStringDotkey = require('parse-querystring-dotkey')

	return (req) => {
		const query = parseQueryStringDotkey(req.queryString)

		if (query._body) {
			req.json(query._body)
		}

		jsBackends(req);
	}
}

const routing = new mq.Routing({
	'/rpc/': buildApiHandler(),
	'(.*).html$': (req, _path) => req.response.write(
		safeRequireFEResources(vboxFe, `../views/${_path}`, __dirname)
	),
	// '(.*).jsx$': jsHandler,
	'*': (req) => {
		const req_value = req.value
		switch (req_value) {
			case '':
			case '/':
				req.response.write(
					vboxFe.require(`../views/index.pug`, __dirname)
				)
				break
			default:
				if (req_value.startsWith('/static/')) {
					mq.invoke(fHandlers.root, req)
					break
				} else {
					let existed_path = null, content = null

					const checkors = [
						() => existed_path = vboxFe.resolve(path.join(`../views/pages`, req_value), __dirname),
						() => existed_path = vboxFe.resolve(path.join(`../views/pages`, req_value, './index.html'), __dirname),
						() => existed_path = vboxFe.resolve(path.join(`../views`, req_value), __dirname),
						() => {
							const relpath = `./${path.join('./', req_value)}`
							existed_path = vboxFe.resolve(relpath, fePathDict.node_modules)
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

					if (existed_path && (content = safeRequireFEResources(vboxFe, existed_path, __dirname))) {
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
/* setup server handler :end */

const port = detectPort(process.env.PORT);
const server = new http.Server(port, routing)

server.run(() => void 0);
console.log(`server started on listening ${port}`)

process.on('SIGINT', () => {
	server.stop()
	process.exit()
});
