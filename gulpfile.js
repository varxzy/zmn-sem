// 导入工具包 require('node_modules 里对应模块')
var gulp = require('gulp'), // 本地安装 gulp 所用到的地方
    cleanCSS = require('gulp-clean-css'), // css 压缩
    htmlmin = require('gulp-htmlmin'), // html 压缩
    uglify = require('gulp-uglify'), // js 压缩
    imagemin = require('gulp-imagemin'), // 图片压缩
    rename = require('gulp-rename'), // 文件重命名
    concat = require('gulp-concat'), // 文件合并
    // sftp = require('gulp-sftp'), // 文件上传
    // ftp = require('gulp-ftp'), // 文件上传
    ssh = require('gulp-ssh'), // 文件上传
    argv = require('yargs').argv, // 接受命令行参数
    replace = require('gulp-replace'), // 替换字符串
    usemin = require('gulp-usemin'),
    contentInclude = require('gulp-content-includer'), // 插入公共模板
    del = require('del'),
    // config = require('./config.json'),
    newDate = new Date();

// 命令行参数：gulp helloTask --dir=[页面目录] --device=[pc/mb] --subdir=[ks/tt|tx]
var dir = argv.dir,
    device = argv.device,
    subdir = argv.subdir || false,
    pcPath = [["liuxue", "eduuii", "lxwedu", "qcwxx", "nmmedu", "kaoshi"], ["http://liuxue.zmnedu.com", "http://zmn.eduuii.com", "http://zmn.lxwedu.com.cn", "http://zmn.qcwxx.cn", "http://zmn.nmmedu.com", "http://kaoshi.zmnedu.com"]],
    mbPath = [["lx", "m_eduuii", "m_lxwedu", "m_qcwxx", "m_nmmedu", "ks"], ["http://lx.zmnedu.com", "http://zmnedu.eduuii.com", "http://zmnedu.lxwedu.com.cn", "http://zmnedu.qcwxx.cn", "http://zmnedu.nmmedu.com", "http://ks.zmnedu.com"]];

var config = {
    host: "123.57.48.116",
    username: "zmnsem",
    password: "hellozmnsem123",
    port: 22
}

var gulpSsh = new ssh({
    ignoreErrors: true,
    sshConfig: config
})

// 定义工作流任务
gulp.task('minifyHtml', function() {
    var options = {
            removeComments: true, // 清除HTML注释
            collapseWhitespace: true, // 压缩HTML
            removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
            minifyJS: true, // 压缩页面JS
            minifyCSS: true // 压缩页面CSS
        },
        imgUrl = 'src="/static/' + dir + '/images'
    return gulp.src('src/' + device + '/' + dir + '/index.html')
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
            path: 'src/' + device + '/' + dir,
            outputRelativePath: '../'
        }))
        .pipe(gulp.dest('dist/' + device + '/' + dir));
});

gulp.task('minifyCss', function() {
    return gulp.src('src/' + device + '/' + dir + '/*.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/' + device + '/static/' + dir));
});

gulp.task('minifyImg', function () {
    return gulp.src('src/' + device + '/' + dir + '/images/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/' + device + '/static/' + dir + '/images'));
});

gulp.task('minifyHtmlBase', function() {
    var options = {
            removeComments: true, // 清除HTML注释
            collapseWhitespace: true, // 压缩HTML
            removeEmptyAttributes: true, // 删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true, // 删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true, // 删除<style>和<link>的type="text/css"
            minifyJS: true, // 压缩页面JS
            minifyCSS: true // 压缩页面CSS
        };
    return gulp.src('src/' + device + '/static/common/*.html')
        .pipe(replace(/<!\-\-\s+build\:/g, '!-- build:'))
        .pipe(replace(/<!\-\-\s+endbuild/g, '!-- endbuild'))
        .pipe(htmlmin(options))
        .pipe(replace(/!\-\-\s+build\:/g, '<!-- build:'))
        .pipe(replace(/!\-\-\s+endbuild/g, '<!-- endbuild'))
        .pipe(usemin({
            path: 'src/' + device,
            outputRelativePath: '../../'
        }))
        .pipe(gulp.dest('dist/' + device + '/static/common'));
});

gulp.task('minifyCssBase', function() {
    return gulp.src('src/' + device + '/static/common/common_liuxue.css')
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/' + device + '/static/common'));
});

gulp.task('minifyJsBase', function() {
    return gulp.src('src/' + device + '/static/common/common_liuxue.js')
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/' + device + '/static/common'));
});

gulp.task('minifyImgBase', function() {
    return gulp.src('src/' + device + '/static/common/**/*.{png,jpg,gif,jpeg}')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/' + device + '/static/common/'));
});

gulp.task('uploadHtml', ['minifyHtml'], function() {
    var outPagePath = 'dist/' + device + '/' + dir + '/index.html';
    if(device == "pc"){
        if(subdir == "ks") {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/http\:\/\/([^\/]+)/g, pcPath[1][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/ks/' + dir));
            }
            gulp.src(outPagePath)
                .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                .pipe(replace(/http\:\/\/([^\/]+)/g, pcPath[1][5]))
                .pipe(gulpSsh.dest('/sem/' + pcPath[0][5] + '/' + dir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/http\:\/\/([^\/]+)/g, pcPath[1][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/' + dir));
            }
        }
    } else if(device == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                    .pipe(replace(/http\:\/\/([^\/]+)/g, mbPath[1][i]))
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/' + dir));
            }
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                .pipe(replace(/http\:\/\/([^\/]+)/g, mbPath[1][5]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/' + dir));
        } else if(subdir == "tt" || subdir == "tx") {
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                .pipe(replace(/http\:\/\/([^\/]+)/g, mbPath[1][0]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/tt/' + dir)),
            gulp.src(outPagePath)
                // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + mbPath[0][i]))
                // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + mbPath[0][i]))
                .pipe(replace(/http\:\/\/([^\/]+)/g, mbPath[1][0]))
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/tx/' + dir));
        } else {
            for(var i = 0, len = pcPath[0].length - 1; i < len; i++) {
                gulp.src(outPagePath)
                    // .pipe(replace(/clicked\'\,\'([^_]*)/g, "clicked" + "','" + pcPath[0][i]))
                    // .pipe(replace(/clicked\"\,\"([^_]*)/g, 'clicked' + '","' + pcPath[0][i]))
                    .pipe(replace(/http\:\/\/([^\/]+)/g, pcPath[1][i]))
                    .pipe(gulpSsh.dest('/sem/' + pcPath[0][i] + '/' + dir));
            }
        }
    }
});

gulp.task('uploadCss', ['minifyCss'], function() {
    var outImgPath = 'dist/' + device + '/static/' + dir + '/*.css';
    if(device == "pc"){
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
    } else if(device == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + dir));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/static/' + dir));
        } else if(subdir == "tt" || subdir == "tx") {
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + dir)),
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

gulp.task('uploadImg', ['minifyImg'], function() {
    var outImgPath = 'dist/' + device + '/static/' + dir + '/images/*';
    if(device == "pc"){
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
    } else if(device == "mb"){
        if(subdir == "ks") {
            for(var i = 0, len = mbPath[0].length - 1; i < len; i++) {
                gulp.src(outImgPath)
                    .pipe(gulpSsh.dest('/sem/' + mbPath[0][i] + '/ks/static/' + dir + '/images'));
            }
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][5] + '/static/' + dir + '/images'));
        } else if(subdir == "tt" || subdir == "tx") {
            gulp.src(outImgPath)
                .pipe(gulpSsh.dest('/sem/' + mbPath[0][0] + '/static/' + dir + '/images')),
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
gulp.task('uploadDev', function() {
    var devPath = 'src/' + device + '/' + dir + '/**';
    gulp.src(devPath)
        .pipe(gulpSsh.dest('/sem/backup/' + device + '/' + dir + newDate.format("yyyyMMdd")));
});

// 生成 common 文件
gulp.task('buildBase_dev', ['minifyHtmlBase', 'minifyCssBase', 'minifyImgBase', 'minifyJsBase']);

// 编译开发环境
gulp.task('build_dev', ['minifyHtml', 'minifyImg', 'buildBase_dev']);

// 部署生产环境
gulp.task('build_dist', ['uploadHtml', 'uploadCss', 'uploadImg']);

// 清空 dist 文件
gulp.task('cleanDist', function() {
    return del('dist/');
});


Date.prototype.format = function(format) {
    var date = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
            "H+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
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

