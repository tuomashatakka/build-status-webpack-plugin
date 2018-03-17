# Build Status Webpack Plugin

Set the logLevel property to 'silent' for the dev server/middleware to
suppress the ugly default output.

Do the same for the hot middleware if you're using one.

Import the `build-status-webpack-plugin` package in your webpack config
and add the imported class as a plugin:

```js
const BuildStatusPlugin = require('build-status-webpack-plugin')


module.exports = {
  plugins: [ new BuildStatusPlugin() ],
  devServer: {
    logLevel: 'silent',
  }
}
```

Next time you run webpack, the console should output the build progress in 
a nice, clean format instead of its regular diarrhea-of-stdouting.

You're welcome :---)
