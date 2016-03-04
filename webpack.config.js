var path = require("path");

module.exports = {
  entry: "./entry.js",
  output: {
    path: path.join(__dirname, "/build"),
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}
