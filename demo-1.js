/**
 * demo-1
 * 抓取欢乐逛首页
 *
 * @author xiaomi
 */

var fs = require('fs');

var tools = require('./tools');

var url = 'http://www.huanleguang.com';

console.log('Start Loading...');

tools.get(url, function(err, data) {
    if(err) {
        throw err;
    }

    console.log('Loaded:', data);

    console.log('----');

    var filePath = 'demo-1.html';
    fs.writeFile(filePath, data.content, function() {
        console.log('写入文件：', filePath);
    });
});


