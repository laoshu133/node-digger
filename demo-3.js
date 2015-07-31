#!/usr/bin/env node

/**
 * demo-3
 * 指定内容抓取
 *
 * @author xiaomi
 */

var URL = require('url');
var path = require('path');
var tools = require('./tools');

// 流程
// 1. 抓取第一张
// 2. 分析并找到所有列表地址，加入队列
// 3. 遍历每一张，获取大图


// 目标站点，以 ZOL 壁纸为例
var targetUrl = 'http://desk.zol.com.cn/bizhi/5699_70946_2.html';

// 保存目录
var savePath = 'demo-3/';

// 支持命令行参数
var args = [].slice.call(process.argv, 2);
if(args[0]) {
    targetUrl = args[0];
}
if(args[1]) {
    savePath = args[1];
}


// digger
var digger = {
    stack: [],
    urlMap: {},
    add: function(url) {
        // 去掉 hash
        url = url.replace(/#.*$/, '');

        // 检测 URL 合法性
        if(!url || this.urlMap[url]) {
            return;
        }
        this.urlMap[url] = true;

        this.stack.push(url);

        console.log('加入队列:', url);

        this.next();
    },
    // 限速，限流
    status: 'ready',
    next: function() {
        if(this.status !== 'ready') {
            return;
        }

        var self = this;
        var url = this.stack.shift();

        if(!url) {
            console.log('所有任务已完成！');

            return;
        }

        this.status = 'working';

        tools.get(url, function(err, data) {
            if(err) {
                throw err;
            }

            // parse
            var ret = self.parseContent(data.content);

            // 加入队列
            ret.lists.forEach(function(url) {
                self.add(url);
            });

            // save
            self.saveContent(ret.bigImg, function() {
                // next
                self.status = 'ready';
                self.next();

            });
        });
    },
    // 分析资源
    parseContent: function(content) {
        var self = this;
        var html = content.toString();

        // 分析列表
        // <ul id="showImg" ..>...</ul>
        var listStartIndex = html.indexOf('<ul id="showImg"');
        var listEndIndex = html.indexOf('</ul>', listStartIndex);
        var listHTML = html.slice(listStartIndex, listEndIndex);

        var rRes = /href\s*=\s*(["'])(.+?)\1/ig;
        var attrs = listHTML.match(rRes);
        var lists = [];

        if(attrs) {
            attrs.forEach(function(attr) {
                rRes.lastIndex = 0;

                if(rRes.test(attr)) {
                    var url = URL.resolve(targetUrl, RegExp.$2);

                    lists.push(url);
                }
            });
        }

        // 分析大图
        // <dd id="tagfbl"><a target="_blank" id="1920x1200" href="....</a>...</dd>
        var bigImgStartIndex = html.indexOf('<dd id="tagfbl"');
        var bigImgEndIndex = html.indexOf('</a>', bigImgStartIndex);
        var bigImgHTML = html.slice(bigImgStartIndex, bigImgEndIndex);

        var bigImg = '';
        if(rRes.test(bigImgHTML)) {
            bigImg = URL.resolve(targetUrl, RegExp.$2);
        }

        return {
            bigImg: bigImg,
            lists: lists
        };
    },
    // 保存文件
    savePath: savePath,
    saveContent: function(url, callback) {
        var self = this;
        var rRes = /src\s*=\s*(["'])(.+?)\1/ig;

        tools.get(url, function(err, data) {
            if(err) {
                throw err;
            }

            var html = data.content.toString();

            if(!rRes.test(html)) {
                callback();

                return;
            }

            var bigImgUrl = RegExp.$2;

            console.log('开始加载大图：', bigImgUrl);

            tools.get(bigImgUrl, function(err, data) {
                if(err) {
                    throw err;
                }

                var filename = path.basename(bigImgUrl);
                var filePath = path.join(self.savePath, filename);

                console.log('写入文件：', filePath);

                tools.writeFile(filePath, data.content);

                // next
                callback();
            });
        });
    }
};

// 首页 开始
digger.add(targetUrl);


/*** 考虑一下问题 ***/
//
// 1. 性能
// 2. 规则自定义
// 3. ...
//
//