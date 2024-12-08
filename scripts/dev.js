// 打包packages下的模块

// node dev.js （要打包的名字 -f 打包的格式） === argv.slice(2)
//eg: node scripts/dev.js reactivity -f esm

import minimist from "minimist";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";

// node中的命令函数参数通过process 来获取process.argv
const args = minimist(process.argv.slice(2));

console.log('args :>> ', args);

// esm 使用commonjs 变量
const __filename = fileURLToPath(import.meta.url);//获取文件的绝对路径 file: -> /usr
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);


const target = args._[0] || "reactivity";//打包那个项目
const format = args.f || "iife";//打包后的模块规范

console.log(target, format);

console.log(__filename, __dirname, require);


// 入口文件 根据命令行提供的路径来进行解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);

// 根据需要进行打包
esbuild.context({
  entryPoints: [entry],//入口
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),//出口
  bundle: true, //reactivity -> shared 会打包到一起
  platform: "browser",//打包后给浏览器使用
  sourcemap: true,//可以调试源码
  format,// cjs esm iife
  globalName: pkg.buildOptions?.name,//iife模式 提供函数名
}).then((ctx) => {
  console.log('start dev');

  return ctx.watch();//监控入口文件持续进行打包
})
