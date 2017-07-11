// 导入工具包 require('node_modules 里对应模块')
var gulp = require('gulp'),                                     // 本地安装 gulp 所用到的地方
    cleanCSS = require('gulp-clean-css'),                       // css 压缩
    htmlmin = require('gulp-htmlmin'),                          // html 压缩
    uglify = require('gulp-uglify'),                            // js 压缩
    imagemin = require('gulp-imagemin'),                        // 图片压缩
    rename = require('gulp-rename'),                            // 文件重命名
    concat = require('gulp-concat'),                            // 文件合并
    ssh = require('gulp-ssh'),                                  // 文件上传
    argv = require('yargs').argv,                               // 接受命令行参数
    replace = require('gulp-replace'),                          // 替换字符串
    usemin = require('gulp-usemin'),                            // 文件压缩合并
    contentInclude = require('gulp-content-includer'),          // 插入公共模板
    del = require('del'),                                       // 文件目录清除
    config = require('./config.sftp.js'),                       // sftp 配置文件
    newDate = new Date();                                       // 时间戳

// 命令行参数：gulp [任务名] --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx/bd]
var dir = argv.dir || "test",
    type = argv.type || "pc",
    subdir = argv.subdir || false,
    ksdir = "",
    pcPath = [["liuxue", "lxwedu", "qcwxx", "yytby", "kaoshi"], ["http://liuxue.zmnedu.com", "http://zmn.lxwedu.com.cn", "http://zmn.qcwxx.cn", "http://zmn.yytby.com.cn", "http://kaoshi.zmnedu.com"], ["400-888-5185", "400-858-0855", "400-858-0855", "400-858-0855", "400-888-5185"], ["4008885185", "4008580855", "4008580855", "4008580855", "4008885185"]],
    mbPath = [["lx", "m_lxwedu", "m_qcwxx", "m_yytby", "ks"], ["http://lx.zmnedu.com", "http://zmnedu.lxwedu.com.cn", "http://zmnedu.qcwxx.cn", "http://zmnedu.yytby.com.cn", "http://ks.zmnedu.com"], ["400-888-5185", "400-858-0855", "400-858-0855", "400-858-0855", "400-888-5185"], ["4008885185", "4008580855", "4008580855", "4008580855", "4008885185"]],
    k = pcPath[0].length - 1;

var gulpSsh = new ssh({
    ignoreErrors: true,
    sshConfig: config.sftp()
})

if(dir == 'index_ks' || subdir == 'ks') {
    ksdir = '/ks';
}

// 时间格式化
Date.prototype.format = function(format) {
    var date = {
            "M+": this.getMonth() + 1,                                          //月份
            "d+": this.getDate(),                                               //日
            "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12,        //小时
            "H+": this.getHours(),                                              //小时
            "m+": this.getMinutes(),                                            //分
            "s+": this.getSeconds(),                                            //秒
            "q+": Math.floor((this.getMonth() + 3) / 3),                        //季度
            "S": this.getMilliseconds()                                         //毫秒
        };
    // 年(y)的占位符
    if(/(y+)/.test(format)){
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    // 其他各元素占位符
    for(var k in date){
        if(new RegExp("(" + k + ")").test(format)){
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
}

// 压缩 Html
gulp.task('minify_html', function() {
    var options = {
            removeComments: true,                               // 清除HTML注释
            collapseWhitespace: true,                           // 压缩HTML
            removeEmptyAttributes: true,                        // 删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true,                   // 删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true,                // 删除<style>和<link>的type="text/css"
            minifyJS: true,                                     // 压缩页面JS
            minifyCSS: true                                     // 压缩页面CSS
        },
        inHtmlPath = 'src/' + type + '/' + dir + '/index.html';
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    return gulp.src(inHtmlPath)
        .pipe(replace(/<!\-\-\s+build\:/g, '!-- build:'))
        .pipe(replace(/<!\-\-\s+endbuild/g, '!-- endbuild'))
        .pipe(replace(/<!\-\-#include\s+virtual="/g, '!--#include virtual="'))
        .pipe(htmlmin(options))
        .pipe(replace(/!\-\-\s+build\:/g, '<!-- build:'))
        .pipe(replace(/!\-\-\s+endbuild/g, '<!-- endbuild'))
        .pipe(replace(/!\-\-#include\s+virtual="/g, '<!--#include virtual="'))
        .pipe(usemin({
            pagejs: [],
            pagecss: [cleanCSS()],
            path: 'src/' + type + '/' + dir,
            outputRelativePath: '../'
        }))
        .pipe(gulp.dest('dist/' + type + '/' + redir));
});

// 压缩 Css
gulp.task('minify_css', function() {
    var inCssPath = 'src/' + type + '/' + dir + '/*.css';
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    return gulp.src(inCssPath)
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/' + type + ksdir + '/static/' + redir));
});

// 压缩 Js
gulp.task('minify_js', function() {
    var inJsPath = 'src/' + type + '/' + dir + '/*.js';
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    return gulp.src(inJsPath)
        // .pipe(uglify())
        .pipe(gulp.dest('dist/' + type + ksdir + '/static/' + redir));
});

// 压缩图片
gulp.task('minify_img', function () {
    var inImgPath = 'src/' + type + '/' + dir + '/images/*';
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    return gulp.src(inImgPath)
        .pipe(imagemin())
        .pipe(gulp.dest('dist/' + type + ksdir + '/static/' + redir + '/images'));
});

// 上传 Html
gulp.task('upload_html', ['minify_html'], function() {
    var outHtmlPath = 'dist/' + type + '/' + dir + '/index.html',
        imgUrl = 'src="' + ksdir + '/static/' + dir + '/images',
        dataImgUrl = 'data-url="' + ksdir + '/static/' + dir + '/images';
    if(type == "pc"){
        if(dir == "index") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outHtmlPath)
                    .pipe(replace(/src\=\"images/g, imgUrl))
                    .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/href=\"http\:\/\/liuxue\.zmnedu\.com/g, 'href="' + pcPath[1][i]))
                    .pipe(replace(/window\.open\(\"http\:\/\/liuxue\.zmnedu\.com/g, 'window.open("' + pcPath[1][i]))
                    .pipe(replace('400-888-5185', pcPath[2][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i]));
            }
        } else if(dir == "index_ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src('dist/' + type + '/index/index.html')
                    .pipe(replace(/src\=\"images/g, 'src="' + ksdir + '/static/index/images'))
                    .pipe(replace(/data\-url\=\"images/g, 'data-url="' + ksdir + '/static/index/images'))
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/href=\"http\:\/\/liuxue\.zmnedu\.com/g, 'href="' + pcPath[1][i]))
                    .pipe(replace(/window\.open\(\"http\:\/\/liuxue\.zmnedu\.com/g, 'window.open("' + pcPath[1][i]))
                    .pipe(replace('400-888-5185', pcPath[2][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks'));
            }
            gulp.src('dist/' + type + '/index/index.html')
                .pipe(replace('href="/static/common/common_liuxue.css"', 'href="/static/common/common_kaoshi.css"'))
                .pipe(replace('src="/static/common/common_liuxue.js"', 'src="/static/common/common_kaoshi.js"'))
                .pipe(replace(/href=\"\/ks\/static\/.*\.css\"/g, 'href="/static/index/index.css"'))
                .pipe(replace(/<script.*src=\"\/ks\/static/g, '<script src="/static'))
                .pipe(replace('virtual="/static/common/header_liuxue.html"', 'virtual="/static/common/header_kaoshi.html"'))
                .pipe(replace('virtual="/static/common/footer_liuxue.html"', 'virtual="/static/common/footer_kaoshi.html"'))
                .pipe(replace('virtual="/static/common/code_liuxue.html"', 'virtual="/static/common/code_kaoshi.html"'))
                .pipe(replace(/src\=\"images/g, 'src="/static/index/images'))
                .pipe(replace(/data\-url\=\"images/g, 'data-url="/static/index/images'))
                .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][k]))
                .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][k]))
                .pipe(replace(/href=\"http\:\/\/liuxue\.zmnedu\.com\/ks/g, 'href="' + pcPath[1][k]))
                .pipe(replace(/window\.open\(\"http\:\/\/liuxue\.zmnedu\.com\/ks/g, 'window.open("' + pcPath[1][k]))
                .pipe(replace('400-888-5185', pcPath[2][k]))
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][k]));
        } else {
            if(subdir == "ks") {
                for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                    gulp.src(outHtmlPath)
                        .pipe(replace(/src\=\"images/g, imgUrl))
                        .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                        .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                        .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                        .pipe(replace(/href=\"http\:\/\/liuxue\.zmnedu\.com/g, 'href="' + pcPath[1][i]))
                        .pipe(replace(/window\.open\(\"http\:\/\/liuxue\.zmnedu\.com/g, 'window.open("' + pcPath[1][i]))
                        .pipe(replace('400-888-5185', pcPath[2][i]))
                        .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/' + dir));
                }
                gulp.src(outHtmlPath)
                    .pipe(replace('href="/static/common/common_liuxue.css"', 'href="/static/common/common_kaoshi.css"'))
                    .pipe(replace('src="/static/common/common_liuxue.js"', 'src="/static/common/common_kaoshi.js"'))
                    .pipe(replace(/href=\"\/ks\/static\/.*\.css\"/g, 'href="/static/' + dir + '/' + dir + '.css"'))
                    .pipe(replace(/<script.*src=\"\/ks\/static/g, '<script src="/static'))
                    .pipe(replace('virtual="/static/common/header_liuxue.html"', 'virtual="/static/common/header_kaoshi.html"'))
                    .pipe(replace('virtual="/static/common/footer_liuxue.html"', 'virtual="/static/common/footer_kaoshi.html"'))
                    .pipe(replace('virtual="/static/common/liuxue_xiaoqu.html"', 'virtual="/static/common/kaoshi_xiaoqu.html"'))
                    .pipe(replace('virtual="/static/common/code_liuxue.html"', 'virtual="/static/common/code_kaoshi.html"'))
                    .pipe(replace(/src\=\"images/g, 'src="/static/' + dir + '/images'))
                    .pipe(replace(/data\-url\=\"images/g, 'data-url="/static/' + dir + '/images'))
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][k]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][k]))
                    .pipe(replace(/href=\"http\:\/\/liuxue\.zmnedu\.com\/ks/g, 'href="' + pcPath[1][k]))
                    .pipe(replace(/window\.open\(\"http\:\/\/liuxue\.zmnedu\.com\/ks/g, 'window.open("' + pcPath[1][k]))
                    .pipe(replace('400-888-5185', pcPath[2][k]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][k] + '/' + dir));
            } else {
                for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                    gulp.src(outHtmlPath)
                        .pipe(replace(/src\=\"images/g, imgUrl))
                        .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                        .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                        .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                        .pipe(replace(/href=\"http\:\/\/liuxue\.zmnedu\.com/g, 'href="' + pcPath[1][i]))
                        .pipe(replace(/window\.open\(\"http\:\/\/liuxue\.zmnedu\.com/g, 'window.open("' + pcPath[1][i]))
                        .pipe(replace('400-888-5185', pcPath[2][i]))
                        .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/' + dir));
                }
            }
        }
    } else if(type == "mb"){
        if(dir == 'index') {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outHtmlPath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                    .pipe(replace(/src\=\"images/g, imgUrl))
                    .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                    .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][i]))
                    .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][i]))
                    .pipe(replace('400-888-5185', mbPath[2][i]))
                    .pipe(replace('4008885185', mbPath[3][i]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i]));
            }
        } else if(dir == 'index_ks') {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src('dist/' + type + '/index/index.html')
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                    .pipe(replace(/src\=\"images/g, 'src="' + ksdir + '/static/index/images'))
                    .pipe(replace(/data\-url\=\"images/g, 'data-url="' + ksdir + '/static/index/images'))
                    .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][i]))
                    .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][i]))
                    .pipe(replace('400-888-5185', mbPath[2][i]))
                    .pipe(replace('4008885185', mbPath[3][i]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks'));
            }
            gulp.src('dist/' + type + '/index/index.html')
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][k]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][k]))
                .pipe(replace('href="/static/common/common_lx.css"', 'href="/static/common/common_ks.css"'))
                .pipe(replace('src="/static/common/common_lx.js"', 'src="/static/common/common_ks.js"'))
                .pipe(replace(/href=\"\/ks\/static/g, 'href="/static'))
                // .pipe(replace('href="/ks/static/index/index.css"', 'href="/static/index/index.css"'))
                .pipe(replace('virtual="/static/common/header_lx.html"', 'virtual="/static/common/header_ks.html"'))
                .pipe(replace('virtual="/static/common/footer_lx.html"', 'virtual="/static/common/footer_ks.html"'))
                .pipe(replace('virtual="/static/common/code_lx.html"', 'virtual="/static/common/code_ks.html"'))
                .pipe(replace(/<script.*src=\"\/ks\/static/g, '<script src="/static'))
                .pipe(replace(/src\=\"images/g, 'src="/static/index/images'))
                .pipe(replace(/data\-url\=\"images/g, 'data-url="/static/index/images'))
                .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com\/ks/g, 'href="' + mbPath[1][k]))
                .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com\/ks/g, 'window.open("' + mbPath[1][k]))
                .pipe(replace('400-888-5185', mbPath[2][k]))
                .pipe(replace('4008885185', mbPath[3][k]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][k]));
        } else {
            if(subdir == "ks") {
                for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                    gulp.src(outHtmlPath)
                        // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                        // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                        .pipe(replace(/src\=\"images/g, imgUrl))
                        .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                        .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][i]))
                        .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][i]))
                        .pipe(replace('400-888-5185', mbPath[2][i]))
                        .pipe(replace('4008885185', mbPath[3][i]))
                        .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/' + dir));
                }
                gulp.src(outHtmlPath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][k]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][k]))
                    .pipe(replace('href="/static/common/common_lx.css"', 'href="/static/common/common_ks.css"'))
                    .pipe(replace('src="/static/common/common_lx.js"', 'src="/static/common/common_ks.js"'))
                    .pipe(replace(/href=\"\/ks\/static/g, 'href="/static'))
                    .pipe(replace('virtual="/static/common/header_lx.html"', 'virtual="/static/common/header_ks.html"'))
                    .pipe(replace('virtual="/static/common/footer_lx.html"', 'virtual="/static/common/footer_ks.html"'))
                    .pipe(replace('virtual="/static/common/code_lx.html"', 'virtual="/static/common/code_ks.html"'))
                    .pipe(replace(/href=\"\/ks\/static\/.*\.css\"/g, 'href="/static/' + dir + '/' + dir + '.css"'))
                    .pipe(replace(/<script src=\"\/ks\/static/g, '<script src="/static'))
                    .pipe(replace('virtual="/ks/static/common/header_ks.html"', 'virtual="/static/common/header_ks.html"'))
                    .pipe(replace('virtual="/ks/static/common/footer_ks.html"', 'virtual="/static/common/footer_ks.html"'))
                    .pipe(replace('virtual="/ks/static/common/code_ks.html"', 'virtual="/static/common/code_ks.html"'))
                    .pipe(replace(/src\=\"images/g, 'src="/static/' + dir + '/images'))
                    .pipe(replace(/data\-url\=\"images/g, 'data-url="/static/' + dir + '/images'))
                    .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com\/ks/g, 'href="' + mbPath[1][k]))
                    .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com\/ks/g, 'window.open("' + mbPath[1][k]))
                    .pipe(replace('400-888-5185', mbPath[2][k]))
                    .pipe(replace('4008885185', mbPath[3][k]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][k] + '/' + dir));
            } else if(subdir == "tt" || subdir == "tx") {
                gulp.src(outHtmlPath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][0]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][0]))
                    .pipe(replace(/src\=\"images/g, imgUrl))
                    .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                    .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][0]))
                    .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][0]))
                    .pipe(replace('400-888-5185', mbPath[2][0]))
                    .pipe(replace('4008885185', mbPath[3][0]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/tt/' + dir)),
                gulp.src(outHtmlPath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][0]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][0]))
                    .pipe(replace(/src\=\"images/g, imgUrl))
                    .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                    .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][0]))
                    .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][0]))
                    .pipe(replace('400-888-5185', mbPath[2][0]))
                    .pipe(replace('4008885185', mbPath[3][0]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/tx/' + dir));
            } else if(subdir == "bd") {
                gulp.src(outHtmlPath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][0]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][0]))
                    .pipe(replace(/src\=\"images/g, imgUrl))
                    .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                    .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][0]))
                    .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][0]))
                    .pipe(replace('400-888-5185', mbPath[2][0]))
                    .pipe(replace('4008885185', mbPath[3][0]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/bdtt/' + dir));
            } else {
                for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                    gulp.src(outHtmlPath)
                        // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                        // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                        .pipe(replace(/src\=\"images/g, imgUrl))
                        .pipe(replace(/data\-url\=\"images/g, dataImgUrl))
                        .pipe(replace(/href=\"http\:\/\/lx\.zmnedu\.com/g, 'href="' + mbPath[1][i]))
                        .pipe(replace(/window\.open\(\"http\:\/\/lx\.zmnedu\.com/g, 'window.open("' + mbPath[1][i]))
                        .pipe(replace('400-888-5185', mbPath[2][i]))
                        .pipe(replace('4008885185', mbPath[3][i]))
                        .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/' + dir));
                }
            }
        }
    }
});

// 上传 Css
gulp.task('upload_css', ['minify_css'], function() {
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    var outCssPath = 'dist/' + type + ksdir + '/static/' + redir + '/*.css';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outCssPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/static/' + redir));
            }
            gulp.src(outCssPath)
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][k] + '/static/' + redir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outCssPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/static/' + redir));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outCssPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + redir));
            }
            gulp.src(outCssPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][k] + '/static/' + redir));
        } else if(subdir == "tt" || subdir == "tx" || subdir == "bd") {
            gulp.src(outCssPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + redir));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outCssPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/static/' + redir));
            }
        }
    }
});

// 上传 Js
gulp.task('upload_js', ['minify_js'], function() {
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    var outJsPath = 'dist/' + type + ksdir + '/static/' + redir + '/*.js';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outJsPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/static/' + redir));
            }
            gulp.src(outJsPath)
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][k] + '/static/' + redir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outJsPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/static/' + redir));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outJsPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + redir));
            }
            gulp.src(outJsPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][k] + '/static/' + redir));
        } else if(subdir == "tt" || subdir == "tx" || subdir == "bd") {
            gulp.src(outJsPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + redir));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outJsPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/static/' + redir));
            }
        }
    }
});

// 上传图片
gulp.task('upload_img', ['minify_img'], function() {
    if(dir == 'index_ks') {
        var redir = 'index';
    } else {
        redir = dir;
    }
    var outImgPath = 'dist/' + type + ksdir + '/static/' + redir + '/images/*';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/static/' + redir + '/images'));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][k] + '/static/' + redir + '/images'));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/static/' + redir + '/images'));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + redir + '/images'));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][k] + '/static/' + redir + '/images'));
        } else if(subdir == "tt" || subdir == "tx" || subdir == "bd") {
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + redir + '/images'));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/static/' + redir + '/images'));
            }
        }
    }
});

// 整合上传
gulp.task('build_dist', ['upload_html', 'upload_css', 'upload_js', 'upload_img']);

// 清空 dist 目录
gulp.task('clean_dist', function() {
    return del('dist/');
});

// 上传源文件
gulp.task('upload_dev', function() {
    if(subdir) {
        subdir = subdir + '_';
    } else {
        subdir = "";
    }
    var devPath = 'src/' + type + '/' + dir + '/**';
    gulp.src(devPath)
        .pipe(gulpSsh.dest('/sem/sem_test/dev/' + type + '/' + subdir + dir + newDate.format("yyyyMMdd")));
});
