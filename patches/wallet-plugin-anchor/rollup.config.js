import fs from 'fs'
import dts from 'rollup-plugin-dts'
import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'

import pkg from './package.json'
import json from '@rollup/plugin-json'

const replaceVersion = replace({
    preventAssignment: true,
    __ver: pkg.version,
})

const name = pkg.name
const license = fs.readFileSync('LICENSE').toString('utf-8').trim()
const banner = `
/**
 * ${name} v${pkg.version}
 * ${pkg.homepage}
 *
 * @license
 * ${license.replace(/\n/g, '\n * ')}
 */
`.trim()

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)]

/** @type {import('rollup').RollupOptions} */
export default [
    {
        input: 'src/index.ts',
        output: {
            banner,
            file: pkg.main,
            format: 'cjs',
            sourcemap: true,
            exports: 'named',
        },
        plugins: [replaceVersion, typescript({target: 'es6'}), json()],
        external,
    },
    {
        input: 'src/index.ts',
        output: {
            banner,
            file: pkg.module,
            format: 'esm',
            sourcemap: true,
        },
        plugins: [replaceVersion, typescript({target: 'es2020'}), json()],
        external,
    },
    {
        input: 'src/index.ts',
        output: {banner, file: pkg.types, format: 'esm'},
        plugins: [replaceVersion, dts()],
    },
]
