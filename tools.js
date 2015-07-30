/**
 * tools
 *
 * @author xiaomi
 */

var fs = require('fs');
var path = require('path');
var http = require('http');

var tools = {
    getCaches: {},
    /**
     * 抓取 http 内容
     * @param  {String}   url      [description]
     * @param  {Function} callback [description]
     * @return {Void}            [description]
     */
    get: function(url, callback) {
        url = url.replace(/#.+$/, '');

        var cache = this.getCaches;
        if(cache[url]) {
            callback(null, cache[url]);
        }

        http.get(url, function(res) {
            var data = [];
            var dataLen = 0;

            res.on('data', function(chunk) {
                dataLen += chunk.length;
                data.push(chunk);
            })
            .on('end', function() {
                var buf = Buffer.concat(data, dataLen);

                cache[url] = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    content: buf
                };

                callback(null, cache[url]);
            });
        })
        .on('error', function(err) {
            callback(err);
        });
    },
    // 同步保存文件
    // 自动补全路径
    writeFile: function(filePath, content) {
        // 自动补全路径
        var tmpPath = '';
        var destPaths = [];
        var destPath = path.dirname(filePath);
        var paths = destPath.replace(/\\+/g, '/').split('/');

        // ext. /var/tmp
        if(paths[0] === '') {
            paths[0] = '/';
        }

        while(paths.length) {
            destPaths.push(paths.shift());

            tmpPath = destPaths.join('/');

            if(!fs.existsSync(tmpPath)) {
                fs.mkdirSync(tmpPath);
            }
        }

        // 同步写入文件
        fs.writeFileSync(filePath, content);
    }
};

module.exports = tools;
