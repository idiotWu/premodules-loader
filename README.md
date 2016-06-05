# premodules-loader

[![npm](https://img.shields.io/npm/v/premodules-loader.svg?style=flat-square)](https://www.npmjs.com/package/premodules-loader)
[![Travis](https://img.shields.io/travis/idiotWu/premodules-loader.svg)](https://travis-ci.org/idiotWu/premodules-loader)

Share css-modules compiled class names over pre-processers!

## Install

```
npm i premodules-loader --save-dev
```

## What's the problem

[css-modules](https://github.com/css-modules/css-modules) is a great workaround to generate scoped css. However since scoped css are tightly bound with js files that import them, when you are trying to write a reusable component, you're possibly getting a headache - how can other developers override the default styles in my components?

So,

> What if we can import class name maps into sass/less/stylus code?

## How it works

As is explained in [this article](https://idiotwu.me/working-happily-with-css-modules-and-pre-processors/), this loader executed twice in the webpack workflow by the following order:

1. Create directives:

  1. Use some directives to interpolate class names into source code - surely it should be converted to sass/less/stylus hashes.

  2. Use variable interpolation syntax to define class name, e.g. `${map-get($comp, 'main')}` in sass.

2. Process css-modules output:

  1. Restore twice-transformed class names to the previous one (both in stylesheet and class map).

  2. Save the class map for interpolation.

![workflow](https://idiotwu.me/content/images/2016/06/premodules.png)

## Usage

Webpack config (**execute twice**):

```javascript
// webpack.config.js
module.exports = {
  ...
  module: {
    loaders: [{
      test: /\.scss/,
      loaders: [
        'style',
        'premodules?restore', // restore here!
        'css?modules&importLoaders=1&localIdentName=[path]_[name]_[local]_[hash:base64:5]',
        'postcss',
        'sass',
        'premodules?parse', // parse here!
      ]
    }]
  },
  premodules: {
    transformer(varName, hash) {
      // custom code transformer
    }
  }
};
```


Components define:

```javascript
// button.js
import React from 'react';
import styles from './button.scss';

const Button = () => (
  <button className={style.button}>click me</button>
);

export default Button;
```

```scss
// button.scss
.button {
  border-radius: 3px;
}
```

Your react app:

```javascript
// app.js
import React from 'react';
import './app.scss';

const App = () => (
  <Button />
);
```

```scss
// app.scss
@module './button.scss' => $comp;

#{map-get($comp, 'button')} {
  background: #123;
}
```

### Directive Syntax

```scss
// import node_modules
@module 'module_name/dir/file' => $var;

// or use relative/absolute path
@module '/path/of/module' => $var;
```


### Customize Transformer

Default transform is designed for `scss` code transformation, write your own transformer to support your pre-processor.

Transformer function receives two parameters:

1. `varName:string`: variable name defined in directive
2. `hash:object`: css-modules exported class name map

A typical transformer may like this:

```javascript
// scss transformer
// `@module './comp.scss' => $comp` -> `$comp: ( key: value, ... )`

const transformer = (varName, hash) => {
  if (!hash) return '';

  const main = Object.keys(hash).map(key => `${key}: '.${hash[key]}'`).join(',');

  return `${varName}: (${main});`;
};
```

## Limitations

1. Must import all stylesheets you need into JavaScript code, otherwise it won't be passed through webpack.

2. Importing files that declared with `@module` directives in your sass/less/stylus codes may cause breaks (pre-processors won't understand this directive).

## License

MIT.
