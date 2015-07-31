/**
 * demo-2
 * 整站抓取
 *
 * @author xiaomi
 */

var URL = require('url');
var path = require('path');
var tools = require('./tools');

// 流程
// 1. 抓取首页
// 2. 写入文件，分析代码，
// 3. 递归抓取外部资源


// 目标站点，必须以 / 结尾
var siteUrl = 'http://aaaaaashu.gitbooks.io/mac-dev-setup/content/';

// 最大深度
// var maxDeep = 3;

// digger
var digger = {
    stack: [],
    uriMap: {},
    add: function(url, parentUrl) {
        // 去掉 hash
        url = url.replace(/#.*$/, '');

        // 检测 URL 合法性
        if(!url) {
            return;
        }

        // 补全 /index.html
        if(url.slice(-1) === '/') {
            url += 'index.html';
        }

        // URL计算较为复杂，但是困难的事情一般组件都帮忙干了~
        parentUrl = URL.resolve(siteUrl, parentUrl || '');
        url = URL.resolve(parentUrl, url);

        // 不加载外站资源
        if(url.indexOf(siteUrl) !== 0) {
            return;
        }

        // 内部以相对路径存储
        var uri = url.slice(siteUrl.length);

        var uriMap = this.uriMap;
        if(uriMap[uri]) {
            return;
        }

        uriMap[uri] = {
            status: 'loading'
        };

        this.stack.push(uri);

        console.log('加入队列:', uri);

        this.next();
    },
    // 限速，限流
    status: 'ready',
    next: function() {
        if(this.status !== 'ready') {
            return;
        }

        var self = this;
        var uri = this.stack.shift();

        if(!uri) {
            console.log('所有任务已完成！');

            return;
        }
        this.status = 'working';

        var url = URL.resolve(siteUrl, uri);

        console.log('开始加载资源:', uri);

        tools.get(url, function(err, data) {
            if(err) {
                throw err;
            }

            // save
            self.saveContent(uri, data);

            // parse html
            var type = data.headers['content-type'];
            if(type && type.indexOf('text/html') === 0) {
                self.parseContent(data.content, uri);
            }

            // next
            self.status = 'ready';
            self.next();
        });
    },
    // 分析资源
    parseContent: function(content, uri) {
        var self = this;
        var rRes = /(?:href|src)\s*=\s*(["'])(.+?)\1/ig;

        console.log('开始分析：', uri);

        var html = content.toString();
        var attrs = html.match(rRes);

        if(!attrs) {
            return;
        }

        // 加入队列
        attrs.forEach(function(attr) {
            rRes.lastIndex = 0;

            if(rRes.test(attr)) {
                self.add(RegExp.$2, uri);
            }
        });
    },
    // 保存文件
    savePath: 'demo-2/',
    saveContent: function(uri, data) {
        // 避免重复写入
        var map = this.uriMap[uri];
        if(map.status === 'saved') {
            return;
        }
        map.status = 'saved';

        console.log('写入文件：', uri);

        var filePath = path.join(this.savePath, uri);
        tools.writeFile(filePath, data.content);
    }
};

// 首页 开始
digger.add(siteUrl);


/*** 考虑以下问题 ***/
//
// 1. 所有外部资源均为加载，大部分CDN均为外部资源
// 2. CSS 文件未分析
// 3. 路径最大深度限制
// 4. 抓到内容以后拿来干什么？！！
// 5. ...