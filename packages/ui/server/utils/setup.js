const fs = require('fs');
const path = require('path');
const fxHb = require('@fxjs/handbag');

const moduleList = require('@fibjs/builtin-modules')

const commonOptions = exports.commonOptions = {
	burnout_timeout: -500,
	hooks: {
		'nirvana:mchanged' ({ info }) {
			console.log('[common]mchanged', info)
		}
	}
};

exports.setupVboxForFrontend = ({
    vbox,
    project_root
}) => {
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
                                project_root, info.filename
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
}