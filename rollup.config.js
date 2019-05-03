import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import pkg from './package.json'

export default [
  // browser-friendly UMD build
  // the namedExports make me incredibly sad.
  {
    input: 'src/index.js',
    output: {
      name: 'caballo-vivo',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve(),
      commonjs({
        namedExports: {
          include: 'node_modules/**',
          'node_modules/react-is/index.js': ['isValidElementType'],
          'node_modules/immutable/dist/immutable.js': [
            'Map',
            'Set',
            'List',
            'fromJS',
            'OrderedMap',
          ],
          'node_modules/react/index.js': ['useContext'],
        },
      }),
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.js',
    external: [
      'history',
      'immutable',
      'query-string',
      'ramda',
      'react',
      'react-router',
      'rxjs',
      'rxjs/operators',
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
  },
]
