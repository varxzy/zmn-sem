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
    pcPath = [["liuxue", "eduuii", "lxwedu", "qcwxx", "nmmedu", "kaoshi"], ["http://liuxue.zmnedu.com", "http://zmn.eduuii.com", "http://zmn.lxwedu.com.cn", "http://zmn.qcwxx.cn", "http://zmn.nmmedu.com", "http://kaoshi.zmnedu.com"], ["400-888-5185", "400-858-0855", "400-858-0855", "400-858-0855", "400-858-0855", "400-888-5185"], ["4008885185", "4008580855", "4008580855", "4008580855", "4008580855", "4008885185"]],
    mbPath = [["lx", "m_eduuii", "m_lxwedu", "m_qcwxx", "m_nmmedu", "ks"], ["http://lx.zmnedu.com", "http://zmnedu.eduuii.com", "http://zmnedu.lxwedu.com.cn", "http://zmnedu.qcwxx.cn", "http://zmnedu.nmmedu.com", "http://ks.zmnedu.com"], ["400-888-5185", "400-858-0855", "400-858-0855", "400-858-0855", "400-858-0855", "400-888-5185"], ["4008885185", "4008580855", "4008580855", "4008580855", "4008580855", "4008885185"]];

var gulpSsh = new ssh({
    ignoreErrors: true,
    sshConfig: config.sftp()
})

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
        imgUrl = 'src="/static/' + dir + '/images'
    return gulp.src('src/' + type + '/' + dir + '/index.html')
        .pipe(replace(/<!\-\-\s+build\:/g, '!-- build:'))
        .pipe(replace(/<!\-\-\s+endbuild/g, '!-- endbuild'))
        .pipe(replace(/<!\-\-#include\s+virtual="/g, '!--#include virtual="'))
        .pipe(htmlmin(options))
        .pipe(replace(/!\-\-\s+build\:/g, '<!-- build:'))
        .pipe(replace(/!\-\-\s+endbuild/g, '<!-- endbuild'))
        .pipe(replace(/!\-\-#include\s+virtual="/g, '<!--#include virtual="'))
        .pipe(replace(/src\=\"images/g, imgUrl))
        .pipe(usemin({
            pagecss: [cleanCSS()],
            path: 'src/' + type + '/' + dir,
            outputRelativePath: '../'
        }))
        .pipe(usemin({
            // pagejs: [uglify()],
            path: 'src/' + type + '/' + dir,
            outputRelativePath: '../'
        }))
        .pipe(gulp.dest('dist/' + type + '/' + dir));
});

// 压缩 Css
gulp.task('minify_css', function() {
    return gulp.src('src/' + type + '/' + dir + '/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/' + type + '/static/' + dir));
});

// 压缩图片
gulp.task('minify_img', function () {
    return gulp.src('src/' + type + '/' + dir + '/images/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/' + type + '/static/' + dir + '/images'));
});

// 上传 Html
gulp.task('upload_html', ['minify_html'], function() {
    var outPagePath = 'dist/' + type + '/' + dir + '/index.html';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + pcPath[1][i]))
                    .pipe(replace('400-888-5185', pcPath[2][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/' + dir));
            }
            gulp.src(outPagePath)
                .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][5]))
                .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][5]))
                .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + pcPath[1][5]))
                .pipe(replace('400-888-5185', pcPath[2][5]))
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][5] + '/' + dir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + pcPath[1][i]))
                    .pipe(replace('400-888-5185', pcPath[2][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/' + dir));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                    .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + mbPath[1][i]))
                    .pipe(replace('400-888-5185', mbPath[2][i]))
                    .pipe(replace('4008885185', mbPath[3][i]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/' + dir));
            }
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][5]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][5]))
                .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + mbPath[1][5]))
                .pipe(replace('400-888-5185', mbPath[2][5]))
                .pipe(replace('4008885185', mbPath[3][5]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/' + dir));
        } else if(subdir == "tt" || subdir == "tx") {
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][0]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][0]))
                .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + mbPath[1][0]))
                .pipe(replace('400-888-5185', mbPath[2][0]))
                .pipe(replace('4008885185', mbPath[3][0]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/tt/' + dir)),
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][0]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][0]))
                .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + mbPath[1][0]))
                .pipe(replace('400-888-5185', mbPath[2][0]))
                .pipe(replace('4008885185', mbPath[3][0]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/tx/' + dir));
        } else if(subdir == "bd") {
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][0]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][0]))
                .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + mbPath[1][0]))
                .pipe(replace('400-888-5185', mbPath[2][0]))
                .pipe(replace('4008885185', mbPath[3][0]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/bdtt/' + dir));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                    .pipe(replace(/href=\"http\:\/\/([^\/]+)/g, 'href="' + mbPath[1][i]))
                    .pipe(replace('400-888-5185', mbPath[2][i]))
                    .pipe(replace('4008885185', mbPath[3][i]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/' + dir));
            }
        }
    }
});

// 上传 Css
gulp.task('upload_css', ['minify_css'], function() {
    var outImgPath = 'dist/' + type + '/static/' + dir + '/*.css';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/static/' + dir));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][5] + '/static/' + dir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/static/' + dir));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + dir));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/static/' + dir));
        } else if(subdir == "tt" || subdir == "tx" || subdir == "bd") {
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + dir));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/static/' + dir));
            }
        }
    }
});

// 上传 Js
gulp.task('upload_js', function() {
    var outImgPath = 'dist/' + type + '/static/' + dir + '/*.js';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/static/' + dir));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][5] + '/static/' + dir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/static/' + dir));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + dir));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/static/' + dir));
        } else if(subdir == "tt" || subdir == "tx" || subdir == "bd") {
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + dir));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/static/' + dir));
            }
        }
    }
});

// 上传图片
gulp.task('upload_img', ['minify_img'], function() {
    var outImgPath = 'dist/' + type + '/static/' + dir + '/images/*';
    if(type == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/static/' + dir + '/images'));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][5] + '/static/' + dir + '/images'));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/static/' + dir + '/images'));
            }
        }
    } else if(type == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + dir + '/images'));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/static/' + dir + '/images'));
        } else if(subdir == "tt" || subdir == "tx" || subdir == "bd") {
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + dir + '/images'));
        } else {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/static/' + dir + '/images'));
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
        subdir = subdir + '_'
    }
    var devPath = 'src/' + type + '/' + dir + '/**';
    gulp.src(devPath)
        .pipe(gulpSsh.dest('/sem/sem_test/dev/' + type + '/' + subdir + dir + newDate.format("yyyyMMdd")));
});
