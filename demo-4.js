#!/usr/bin/env node

/**
 * demo-4
 * 根据 IP 抓取 ip138 数据
 *
 * @author xiaomi
 */

var fs = require('fs');
var URL = require('url');
var path = require('path');
var tools = require('./tools');

// 流程
// 1. 读取数据
// 2. 分析数据，格式化数据
// 3. 去 IP 地址信息

// digger
var digger = {
    stack: [],
    ipMap: {},
    add: function(ip, callback) {
        var map = this.ipMap[ip];

        if(!map) {
            map = this.ipMap[ip] = {
                resolved: false,
                inStack: false,
                callbacks: [],
                ip: ip
            };
        }

        if(!map.resolved) {
            map.callbacks.push(callback);

            if(!map.inStack) {
                console.log('加入队列:', ip);

                this.stack.push(map);
                map.inStack = true;
            }
        }
        else {
            callback(map.result);
        }

        this.next();
    },
    // 限速，限流
    status: 'ready',
    next: function() {
        if(this.status !== 'ready') {
            return;
        }

        var self = this;
        var map = this.stack.shift();

        if(!map) {
            console.log('所有任务已完成！');

            return;
        }

        this.status = 'working';

        var url = 'http://www.ip138.com/ips138.asp?action=2&ip=' + map.ip;

        tools.get(url, function(err, data) {
            if(err) {
                throw err;
            }

            // parse
            var ret = self.parseContent(data.content);

            console.log('取得地址：', map.ip, ',', ret.addr);

            // resolved
            map.resolved = true;
            map.result = ret;

            map.callbacks.forEach(function(callback) {
                callback(ret);
            });

            // next
            self.status = 'ready';
            self.next();
        }, 'gbk');
    },
    // 分析资源
    parseContent: function(content) {
        var self = this;
        var html = content.toString();

        var rIpInfo = /(?:本站主数据|参考数据一)：?([^<]+)/;

        var addr = '-';
        if(rIpInfo.test(html)) {
            addr = RegExp.$1;
            addr = addr.trim().replace(/\s+/g, ' ');
        }

        return {
            addr: addr
        };
    }
};

// 读取 csv
fs.readFile('./demo-4.csv', function(err, buf) {
    var content = buf.toString();

    var list = [];
    var tmpArr = content.split('\n');

    tmpArr.forEach(function(str) {
        var arr = str.split('";');

        var data = {
            id: pureVal(arr[0]),
            shopId: pureVal(arr[1]),
            ip: pureVal(arr[2]),
            ua: pureVal(arr[3]),
            date: pureVal(arr[5])
        };

        if(!data.ip) {
            return;
        }

        list.push(data);
    });

    // add to queue
    var resolvedCount = 0;

    list.forEach(function(item) {
        digger.add(item.ip, function(ret) {
            item.addr = ret.addr;

            if(++resolvedCount >= list.length) {
                var filename = './demo-4-result.json';
                var str = JSON.stringify(list, null, 2);

                fs.writeFileSync(filename, str);

                console.log('写入文件：', filename);
            }
        });
    });

    // funs
    function pureVal(val) {
        return (val || '').trim().replace(/(?:^"|"$)/g, '');
    }
});

// 首页 开始
// digger.add('192.168.1.1', function(ret) {

// });
