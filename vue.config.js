module.exports = {
    // Fix sourcemaps (a little)    
    chainWebpack: config => {
        config.merge({ 
            // devtool: 'eval-source-map',
            // output: {
            //     devtoolModuleFilenameTemplate: info => {
            //         var $filename = 'sources://' + info.resourcePath;
            //         if (info.resourcePath.match(/\.vue$/) && !info.allLoaders.match(/type=script/)) {
            //             $filename = 'webpack-generated:///' + info.resourcePath + '?' + info.hash;
            //         }
            //         return $filename;
            //       },
            //     devtoolFallbackModuleFilenameTemplate: 'webpack:///[resource-path]?[hash]',
            // }
        });
        
        return config;
    }
}