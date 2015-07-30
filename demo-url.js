var URL = require('url');

// 目标站点，必须以 / 结尾
var siteUrl = 'http://aaaaaashu.gitbooks.io/mac-dev-setup/content/';

test();

console.log('-----');

siteUrl = siteUrl.slice(0, -1);

test();


function test() {
    console.log(URL.resolve(siteUrl, ''));
    console.log(URL.resolve(siteUrl, 'aaaa'));
    console.log(URL.resolve(siteUrl, '/aaaa'));
    console.log(URL.resolve(siteUrl, './aaaa'));
    console.log(URL.resolve(siteUrl, '../aaaa'));
    console.log(URL.resolve(siteUrl, 'http://xxx.com/xxx'));
}
