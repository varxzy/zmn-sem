## zmn-sem
啄木鸟 SEM 推广专题构建工具

### gulp 相关命令及参数说明：
**语法：** gulp [任务名] --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
**任务名：** 即定义的各个任务模块别名
* minify_html：压缩 html，同时会对引用的app.css进行压缩并输出至dist/ 对应目录；
* minify_css：压缩 css；
* minify_img：压缩图片；
* upload_html：上传 html 文件，上传之前会对页面中的链接及点击事件跟踪代码；
* upload_css：上传 css 文件；
* upload_js：上传 js 文件；
* upload_img：上传 image 文件；
* upload_dev：上传页面源代码, 对页面源代码进行备份；将页面源代码上传至服务器 /sem/sem_test/dev/ 目录，用于后期页面维护修改；上传至服务器的页面源代码目录命名为：页面目录 + 当前日期，eq: tfpx20170321；
* build_dist：部署代码至生产环境，即 `upload_html` `upload_css` `upload_img` 三个任务的集合体；
* clean_dist：清除 dist 目录，每次执行 `build_dist` 任务之后需要执行 `clean_dist` 任务清除 dist 目录；

**参数：** 指定页面相关信息
* dir：必填；页面目录，用于定位页面源代码位置；默认值：test；
* type：必填；参数页面类型，指定页面属于PC端页面/移动端页面；值：[pc/mb]，默认：pc；
* subdir：选填；特殊分类，用于考试站及头条/腾讯信息流广告投放页面；值：[ks/tt|tx]，默认：false；

### 常用命令

整合上传：同时上传 html、css、js、image 等文件
```
gulp build_dist --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
```

单类型文件上传：即对 html、css、js、image 等类型文件单独上传
```
gulp upload_html --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
gulp upload_css --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
gulp upload_js --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
gulp upload_img --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
```

上传备份源文件：此操作在页面上线后操作
```
gulp upload_dev --dir=[页面目录] --type=[pc/mb] --subdir=[ks/tt|tx]
```

清除 dist 目录：每次项目完成上线之后，建议清除 dist 文件目录
```
gulp clean_dist
```

### sftp 配置文件
config.sftp.js

```javascript
var config = {};
function ftpConfig() {
    return config = {
        host: "127.0.0.1",
        user: "name",
        pass: "pass",
        port: 21
    }
}

exports.sftp = ftpConfig;
```
