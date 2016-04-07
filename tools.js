/**
 * tools
 *
 * @author xiaomi
 */

var fs = require('fs');
var URL = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var qs = require('querystring');
var iconv = require('iconv-lite');

var tools = {
    /**
     * @description 发起远程请求的基础方法
     * @param {Object} options 请求选项
     * @param {String} [options.protocol='http'] 请求协议
     * @param {String} [options.method='get'] 请求方法，get、post...
     * @param {Object=} options.headers 请求头
     * @param {String=} options.ending 请求数据的编码格式，如果是gbk，使用escape编码
     * @param {Boolean=} [options.json=false] 发送的是否json数据
     * @param {Number=} options.timeout 超时时间，单位为毫秒
     * @param {Object=} options.data 请求发送的数据对象
     * @param {String} [options.encoding='utf-8'] 编码格式
     * @param {RequestCallback} callback 处理请求响应的回调方法，查看 {@link RequestCallback}
     */
    request: function(options, callback) {
        var method = options.method || 'get';
        var encoding = options.encoding || 'utf-8';
        var dataType = options.dataType || 'buffer';
        var urlData = URL.parse(options.url);
        var data = options.data;

        // method
        method = method.toLowerCase();

        // data
        if(data) {
            if(!options.json) {
                if(encoding !== 'gbk') {
                    data = qs.stringify(data);
                }
                else {
                    data = qs.stringify(data, null, null, {
                        encodeURIComponent: escape
                    });
                }
            }
            else {
                data = JSON.stringify(data);
            }
        }

        var headers = options.headers;
        if(!headers) {
            headers = options.headers = {};
        }
        if(method === 'post') {
            headers['Content-Type'] = !options.json ?
                'application/x-www-form-urlencoded' :
                'application/json';

            headers['Content-Length'] = Buffer.byteLength(data);
        }

        // ua
        if(!headers['user-agent']) {
            headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36';
        }

        var params = {
            method: method.toUpperCase(),
            hostname: urlData.hostname,
            port: urlData.port || 80,
            path: urlData.path,
            headers: headers
        };

        // console.log('Request:', params.method, data, params);

        var httpLib = options.https ? https : http;
        var req = httpLib.request(params, function(res) {
            var data = [];
            var dataLen = 0;

            res.on('data', function(chunk) {
                dataLen += chunk.length;
                data.push(chunk);
            })
            .on('end', function() {
                var buf = Buffer.concat(data, dataLen);
                var txt = iconv.decode(buf, encoding);

                if(dataType === 'buffer') {
                    buf = iconv.encode(txt, 'utf-8');
                }

                var ret = {
                    content: dataType === 'buffer' ? buf : txt,
                    statusCode: res.statusCode,
                    headers: res.headers,
                };

                callback(null, ret, res, req);
            });
        })
        .on('error', function(err) {
            callback(err);
        });

        // timeout
        var timeout = options.timeout;
        if(timeout === undefined) {
            timeout = 60 * 1000;
        }
        if(timeout && timeout > 0) {
            req.setTimeout(timeout, function() {
                callback(new Error('Request timeout'));
            });
        }

        if(data) {
            req.write(data);
        }

        req.end();
    },
    /**
     * http get
     * @param  {String}   url      [description]
     * @param  {Object}   data      [description]
     * @param  {Function} callback [description]
     * @return {Void}            [description]
     */
    get: function(url, data, callback, encoding, dataType) {
        if(typeof data === 'function') {
            dataType = encoding;
            encoding = callback;
            callback = data;
            data = null;
        }

        return this.request({
            encoding: encoding,
            dataType: dataType,
            data: data,
            url: url
        }, callback);
    },
    /**
     * http post
     * @param  {String}   url      [description]
     * @param  {Object}   data      [description]
     * @param  {Function} callback [description]
     * @return {Void}            [description]
     */
    post: function(url, data, callback, encoding, dataType) {
        return this.request({
            encoding: encoding,
            dataType: dataType,
            method: 'post',
            data: data,
            url: url
        }, callback);
    },
    // 自动补全路径
    mkDeepDir: function(destPath) {
        var tmpPath = '';
        var destPaths = [];
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
    },
    // 同步保存文件
    writeFile: function(filePath, content) {
        var destPath = path.dirname(filePath);

        this.mkDeepDir(destPath);

        // 同步写入文件
        fs.writeFileSync(filePath, content);
    }
};

module.exports = tools;
