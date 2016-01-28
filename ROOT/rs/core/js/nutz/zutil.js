/**
 * 本文件将提供 Nutz-JS 最基本的帮助函数定义支持，是 Nutz-JS 所有文件都需要依赖的基础JS文件
 *
 * @author  zozoh(zozohtnt@gmail.com)
 * 2012-10 First created
 */
(function () {
//===================================================================

    var INDENT_BY = "    ";

    var zUtil = {
        doCallback : function(callback, args, context){
            if(_.isFunction(callback)){
                callback.apply(context||this, args);
                return;
            }
            return args.length == 1 ? args[0] : args;
        },
        //.............................................
        // 本地存储保存某用户的某个界面的设置
        // appName : 应用名称
        // me      : 用户标识
        // key     : 保存的键
        // val     : 值, undefined 表示获取，null 表示删除
        // 如果不支持 localStorage，则抛错
        local : function(appName, me,  key, val){
            if(!localStorage)
                throw "Browser don't support localStorage! "+appName+"-"+key;

            var appConf = $z.fromJson(localStorage.getItem(appName) || "{}");
            var myConf = appConf[me] || {};
            // 设置
            if(!_.isUndefined(val)){
                myConf[key] = val;
                appConf[me] = myConf;
                localStorage.setItem(appName, $z.toJson(appConf));
                return myConf;
            }
            // 删除
            else if(_.isNull(val)){
                delete myConf[key];
                appConf[me] = myConf;
                localStorage.setItem(appName, $z.toJson(appConf));
                return myConf;
            }
            // 获取
            else{
                return myConf[key];
            }
        },
        //.............................................
        // 让一段代码最后执行
        defer : function(func){
            window.setTimeout(func,0);
        },
        //.............................................
        // 获取当前文档所有被选择的文字内容
        //  - forceReturnArray true 表示强制返回数组
        // 返回一个字符串数组，表示各个 Range 所选择的内容
        getSelectedTexts : function(forceReturnArray){
            var sel = getSelection();
            var re = [];
            if(sel){
                for(var i=0; i<sel.rangeCount; i++){
                    var rag = sel.getRangeAt(i);
                    if(!rag.collapsed)
                        re.push(rag.toString());
                }
            }
            return re.length == 0 ? (forceReturnArray?re:null) : re;
        },
        //.............................................
        // 将一个字符串，根据 Javascript 的类型进行转换
        strToJsObj : function(v, type){
            // 指定了类型
            if(type){
                switch(type){
                    case 'string':
                        if(_.isString(v))
                            return v;
                        return v || null;
                    case 'number':
                        var re = v * 1; 
                        return v == re ? re : -1;
                    case 'int':
                        var re = v * 1; 
                        return v == re ? parseInt(re) : -1;
                    case 'object':
                        return this.fromJson(v);
                    case 'boolean':
                        if(_.isBoolean(v))
                            return v;
                        if(_.isUndefined(v))
                            return false;
                        return /^(true|yes|on|ok)$/.test(v);
                    default:
                        throw "strToJsObj unknown type ["+type+"] for: " + v;
                }
            }

            // 没指定类型，那么自动判断
            // 数字
            if(/^-?[\d.]+$/.test(v)){
                return v*1;
            }
            // 日期
            var regex = /^(\d{4})-(\d{2})-(\d{2})$/;
            if(regex.test(v)){
                return this.parseDate(v, regex);
            }
            // 布尔
            regex = /^ *(true|false|yes|no|on|off) *$/i;
            var m = regex.exec(v);
            if(m){
                return /^true|yes|on$/i.test(m[1]);
            }

            // 返回自身了事
            return v;
        },
        //.............................................
        // 计算尺寸
        //  -v : 要计算的尺寸值的类型可以是
        //       500   - 整数，直接返回
        //       .12   - 浮点，相当于一个百分比，可以大于 1.0
        //       "12%" - 百分比，相当于 .12
        // - base : 百分比的基数
        dimension : function(v, base) {
            if(_.isNumber(v)){
                if(parseInt(v) == v)
                    return v;
                return v * base;
            }
            // 百分比
            var m = /^([0-9]{1,3})%$/g.exec(v);
            if(m){
                return (m[1] / 100) * base;
            }
            // 靠不知道是啥
            throw  "fail to dimension : " + v;
        },
        //.............................................
        // 获取一个元素的矩形信息，包括 top,left,right,bottom,width,height,x,y
        // 其中 x,y 表示中央点
        rect : function(ele){
            var jq = $(ele);
            var rect    = jq.offset();
            rect.width  = jq.outerWidth();
            rect.height = jq.outerHeight();
            rect.right  = rect.left + rect.width;
            rect.bottom = rect.top  + rect.height;
            rect.x      = rect.left + rect.width/2;
            rect.y      = rect.top  + rect.height/2;
            return rect;
        },
        //.............................................
        // 将一个元素停靠再另外一个元素上，根据目标元素在文档的位置来自动决定最佳的停靠方案
        // @ele  - 被停靠元素
        // @ta   - 浮动元素
        // @mode - H | V 表示是停靠在水平边还是垂直边，默认 H
        dock : function(ele, ta, mode){
            var jq  = $(ele);
            var jTa = $(ta).css("position","fixed");
            // 得到浮动元素大小
            var sub = {
                width  : jTa.outerWidth(true),
                height : jTa.outerHeight(true)
            };
            // 得到菜单项目的矩形信息
            var rect = $z.rect(jq);
            //console.log(" rect  :", rect);
            // 计算页面的中点
            var viewport = $z.winsz();
            //console.log("viewport:", viewport);
            /*
            看看这个位置在页面的那个区域
            +---+---+
            | A | B |
            +---+---+
            | C | D |
            +---+---+
            */
            var off;
            // 停靠在左右边
            if("V" == mode){
                // A : 右上角对齐
                if(viewport.x>=rect.x && viewport.y>=rect.y){
                    off = {
                        "left" : rect.right,
                        "top"  : rect.top
                    };
                }
                // B : 左上角对齐
                else if(viewport.x<=rect.x && viewport.y>=rect.y){
                    off = {
                        "left" : rect.left   - sub.width,
                        "top"  : rect.top
                    };
                }
                // C : 右下角对齐
                else if(viewport.x>=rect.x && viewport.y<=rect.y){
                    off = {
                        "left" : rect.right,
                        "top"  : rect.bottom - sub.height
                    };
                }
                // D : 左下角对齐
                else {
                    off = {
                        "left" : rect.left   - sub.width,
                        "top"  : rect.bottom - sub.height
                    };
                }
            }
            // 停靠在上下边
            /*
            +---+---+
            | A | B |
            +---+---+
            | C | D |
            +---+---+
            */
            else{
                // A : 左下角对齐
                if(viewport.x>=rect.x && viewport.y>=rect.y){
                    off = {
                        "left" : rect.left,
                        "top"  : rect.bottom
                    };
                }
                // B : 右下角对齐
                else if(viewport.x<=rect.x && viewport.y>=rect.y){
                    off = {
                        "left" : rect.right - sub.width,
                        "top"  : rect.bottom
                    };
                }
                // C : 左上角对齐
                else if(viewport.x>=rect.x && viewport.y<=rect.y){
                    off = {
                        "left" : rect.left,
                        "top"  : rect.top - sub.height
                    };
                }
                // D : 右上角对齐
                else {
                    off = {
                        "left" : rect.right   - sub.width,
                        "top"  : rect.top - sub.height
                    };
                }
            }
            // 调整上下边缘
            if(off.top < viewport.top){
                off.top = viewport.top;
            }else if(off.bottom > viewport.bottom){
                off.top = viewport.bottom - sub.height;
            }
            // 设置属性
            jTa.css(off);
        },
        //.............................................
        // 获得视口的矩形信息
        winsz: function () {
            var rect;
            if (window.innerWidth) {
                rect = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
            }
            else if (document.documentElement) {
                rect = {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                };
            }
            else {
                rect = {
                    width: document.body.clientWidth,
                    height: document.body.clientHeight
                };
            };
            // 继续计算相对于文档的位置
            var jBody = $(document.body);
            rect.top  = jBody.scrollTop();
            rect.left = jBody.scrollLeft();
            rect.right  = rect.left + rect.width;
            rect.bottom = rect.top  + rect.height;
            rect.x      = rect.left + rect.width/2;
            rect.y      = rect.top  + rect.height/2;
            return rect;
        },
        //.............................................
        // 得到一个元素的外边距
        margin: function($ele){
            return {
                x : $ele.outerWidth(true) - $ele.outerWidth(),
                y : $ele.outerHeight(true) - $ele.outerHeight()
            };
        },
        //.............................................
        // 得到一个元素的内边距(包括 border)
        padding: function($ele){
            return {
                x : $ele.outerWidth() - $ele.width(),
                y : $ele.outerHeight() - $ele.height()
            };
        },
        //.............................................
        // 获得当前系统当前浏览器中滚动条的宽度
        // TODO 代码实现的太恶心，要重构!
        scrollBarWidth: function () {
            if (!window.SCROLL_BAR_WIDTH) {
                var newDivOut = "<div id='div_out' style='position:relative;width:100px;height:100px;overflow-y:scroll;overflow-x:scroll'></div>";
                var newDivIn = "<div id='div_in' style='position:absolute;width:100%;height:100%;'></div>";
                var scrollWidth = 0;
                $('body').append(newDivOut);
                $('#div_out').append(newDivIn);
                var divOutS = $('#div_out');
                var divInS = $('#div_in');
                scrollWidth = divOutS.width() - divInS.width();
                $('#div_out').remove();
                $('#div_in').remove();
                window.SCROLL_BAR_WIDTH = scrollWidth;
            }
            return window.SCROLL_BAR_WIDTH;
        },
        //.............................................
        // 从数组里获取值
        //   arr   : 数组
        //   index : 下标
        //   dft   : 如果下标越界，返回的东东
        getItem : function(arr, index, dft){
            // 从后面取重新计算一下下标
            if(index < 0) {
                index = arr.length + index;
            }
            if(index<0 || index>=arr.length)
                return dft;
            return arr[index];
        },
        //.............................................
        // 从普通对象里获取值
        // 根据键获取某对象的值，如果键是  "." 分隔的，则依次一层层进入对象获取值
        //   obj : 对象
        //   key : 键值，支持 "."
        //   dft : 如果木找到，返回的东东
        getValue : function(obj, key, dft){
            var ks = _.isArray(key)
                        ? key
                        : _.isString(key) 
                            ? key.split(".")
                            : [""+key];
            var o = obj;
            if(ks.length>1){
                var lastIndex = ks.length - 1;
                for (var i = 0; i < lastIndex; i++) {
                    key = ks[i];
                    o = o[key];
                    if(!o){
                        return dft;
                    }
                }
                key = ks[lastIndex];;
            }
            var re = o[key];
            return _.isUndefined(re) ? dft : re;
        },
        //.............................................
        // 向普通对象里设置值
        // 根据键获取某对象的值，如果键是  "." 分隔的，则依次一层层进入对象设值
        //   obj : 对象
        //   key : 键值，支持 "."
        //   val : 值
        setValue : function(obj, key, val){         
            var ks = _.isArray(key)
                        ? key
                        : _.isString(key) 
                            ? key.split(".")
                            : [""+key];
            var o = obj;
            if(ks.length>1){
                var lastIndex = ks.length - 1;
                for (var i = 0; i < lastIndex; i++) {
                    key = ks[i];
                    o = o[key];
                    if(!o){
                        o = {};
                        obj[key] = o;
                    }
                }
                key = ks[lastIndex];;
            }
            o[key] = val;
        },
        //.............................................
        // 向普通对象里添加值
        // 如果已经有值了，则变成 array，就是处理后，值一定是一个数组
        //   obj : 对象
        //   key : 键值，支持 "."
        //   val : 值
        pushValue : function(obj, key, val){
            var ks = _.isArray(key)? key : key.split(".");
            var o = obj;
            if(ks.length>1){
                var lastIndex = ks.length - 1;
                for (var i = 0; i < lastIndex; i++) {
                    key = ks[i];
                    o = o[key];
                    if(!o){
                        o = {};
                        obj[key] = o;
                    }
                }
                key = ks[lastIndex];;
            }

            var arr = o[key];
            if(_.isUndefined(arr)){
                arr = [];
                o[key] = arr;
            }
            else if(!_.isArray(arr)){
                o[key] = [arr];
                arr = o[key];
            }
            arr.push(val);
        },
        //.............................................
        // 执行一个 HTML5 的文件上传操作，函数接受一个配置对象：
        //
        // {
        //     file : {..},     // 要上传的文件对象
        //     // 上传的进度回调，即接受 XMLHttpRequest 的 "progress" 事件监听函数
        //     progress : function(e){
        //         // 比较有用的是 e.loaded 和 e.total
        //     },
        //     // 下面的回调函数会在上传完成后，根据条件不同分别被调用
        //     beforeSend : function(xhr){..},      // 执行 xhr.send() 前调用
        //     done : function(re){..},             // 上传成功后调用
        //     fail : function(re){..},             // 上传失败后被调用
        //     complete : function(re, status){..}, // 无论成功还是失败都会被调用
        //     // 服务器返回后，可以通过下面的函数预先处理一下返回
        //     // 如果没有声明这个参数，则返回原生的 xhr 对象
        //     // 如果是值 "ajax"，则用 Nutz 标准的  AjaxReturn 来处理返回值
        //     evalReturn : function(xhr){return {
        //          re     : {..},         // 会被当做参数传入 done|faile|complete
        //          status : "done|fail"   // 表示成功还是失败
        //     }},
        //     // 下面是上传到服务器的目标设置
        //     // 上传的目标url是一个字符串模板，会用本对象自身的键值来填充
        //     url  : "/o/upload/?nm=<%=file.name%>&sz=<%=file.size%>"
        // }
        uploadFile: function (opt) {
            // 没必要上传
            if (!opt.file)
                throw "!!! without field : 'file' ";
            // 开始上传
            var xhr = new XMLHttpRequest();
            // 检查
            if (!xhr.upload) {
                throw "XMLHttpRequest object don't support upload for your browser!!!";
            }
            // 用 ajax 方式处理返回值
            if ("ajax" == opt.evalReturn) {
                opt.evalReturn = function (xhr) {
                    // 如果是 200 那么具体看 AjaxReturn 的内容
                    if (xhr.status == 200) {
                        var ajaxRe = $z.fromJson(xhr.responseText);
                        if (ajaxRe.ok)
                            return {re: ajaxRe.data, status: "done"};
                        return {re: ajaxRe, status: "fail"};
                    }
                    // 否则一定是错误
                    return {re: xhr, status: "fail"};
                };
            }
            // 默认的处理方式
            else if (!(typeof opt.evalReturn == "function")) {
                opt.evalReturn = function (xhr) {
                    return {re: xhr, status: xhr.status == 200 ? "done" : "fail"};
                };
            }
            // 进度回调
            if (typeof opt.progress == "function")
                xhr.upload.addEventListener("progress", opt.progress, false);
            // 完成的处理
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState == 4) {
                    var r = opt.evalReturn(xhr);
                    $z.invoke(opt, r.status, [r.re]);
                    // 统一处理完成
                    $z.invoke(opt, "complete", [r.re, r.status]);
                }
            };
            // 准备请求对象头部信息
            var url = (_.template(opt.url))(opt);
            //console.log("upload to:", url);
            xhr.open("POST", url, true);
            xhr.setRequestHeader('Content-type', "application/x-www-form-urlencoded; charset=utf-8");
            // 修改提示图标的标签
            $z.invoke(opt, "beforeSend", [xhr]);
            // 执行上传
            xhr.send(opt.file);
        },
        // 对于 AJAX 请求的返回对象，进行检查，如果发现是过期 session 报的错，直接踢回登录页面
        checkSessionNoExists : function(re, loginUrl){
            if(re && !re.ok && "e.se.noexists" == re.errCode){
                window.location = loginUrl || "/";
            }
        },
        // 应用加载的静态资源
        _app_rs : {},
        // 读取静态资源并且缓存
        // 资源描述符如果不可识别将原样返回，现在支持下列资源种类
        //  - json:///path/to/json
        //  - text:///path/to/text
        //  - jso:///path/to/jpeg_or_jpg
        loadResource : function(rs, callback, context){
            var ME = this;
            if(_.isString(rs)){
                // 看看缓冲里有木有
                context  = context || this;
                var reObj = ME._app_rs[rs];
                // 缓冲里有，那么就不用请求
                if(reObj){
                    return ME.doCallback(callback, [ME.extend({},reObj)], context);
                }

                // 看来要发起个请求喔
                var m = /^(jso|json|text):\/\/(.+)$/.exec(rs);
                if(m){
                    var type = m[1];
                    var url  = m[2];
                    var async = _.isFunction(callback);
                    // console.log("async:", async)
                    var ajaxConf = {
                        method  : "GET",
                        async   : async,
                        data    : {
                            auto_unwrap : /^json?$/.test(type)
                        },
                        dataType : "text",
                        success  : function(re){
                            //console.log("success:", re);
                            // 根据特定的类型处理数据
                            if("json" == type){
                                reObj = $z.fromJson(re);
                            }
                            else if("jso" == type){
                                reObj = eval('(' + re + ')');
                            }
                            else{
                                reObj = re;
                            }

                            // 判断是否是过期
                            ME.checkSessionNoExists(reObj);

                            // 解开所有嵌套资源
                            reObj = ME.unwrapObjResource(reObj);
                            
                            // 计入缓存
                            ME._app_rs[rs] = reObj;
                            // 调用回调
                            if(_.isFunction(callback)){
                                callback.call(context, ME.extend({},reObj));
                            }
                        },
                        error : function(re, reason){
                            alert("fail to load resource: " + rs + " : because " + reason);
                        }
                    };
                    // 发送请求
                    $.ajax(url, ajaxConf);

                    // 返回
                    return reObj;
                }
            }
            return ME.doCallback(callback, [rs], context);
        },
        // 深层检查一个对象，如果有字段引用了资源，则解析它
        unwrapObjResource : function(obj){
            var ME = this;
            // 数组
            if(_.isArray(obj)){
                for(var i =0; i<obj.length; i++){
                    obj[i] = ME.unwrapObjResource(obj[i]);
                }
            }
            // 对象
            else if(ME.isPlainObj(obj)){
                for(var key in obj){
                    var v = obj[key];
                    // 字符串
                    if(_.isString(v)){
                        if(/^(jso|json|text):\/\/(.+)$/.test(v)){
                            var rs = ME.loadResource(v, null);
                            obj[key] = rs;
                        }
                    }
                    // 其他统统来一下
                    else{
                        obj[key] = ME.unwrapObjResource(v);
                    }
                }
            }
            // 返回自身
            return obj;
        },
        // 深层遍历一个给定的 Object，如果对象的字段有类似 "function(...}" 的字符串，将其变成函数对象 
        evalFunctionField : function(obj, memo){
            if(!memo)
                memo = [];
            for(var key in obj){
                var v = obj[key];
                // 字符串
                if(_.isString(v)){
                    // 函数
                    if(/^[ \t]*function[ \t]*\(.+\}[ \t]*/.test(v)){
                        obj[key] = eval('(' + v + ')');
                    }
                }
                // 数组针对每个对象都来一下
                else if(_.isArray(v)){
                    v.forEach(function(ele){
                        $z.evalFunctionField(ele, memo);
                    });
                }
                // 如果是对象，但是应该无视
                else if(v instanceof jQuery || _.isElement(v)){
                }
                // 如果是普通对象，那么递归
                else if(_.isObject(v)){
                    // 如果是特别指明 UI 调用的，变函数
                    if(window.ZUI && v.callUI && v.method){
                        var UI = window.ZUI(v.callUI);
                        var func = UI[v.method] || UI.options[v.method];
                        if(_.isFunction(func)){
                            obj[key] = func;
                        }else{
                            throw "ZUI: " + v.callUI + "." + v.method + " not a function!!!";
                        }
                    }
                    // 否则递归
                    else if(memo.indexOf(v)==-1){
                        memo.push(v);
                        $z.evalFunctionField(v, memo);
                    }
                }
            }
            return obj;
        },
        /*
        获取数据的方法，它的值可能性比较多:
        - 数组为静态数据，每个数据都必须是你希望的对象，那么这个数据会被直接使用
            [..]
        - 异步获取数据: 函数
          那么你的函数必须接收一个回调，当你处理完数据，调用这个回调，把你获得数组传回来
            function(callback){
                // TODO 不管怎样，获得一个对象数组
                // 假设你的对象数组是 objList，那么你必须这样调用回调
                callback(objList);
            }
        - 异步获取数据: ajaxReturn 或者是简单的 JSON 数组
          假设你给的 URL 的返回，根据鸭子法则(ok,data) 来判断是否是 AjaxReturn
          还是普通的 JSON 对象(数组)
            {
                url    : "/path/to/url",  // 请求的地址
                data   : {..},            // 请求的参数
                method : "GET"            // 请求方法，默认为 GET
                // 总之就是一个 jQuery 的 ajax 对象，但是 sucess 和 error 被定制了
            }
        */
        // data     - 待评估的数据源
        // params   - 【选】输入的参数,根据不同种类的数据源，会有不同的处理，
        //             不想输入参数，请输入 null
        // callback - 解析完数据调用的回调
        // context  - 指明特殊的回调的 this 参数，如果未定义，则采用本函数的 this
        evalData : function(data, params, callback, context) {
            if(!data){
                return;
            }

            params = params || {};

            // 异步的时候，返回值一定是 undefined
            var eval_re = undefined;
            var async = true;

            // 如果回调不是函数，那么将其视为 context，同时这必定是一个同步调用
            // 那么这里会设置返回值
            if(!_.isFunction(callback)){
                context = context || callback;
                async = false;
                callback = function(objs){
                    eval_re = objs;
                };
            }

            // 确保有 context
            context = context || this;
            // 数组
            if(_.isArray(data)){
                callback.apply(context, [data]);
            }
            // 函数
            else if(_.isFunction(data)){
                data.call(context, params, function(objs){
                    callback.apply(context, [objs]);
                });
            }
            // 字符串，试图看看 context 里有没有 exec 方法
            else if(_.isString(data)){
                var str  = (_.template(data))(params);
                //console.log(">> exec: ", str)
                var execFunc = context.exec || (context.options||{}).exec;
                if(_.isFunction(execFunc)){
                    execFunc.call(context, str, {
                        async    : async,
                        dataType    : "json",
                        processData : true,
                        complete : function(re){
                            callback.apply(context, [re]);
                        }
                    });
                }else{
                    throw "context DO NOT support exec : " + context;
                }
            }
            // 执行 ajax 请求
            else if(data.url){
                $.ajax(_.extend({
                    method   : "GET",
                    data     : params,
                    dataType : "json",
                    async    : async,
                    sucess   : function(re){
                        if(_.isBoolean(re.ok) && re.data){
                            callback.apply(context, [re.data]);
                        }else{
                            callback.apply(context, re);
                        }
                    },
                    error : function(xhr, textStatus, e){
                        alert("OMG wnApi.evalData: " + textStatus + " : " + e);
                    }
                }, data));
            }
            // 厄，弱弱的直接返回一下吧
            else if(callback){
                callback.apply(context, [data]);
            }
            // 返回
            return eval_re;
        },
        //.............................................
        // 解析日期字符串为一个日期对象
        /*
         - str : 日期字符串，当然你也可以传一个绝对毫秒数或者另外一个日期对象
         - regex :  如果参数是字符串，会用这个正则式来解析，
                    匹配的组 1,2,3,4,5,6 分别年月日，时分秒
                    你可以匹配到 3，也可以匹配到 5 还可以说匹配到 6
        @return 标准的 Date 对象
        */
        parseDate : function(str,  regex){
            // 日期对象
            if(_.isDate(str)){
                return new Date(str);
            }
            // 数字则表示绝对毫秒数
            if(_.isNumber(str)){
                d = new Date();
                d.setTime(str);
                return d;
            }
            // 否则当做字符串
            var REG;
            // 自动根据长度判断应该选取的表达式
            if(!regex){
                REG = /^(\d{4})-(\d{1,2})-(\d{1,2})([T ](\d{1,2})(:(\d{1,2}))?(:(\d{1,2}))?)?$/;
            }
            // 构建个新正则
            else{
                REG = new RegExp(regex);
            }

            // 执行匹配 
            var re = REG.exec(str);
            
            // 分析结果，将会成为一个数组比如 [2015,9,24,12,23,11]
            // 数组元素至少要到 3 个才有效
            var m = null;
            if(re){
                m = [];
                for(var i=0;i<re.length;i++){
                    var s = re[i];
                    if(/^\d{1,4}$/.test(s)){
                        m.push(parseInt(s));
                    }
                }
            }

            // 格式正确
            if(m && m.length>=3){
                var d;
                // 仅仅是日期
                if(m.length == 3){
                    d = new Date(m[0], m[1]-1, m[2]);
                }
                // 精确到分
                else if(m.length == 5){
                    d = new Date(m[0], m[1]-1, m[2], m[3], m[4]);
                }
                // 精确到秒
                else if(m.length > 5){
                    d = new Date(m[0], m[1]-1, m[2], m[3], m[4], m[5]);
                }
                return d;
            }
            throw "invalid date '" + str + "' can not match : " + regex;
        },
        //.............................................
        // 解析日期字符串为一个日期对象
        /*
         - str : 日期字符串，当然你也可以传一个当天绝对秒数或者一个日期对象
         - regex :  如果参数是字符串，会用这个正则式来解析，
                    匹配的组 1,2,3,4,5,6 分别年月日，时分秒
                    你可以匹配到 3，也可以匹配到 5 还可以说匹配到 6
        @return {
            HH : 23,
            mm : 09,
            ss : 45
        }
        */
        parseTime : function(str,  regex){
            // 本身就是时间对象
            if(str.key_min && str.key && str.HH && str.mm && str.ss){
                return str;
            }

            // 会解析成这个时间对象
            var _t = {};
            // 日期对象
            if(_.isDate(str)){
                _t.H = str.getHours();
                _t.m = str.getMinutes();
                _t.s = str.getSeconds();
            }
            // 数字则表示绝对秒数
            if(_.isNumber(str)){
                var n = parseInt(str);
                _t.H = parseInt(n / 3600);
                n -= _t.H * 3600;
                _t.m = parseInt(n / 60);
                _t.s = n - _t.m * 60;
            }
            // 否则当做字符串
            else{
                var REG;
                // 自动根据长度判断应该选取的表达式
                if(!regex){
                    REG = /^(\d{1,2})(:(\d{1,2}))?(:(\d{1,2}))?$/;
                }
                // 构建个新正则
                else{
                    REG = new RegExp(regex);
                }

                // 执行匹配 
                var re = REG.exec(str);
                
                // 分析结果，将会成为一个数组比如 [2015,9,24,12,23,11]
                // 数组元素至少要到 3 个才有效
                var m = null;
                if(re){
                    m = [];
                    for(var i=0;i<re.length;i++){
                        var s = re[i];
                        if(/^\d{1,2}$/.test(s)){
                            m.push(parseInt(s));
                        }
                    }
                }

                // 格式正确
                if(m){
                    var d;
                    // 仅仅是到分
                    if(m.length == 2){
                        _t.H = m[0];
                        _t.m = m[1];
                        _t.s = 0;
                    }
                    // 精确到秒
                    else if(m.length > 2){
                        _t.H = m[0];
                        _t.m = m[1];
                        _t.s = m[2];
                    }
                }
                // 未通过校验，抛错
                else{
                    throw "invalid time '" + v + "' can not match : " + regex;
                }
            }
            _t.sec = _t.H * 3600 + _t.m*60 + _t.s;
            _t.HH  = (_t.H>9 ? "" : "0") + _t.H;
            _t.mm  = (_t.m>9 ? "" : "0") + _t.m;
            _t.ss  = (_t.s>9 ? "" : "0") + _t.s;
            _t.key_min = _t.HH+":"+_t.mm;
            _t.key     = _t.key_min+":"+_t.ss;
            // 返回
            return _t;
        },
        //.............................................
        // 设置一个 input 的值，如果值与 placeholder 相同，则清除值
        setInputVal: function (jInput, val) {
            var dft = jInput.attr("placeholder");
            if (dft == val)
                jInput.val("");
            else
                jInput.val(val);
        },
        //.............................................
        // 获得页面的锚值，即在 href 后面的
        pageAnchor: function () {
            var href = window.location.href;
            var pos = href.lastIndexOf("#");
            if (pos > 0)
                return href.substring(pos + 1);
            return null;
        },
        //.............................................
        // 得到函数体的代码
        getFuncBodyAsStr: function (func) {
            var str = func.toString();
            var posL = str.indexOf("{");
            var re = $.trim(str.substring(posL + 1, str.length - 1));
            // Safari 会自己加一个语句结尾，靠
            if (re[re.length - 1] == ";")
                return re.substring(0, re.length - 1);
            return re;
        },
        //.............................................
        // 如果一个对象某字段是 undefined，那么为其赋值
        setUndefined : function(obj, key, val){
            if(_.isUndefined(obj[key]))
                obj[key] = val;
        },
        //.............................................
        jq : function(jP, arg, selector){
            // 没有参数，那么全部 children 都会被选中
            if(_.isUndefined(arg)){
                return jP.children();
            }
            // DOM 元素
            if(arg instanceof jQuery || _.isElement(arg)){
                return $(arg);
            }
            // 数字 
            if(_.isNumber(arg)){
                if(selector)
                    return jP.find(selector).eq(arg);
                return jP.children().eq(arg);
            }
            // selector
            if(_.isString(arg)){
                return jP.find(arg);
            }
            // 查找匹配对象 
            if(_.isObject(arg)){
                return jP.find(selector).filter(function(){
                    var o = $(this).data("OBJ");
                    return _.isMatch(o, arg);
                });
            }
            // 靠，神马玩意
            throw "Fuck! unknown arg : " + arg;
        },
        //............................................
        // 对一个字符串进行转换，相当于 $(..).text(str) 的效果
        __escape_ele : $(document.createElement("b")),
        escapeText : function(str){
            return __escape_ele.text(str).text();
        },
        //.............................................
        // 调用某对象的方法，如果方法不存在或者不是函数，无视
        invoke: function (obj, funcName, args, me) {
            if (obj) {
                var func = obj[funcName];
                if (typeof func == 'function') {
                    return func.apply(me || obj, args || []);
                }
            }
        },
        //.............................................
        // 声明模块，回调必须返回这个模块本身
        // deps 是依赖的模块数组
        // 函数会自动根据 CMD / AMD 等约定自行选择怎么定义模块
        declare : function(deps, callback){
            if (typeof define === "function" && define.cmd) {
                if(_.isString(deps)){
                    deps = [deps];
                }
                define(deps, function(require){
                    var args = [];
                    require.async(deps, function(){
                        for(var i=0; i<arguments.length; i++){
                            args.push(arguments[i]);
                        }
                    });
                    return callback.apply(this, args);
                });
            }
            else{
                throw "Fuck!!!!"
            }
        },
        //.............................................
        // 打开一个新的窗口
        openUrl: function (url, target, method, params) {
            var html = '<form target="' + (target || '_blank') + '" method="'+(method||"GET")+'"';
            html += ' action="' + url + '" style="display:none;">';
            html += '</form>';
            var jq = $(html).appendTo(document.body);
            if(params)
                for(var key in params){
                    $('<input type="hidden">').appendTo(jq)
                        .prop("name", key)
                        .val(params[key]);
                }
            jq[0].submit();
            jq.remove();
        },
        // 模拟POST提交
        postForm: function (url, data) {
            var html = '';
            html += '<form action="' + url + '" method="POST" style="display:none;">';
            for (var nm in data) {
                html += '<input type="text" name="' + nm + '" value="' + data[nm] + '">';
            }
            html += '</form>';
            var jq = $(html).appendTo(document.body);
            jq[0].submit();
            jq.remove();
        },
        //.............................................
        // 返回一个时间戳，其它应用可以用来阻止浏览器缓存
        timestamp: function () {
            return new Date().getTime();
        },
        //.............................................
        // 生成一个随机字符串
        randomString: function (length) {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
            if (!length) {
                length = Math.floor(Math.random() * chars.length);
            }
            var str = '';
            for (var i = 0; i < length; i++) {
                str += chars[Math.floor(Math.random() * chars.length)];
            }
            return str;
        },
        //.............................................
        // 将一个对象的原型，链接到指定的父对象上
        // 这个函数很暴力的，直接修改对象的 __proto__，对于只读的对象
        // 用这个函数应该别 extend 要快点
        // 函数返回 obj 本身
        inherit: function(obj, parent){
            obj.__proto__ = parent;
            return obj;
        },
        //.............................................
        // 扩展第一个对象，深层的，如果遇到重名的对象，则递归
        // 调用方法 $z.extend(a,b,c..)
        extend: function () {
            var a = arguments[0];
            var memo = [];
            for(var i=1;i<arguments.length;i++){
                var b = arguments[i];
                if(this.isPlainObj(b)){
                    for (var key in b) {
                        a[key] = this.clone(b[key]);
                    }
                }
            }
            return a;
            // 否则不能接受
            //throw "can not extend a:" + a + " by b:" + b;
        },
        //.............................................
        // 为一个对象制作一个深层的副本
        clone: function(obj){
            // 常规的对象，直接返回
            if(_.isNull(obj) || _.isUndefined(obj) || _.isNumber(obj) || _.isString(obj)){
                return obj;
            }
            // 数组
            if(_.isArray(obj)){
                var re = [];
                for(var i=0;i<obj.length;i++){
                    re.push(this.clone(obj[i]));
                }
                return re;
            }
            // jQuery 或者 Elemet
            if(this.isjQuery(obj) || _.isElement(obj)){
                return $(obj).clone();
            }
            // 函数
            if(_.isFunction(obj)){
                return obj;
            }
            // 日期对象
            if(_.isDate(obj)){
                return new Date(obj);
            }
            // 正则表达式 
            if(_.isRegExp(obj)){
                return new RegExp(obj);
            }
            // 普通对象
            return this.extend({}, obj);
        },
        isjQuery : function(obj){
            return obj instanceof jQuery;
        },
        //.............................................
        // 判断一个对象是否是简单的 POJO
        isPlainObj : function(obj){
            if(_.isUndefined(obj))
                return false;
            if(_.isFunction(obj))
                return false;
            if(_.isNull(obj))
                return false;
            if(_.isDate(obj))
                return false;
            if(_.isRegExp(obj))
                return false;
            if(_.isArray(obj))
                return false;
            if(_.isElement(obj))
                return false;
            if(this.isjQuery(obj))
                return false;
            return _.isObject(obj);
        },
        //---------------------------------------------------------------------------------------
        /**
         * jq - 要闪烁的对象
         * opt.after - 当移除完成后的操作
         * opt.html - 占位符的 HTML，默认是 DIV.z_blink_light
         * opt.speed - 闪烁的速度，默认为  500
         */
        blinkIt: function(jq, opt) {
            // 格式化参数
            jq = $(jq);
            opt = opt || {};
            if (typeof opt == "function") {
                opt = {
                    after: opt
                };
            } else if (typeof opt == "number") {
                opt = {
                    speed: opt
                };
            }
            // 得到文档中的
            var off = jq.offset();
            // 样式
            var css = {
                "width": jq.outerWidth(),
                "height": jq.outerHeight(),
                "border-color": "#FF0",
                "background": "#FFA",
                "opacity": 0.8,
                "position": "fixed",
                "top": off.top,
                "left": off.left,
                "z-index": 9999999
            };
            // 建立闪烁层
            var lg = $(opt.html || '<div class="z_blink_light">&nbsp;</div>');
            lg.css(css).appendTo(document.body);
            lg.animate({
                opacity: 0.1
            }, opt.speed || 500, function() {
                $(this).remove();
                if (typeof opt.after == "function") opt.after.apply(jq);
            });
        },
         //---------------------------------------------------------------------------------------
        /**
         * jq - 要移除的对象
         * opt.after - 当移除完成后的操作, this 为 jq 对象
         * opt.holder - 占位符的 HTML，默认是 DIV.z_remove_holder
         * opt.speed - 移除的速度，默认为  300
         * opt.appendTo - (优先)一个目标，如果声明，则不会 remove jq，而是 append 到这个地方
         * opt.prependTo - 一个目标，如果声明，则不会 remove jq，而是 preppend 到这个地方
         */
        removeIt: function(jq, opt) {
            // 格式化参数
            jq = $(jq);
            opt = opt || {};
            if (typeof opt == "function") {
                opt = {
                    after: opt
                };
            } else if (typeof opt == "number") {
                opt = {
                    speed: opt
                };
            }
            // 计算尺寸
            var w = jq.outerWidth(true);
            var h = jq.outerHeight(true);
            // 增加占位对象，以及移动 me
            var html = opt.holder || '<div class="z_remove_holder">&nbsp;</div>';
            var holder = $(html).css({
                "display": "inline-block",
                "vertical-align": "middle",
                "padding": 0,
                "margin": 0,
                "width": w,
                "height": h,
                "display": "inline-block"
            }).insertAfter(jq);
            // 删除元素
            if (opt.appendTo)
                jq.appendTo(opt.appendTo);
            else if(opt.prependTo)
                jq.prependTo(opt.prependTo);
            else
                jq.remove();
            // 显示动画
            holder.animate({
                width: 0,
                height: 0
            }, opt.speed || 300, function() {
                $(this).remove();
                if (typeof opt.after == "function") opt.after.apply(jq);
            });
        },
        //---------------------------------------------------------------------------------------
        /**
         * ele - 为任何可以有子元素的 DOM 或者 jq，本函数在该元素的位置绘制一个 input 框，让用户输入新值
         * opt - object | function
         * opt.multi - 是否是多行文本
         * opt.text - 初始文字，如果没有给定，采用 ele 的文本
         * opt.width - 指定宽度
         * opt.height - 指定高度
         * opt.after - function(newval, oldval){...} 修改之后，
         *   - this 为被 edit 的 DOM 元素 (jq 包裹)
         *   - 传入 newval 和 oldval
         *   - 如果不给定这个参数，则本函数会给一个默认的实现
         */
        editIt: function(ele, opt) {
            // 处理参数
            var me = $(ele);
            var opt = opt || {};
            if (typeof opt == "function") {
                opt = {
                    after: opt
                };
            } else if (typeof opt == "boolean") {
                opt = {
                    multi: true
                };
            }
            if (typeof opt.after != "function") opt.after = function(newval, oldval) {
                if (newval != oldval) this.text(newval);
            };
            // 定义处理函数
            var onKeydown = function(e) {
                // Esc
                if (27 == e.which) {
                    $(this).val($(this).attr("old-val")).blur();
                }
                // Ctrl + Enter
                else if (e.which == 13) {
                    if(window.keyboard){
                        if(window.keyboard.ctrl){
                            $(this).blur();    
                        }
                    }
                    else {
                        $(this).blur();
                    }
                }
            };
            var func = function() {
                var me = $(this);
                var opt = me.data("z-editit-opt");
                opt.after.apply(me.parent(), [me.val(), me.attr("old-val")]);
                me.remove();
            };
            // 准备显示输入框
            var val = opt.text || me.text();
            var html = opt.multi ? '<textarea></textarea>' : '<input>';

            // 计算宿主的内边距
            var padding = $z.padding(me);

            // 计算宽高
            var css = {
                "width": opt.width || me.outerWidth(),
                "height": opt.height || me.outerHeight(),
                "position": "absolute",
                "z-index": 999999,
                "margin-left" : padding.x/-2,
                "margin-top"  : padding.y/-2,
            };

            // 显示输入框
            var jq = $(html).prependTo(me)
                       .val(val)
                       .attr("old-val", val)
                       .addClass("z_editit").css(css);
            jq.data("z-editit-opt", opt);

            return jq.one("blur", func)
                     .one("change", func)
                     .on("keydown", onKeydown)
                     .on("click", function(e){e.stopPropagation();})
                     .focus();
        },
        //.............................................
        // json : function(obj, fltFunc, tab){
        //     // toJson
        //     if(typeof obj == "object"){
        //         return JSON.stringify(obj, fltFunc, tab);
        //     }
        //     // fromJson
        //     if (!obj) {
        //         return null;
        //     }
        //     return JSON.parse(obj, fltFunc);
        // },
        //.............................................
        toJson: function (obj, fltFunc, tab) {
            return JSON.stringify(obj, fltFunc, tab);
        },
        //.............................................
        fromJson: function (str, fltFunc) {
            if (!str)
                return null;
            try {
                return JSON.parse(str, fltFunc);
            } catch (e1) {
                try {
                    return eval('(' + str + ')');
                } catch (e2) {
                    throw e2 + " \n" + str;
                }
            }
        },
        //.............................................
        // 返回当前时间
        currentTime: function (date) {
            date = date || new Date();
            return zUtil.dateToYYMMDD(date) + " " + zUtil.dateToHHMMSS(date);
        },
        // 返回当前时分秒
        dateToYYMMDD: function (date, split) {
            date = date || new Date();
            split = (split == null || split == undefined) ? "-" : split;
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            return year + split + zUtil.alignRight(month, 2, '0') + split + zUtil.alignRight(day, 2, '0');
        },
        // 返回当前年月日
        dateToHHMMSS: function (date, split) {
            date = date || new Date();
            split = (split == null || split == undefined) ? "-" : split;
            var hours = date.getHours()
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            return zUtil.alignRight(hours, 2, '0') + split + zUtil.alignRight(minutes, 2, '0') + split + zUtil.alignRight(seconds, 2, '0');
        },
        // 任何东西转换为字符串
        anyToString: function (obj) {
            if (_.isUndefined(obj) || _.isNull(obj)) {
                return "";
            }
            if (_.isString(obj)) {
                return obj;
            }
            if (_.isNumber(obj)) {
                return "" + obj;
            }
            if (_.isObject(obj)) {
                return zUtil.toJson(obj);
            }
            // TODO 补全其他类型
            zUtil.noImplement();
        },
        // 补全右边
        alignLeft: function (str, length, char) {
            str = zUtil.anyToString(str);
            if (str.length >= length) {
                return str;
            }
            return str + zUtil.dupString(char, length - str.length);
        },
        // 补全左边
        alignRight: function (str, length, char) {
            str = zUtil.anyToString(str);
            if (str.length >= length) {
                return str;
            }
            return zUtil.dupString(char, length - str.length) + str;
        },
        // 重复字符
        dupString: function (char, num) {
            if (!char || num < 1) {
                return "";
            }
            var str = "";
            for (var i = 0; i < num; i++) {
                str += char;
            }
            return str;
        },
        // 显示一个元素的尺寸，调试用
        _dumpSize : function(ele){
            var jq = $(ele);
            console.log("height:", jq.height() ," out:", jq.outerHeight(), " inner:", jq.innerHeight());
            console.log("width:", jq.width() ," out:", jq.outerWidth(), " inner:", jq.innerWidth());
        },
        // 未实现
        noImplement: function () {
            throw new Error("Not implement yet!");
        },
        // 将字符串拆分，并无视空字符串
        splitIgnoreEmpty: function (str, separator) {
            var ss = str.split(separator);
            var re = [];
            for (var i = 0; i < ss.length; i++) {
                var s = ss[i];
                if (s)
                    re.push(s);
            }
            return re;
        },
        //============== 计算文件大小
        sizeText: function (sz) {
            sz = parseInt(sz)||0;
            // KB
            var ckb = sz / 1024;
            if (ckb > 1024) {
                // MB
                var cmb = ckb / 1024;
                if (cmb > 1024) {
                    // GB
                    var cgb = cmb / 1024;
                    return (cgb==parseInt(cgb)?cgb:cgb.toFixed(2)) + " GB";
                }
                return (cmb==parseInt(cmb)?cmb:cmb.toFixed(2)) + " MB";
            }

            return (ckb==parseInt(ckb)?ckb:ckb.toFixed(2)) + " KB";
        },
        //.............................................
        // 如果字符串溢出，把中间的内容表示为省略号，以便显示头尾
        ellipsisCenter : function(str, len){
            if(str && str.length > len){
                var n0 = parseInt(len/2);
                var n1 = str.length - (len - n0);
                return str.substring(0,n0) + "..." + str.substring(n1);
            }
            return str;
        },
        formatJson: function (obj, depth) {
            var type = typeof obj;
            // 空对象
            if (null == obj && ("object" == type || 'undefined' == type || "unknown" == type)) return 'null';
            // 字符串
            if ("string" == type) return '"' + obj.replace(/(\\|\")/g, "\\$1").replace(/\n|\r|\t/g, function () {
                    var a = arguments[0];
                    return (a == '\n') ? '\\n' : (a == '\r') ? '\\r' : (a == '\t') ? '\\t' : "";
                }) + '"';
            // 布尔
            if ("boolean" == type) return obj ? "true" : "false";
            // 数字
            if ("number" == type) return obj;
            // 是否需要格式化
            var format = false;
            if (typeof depth == "number") {
                depth++;
                format = true;
            } else if (depth == true) {
                depth = 1;
                format = true;
            } else {
                depth = false;
            }
            // 数组
            if ($.isArray(obj)) {
                var results = [];
                for (var i = 0; i < obj.length; i++) {
                    var value = obj[i];
                    results.push(zUtil.formatJson(obj[i], depth));
                }
                return '[' + results.join(', ') + ']';
            }
            // 函数
            if ('function' == type) return '"function(){...}"';
            // 普通 JS 对象
            var results = [];
            // 需要格式化
            if (format) {
                // 判断一下，如果key少于3个，就不格式化了，并且，之内的所有元素都为 boolean, string,number
                var i = 0;
                for (var key in obj) {
                    if (++i > 2) {
                        format = true;
                        break;
                    }
                    var type = typeof obj[key];
                    if (type == "object") {
                        format = true;
                        break;
                    }
                }
                // 确定要格式化
                if (format) {
                    var prefix = "\n" + zUtil.dupString(INDENT_BY, depth);
                    for (key in obj) {
                        var value = obj[key];
                        if (value !== undefined) results.push(prefix + '"' + key + '" : ' + zUtil.formatJson(value, depth));
                    }
                    return '{' + results.join(',') + '\n' + zUtil.dupString(INDENT_BY, depth - 1) + '}';
                }
            } // 紧凑格式
            for (var key in obj) {
                var value = obj[key];
                if (value !== undefined) results.push('"' + key + '":' + zUtil.formatJson(value, depth));
            }
            return '{' + results.join(',') + '}';
        }
    };

    // 感知平台
    var platform = navigator.platform.toLowerCase();
    zUtil.os = {
        mac : /^mac/.test(platform)
    };

    // log
    zUtil.logConf = {
        enable: true,               // 是否启动log输出
        trace: false,               // 是否显示调用trace
        showTime: true,             // 是否打印时间,
        showMS: true                // 是否显示毫秒
    };

    zUtil.log = function (log) {
        if (zUtil.logConf.enable) {
            var logPrefix = "";
            // 显示时间点
            if (zUtil.logConf.showTime) {
                logPrefix += '---- ';
                var date = new Date();
                logPrefix += zUtil.currentTime(date);
                if (zUtil.logConf.showMS) {
                    logPrefix += "." + date.getMilliseconds();
                }
                logPrefix += ' ----\n';
            }
            console.debug(logPrefix + log);
            if (zUtil.logConf.trace) {
                console.trace();
            }
        }
    };

    // 创建 NutzUtil 的别名
    window.NutzUtil = zUtil;
    window.$z       = zUtil;
    //===============================================================
    if (typeof define === "function" && define.cmd) {
        define("zutil", ["underscore"], function () {
            return zUtil;
        });
    }
//===================================================================
})();