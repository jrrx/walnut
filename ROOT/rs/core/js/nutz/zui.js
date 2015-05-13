/*
这里声明一个 UI 模块，这个模块就是一个工厂类，用来构建各个 UI 的实例
每一个 UI 的实例都是一个 Backbone.View 它的数据结构

```
{

    //---------------------------------------------------
    // 下面这些属性都由调用者在 new 的时候提供
    //  * 其中 `$pel` 和 `parent/gasketName` 互斥，优先级低
    //  * model 是可选的，但大多数消息驱动的 UI 都需要它
    //---------------------------------------------------
    uiName     : "ui.name"  // UI 类型名
    cid        : "v1"       // Backbone 生成的实例ID
    tagName    : "div"      // 本UI的顶级DOM节点是什么标签，默认DIV
    className  : ".."       // 顶级DOM节点的类选择器，默认采用uiName 

    $pel       : $<..>      // 本 UI 附着在哪个 DOM 节点上
    $el        : $<..>      // 本 UI 的顶级 DOM 节点是什么

    parent     : UI(..)     // 父 UI 的实例
    gasketName : ".."       // UI 所在的父元素的扩展点名称
    model      : {..}       // 本 UI 对应的 Backbone Model 是什么
    //---------------------------------------------------
    // 记录了自己的扩展点的名称，以及对应的 DOM
    // 这个属性由 parseDom 函数来生成，即 ui 的实例的 $ui.init 函数
    // 需要主动调用 parseDom 来生成下面两个属性
    //---------------------------------------------------
    gasket    : {
        "chute" : $<..> 
        "arena" : $<..>     
    },
    // 当 resize  的时候，UI 会根据 layout 指明的层级结构
    // 将对应的 DOM 节点尺寸进行对应的修改。
    // 这个属性也是由 parseDom 进行初始化的。前提是你必须在
    // $el 上声明 "layout-mode" 属性，否则这个属性会为 null
    layout     : {
        $ele : $el       // 指向顶级DOM节点
        mode : "vertical",
        children : [
            {$ele:$(DIV), val:"*"},
            {$ele:$(DIV), val:0.2},
            {$ele:$(DIV), val:132},
            {$ele:$(DIV), mode:"horizontal", val:"*", children: [
                {$ele:$(DIV), val:"*"},
                {$ele:$(DIV), val:200},
            ]},
        ]
    },
    //---------------------------------------------------
    // 存放多国语言字符串
    //---------------------------------------------------
    _msg_map : {
        ...
    }
    //---------------------------------------------------
    // 下面这些属性都由 ZUI 的工厂函数(ZUI.def)提供
    // UI 的实现者不可私自修改 !!!
    //---------------------------------------------------
    initialize  : func(){..}   // Backbone.View 的初始化函数
    destroy     : func(){..}   // UI 的释放资源函数
    watchKey    : func(){..}   // 监听快捷键
    unwatchKey  : func(){..}   // 取消监听快捷键
    listenModel : func(){..}   // 监听模块消息
    msg         : func(){..}   // 得到本地化字符串
    resize      : func(){..}   // 将自身设置为符合父选区的大小
    //---------------------------------------------------
    // 视图的渲染方法，实际上这是视图的主要渲染逻辑
    // 它最终会调用 $ui.redraw 方法完成视图的最终显示
    // 在这之前，它会根据视图的自身属性，进行代码模板等资源的加载
    // 这些加载(尤其是本地化字符串的加载)是异步的
    // 因此，调用完 render 并不能马上得到渲染的结果
    //---------------------------------------------------
    render      : func(){..}
    //---------------------------------------------------
    // Backbone.View 的事件监听
    // 所有的方法的 this 都是 ui 实例本身
    events      : {...}
    //---------------------------------------------------
    // 下面这些属性在 ZUI.def 的时候，由UI实现者提供
    // 这些构成了 UI 的主要业务逻辑
    // 所有的方法的 this 都是 ui 实例本身
    $ui         : {
        css     : "/path/to/css" | ["path1", "path2"],
        // DOM 字段可以是一个 URI，这样 ZUI 会用类加载器去向服务器请求这个资源
        // 由于 seajs 用的是 xhr，那么就会有跨域的问题，为此，这个字段
        // 也可以是一个 HTML 代码本身，只要开头和结尾都有块注释
        // 即， /* 和 * / 包裹，那么中间的内容会被 ZUI 当做你的代码模板，
        // 它就不会去加载，而是直接使用你的这段 HTML
        dom     : "/path/to/html",
        i18n    : "app/abc/i18n/{{lang}}.json",

        // 初始化函数，UI 可以在其中加载自己需要的资源
        //  @ 会被 initialize 在实例构造时调用
        init    : func(){..},

        // UI 的主要绘制逻辑
        redraw  : func(){..},

        // 释放 UI 的资源
        //  @ 会被 destroy 在实例销毁的时候调用
        depose  : func(){..},
        
        // 修改自身大小以适应选区   
        //  @ 会被 resize 在适当的时候调用
        resize  : func(){..},
    }
}
```

任何一个 UI 都可以用如下方法定义，第二个参数就是 UI 的 conf

```
var UI = ZUI.def("ui.name", {
    // Backbone.View 需要的事件映射
    events : {...},
    // ZUI 需要的特殊属性
    css     : "/path/to/css" | ["path1", "path2"],
    dom     : "/path/to/html",
    i18n : "app/abc/i18n/{{lang}}.json",
    init    : func(){..}
    redraw  : func(){..}
    depose  : func(){..}
    resize  : func(){..}
    
    // 随便你添加更多的方法和属性了
    on_xxxx : func(){..} 
    x : 2.16,
    y : 9.21
});
```

并用下面的方法生成实例

```
var ui = new UI({
    $pel       : <..> 
    parent     : UI(..)
    gasketName : ".."
    model      : {..}
    ... UI 的特殊配置 ...
});
```
*/
define(function(require, exports, module){
    //console.log("***************** define the ZUI ***********************");
    //console.log(module);
    //console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    // 采用统一的 ZUI.css
    seajs.use("zui_css");

    // 对 layout 的解析
    var parse_layout = function(li, jq){
        li.$ele = jq;
        li.val  = $.trim(jq.attr("layout-val")) || null;
        if(li.val){
            // 百分比，不能超过 100%
            if(/^[0-9]+%$/.test(li.val)){
                li.val = li.val.substring(0,li.val.length-1) * 1 / 100;
                if(li.val>1) {
                    console.log("invalid layout-val : '" + li.val*100 + "%'");
                    li.val = 1.0;
                }
            }
            // 数字表示精确像素
            else if(/^[0-9]+$/.test(li.val)){
                li.val = li.val * 1;
            }
            // 其他必须是 *
            else if("*"!=li.val){
                console.log("invalid layout-val : '" + li.val + "'");
                li.val = "*";
            }
        }else{
            li.val = "$SELF";   // 表示保留元素原始的尺寸
        }

        // 递归 ...
        var mode = $.trim(jq.attr("layout-mode"));
        if(mode){
            li.mode = mode;
            li.children = [];
            jq.children().each(function(){
                var me  = $(this);
                var sub = parse_layout({}, me);
                li.children.push(sub);
                // 所有的区块外边距必须为 0
                me.css({
                    "margin" : 0,
                    "position" : "relative"
                });
                if("horizontal" == mode){
                    me.css({
                        "top":0,
                        "position" : "absolute"
                    });
                }
                if("$SELF" == sub.val){
                    sub.val = "horizontal" == mode ? 
                                me.outerWidth()
                                 : me.outerHeight();
                }
            });
        }

        // 返回
        return li;
    };

    // 这个逻辑用来解析 UI 的 DOM， 并根据约定，预先得到 gasket 和 layout
    // 当然 layout 不是必须有的
    var parse_dom = function(html){
        var ME = this;
        // 解析代码模板
        var tmpl = _.template(html);
        html = tmpl(ME._msg_map);
        ME.$el[0].innerHTML = html;  // FIXME 这里有严重的bug, tr不能被加入到页面中

        // 分析 DOM 结构
        var map = this._code_templates;
        var jTmpl = this.$el.children('.ui-code-template').hide();
        var commonClass = jTmpl.attr("common-class");
        jTmpl.children('[code-id]').each(function(){
            var jq = $(this);
            if(commonClass && jq.attr("nocommon")!="true")
                jq.addClass(commonClass);
            var key = jq.attr('code-id');
            map[key] = jq;
        });
        ME.arena = ME.$el.children('.ui-arena');

        // 解析布局
        if(ME.arena.attr("layout-mode"))
            ME.layout = parse_layout({}, ME.arena);

        // 搜索所有的 DOM 扩展点
        ME.gasket = {};
        ME.arena.find("[ui-gasket]").each(function(){
            var nm = $.trim($(this).attr("ui-gasket"));
            ME.gasket[nm] = {
                ui : null,
                jq : $(this)
            };
        });

        // DOM 解析完成
    };

    // 在一块区域内( W * H )，为 li.children 分配宽高
    var adjust_layout = function(li, W, H) {
        if(!li.children || li.children.length<=0)
            return;
        // 要分配的值
        var max = "vertical" == li.mode ? H : W;
        var remain = max;

        // 循环分配值
        var vals = [];
        var remainIndex = [];
        for(var i=0;i<li.children.length;i++){
            var sub = li.children[i];
            if("*" == sub.val){
                vals[i] = 0;
                remainIndex.push(i);
            } else if(_.isNumber(sub.val)){
                if(sub.val<1){
                    vals[i] = parseInt(max * sub.val);
                    remain-=vals[i];
                }else{
                    vals[i] = sub.val;
                    remain-=vals[i];
                }
            } else {
                throw "invalid sub.val : " + sub.val;
            }
        }
        // 分配剩余值
        if(remainIndex.length>0){
            var n = parseInt(remain/remainIndex.length);
            var i=0;
            for(;i<remainIndex.length;i++){
                vals[remainIndex[i]] = n;
            }
            remain -= n*remainIndex.length;
            // 继续分配每个剩余的像素
            i = 0;
            while(remain>0){
                var index = remainIndex[i++];
                vals[index]++;
                remain--;
                if(i>=remainIndex.length)
                    i=0;
            }
        }

        // 垂直布局
        if("vertical" == li.mode){
            for(var i=0;i<li.children.length;i++){
                var sub = li.children[i];
                sub.area = {w:W, h:vals[i]};
                sub.$ele.css({
                    "width"  : W, 
                    "height" : vals[i]
                });
            }
        }
        // 水平布局
        else{
            var left = 0;
            for(var i=0;i<li.children.length;i++){
                var sub = li.children[i];
                sub.area = {w:vals[i], h:H};
                sub.$ele.css({
                    "left"   : left,
                    "width"  : vals[i], 
                    "height" : H
                });
                left += sub.area.w;
            }
        }

        // 处理自己的下一层
        for(var i=0;i<li.children.length;i++){
            var sub = li.children[i];
            if(sub.mode) {
                adjust_layout(sub, sub.area.w, sub.area.h);
            }
        }
    };  // end of adjust_layout

    // 输出模块 ZUI，同时全局也声明一个 ZUI 变量
    var ZUI = exports;
    window.ZUI = ZUI;
    // 定义一个 UI 的原型
    var ZUIPrototype = {
        // Backbone.View 的初始化函数
        initialize : function(options){
            var ME = this;
            // 初始化必要的内部字段
            ME._code_templates = {};  // 代码模板
            ME._watch_keys     = {};
            ME.options         = options;
            ME.parent          = options.parent;
            ME.gasketName      = options.gasketName;
            
            // 考虑将自己组合到自己的父插件
            if(ME.parent && ME.gasketName) {
                var gas = ME.parent.gasket[ME.gasketName];
                if(!gas)
                    throw "Fail to found gasket '"+ME.gasketName+"'";
                gas.ui = ME;
                ME.$pel = gas.jq;
                ME.pel  = gas.jq[0];
            }
            // 采用给定的父，如果没指定父，则直接添加到 document.body 上
            else {
                ME.$pel = options.$pel || $(document.body);
                ME.pel = ME.$pel[0];
            }
            // 加入 DOM 树
            ME.$pel.append(ME.$el);

            // 记录自身实例
            ME.$el.attr("ui-id", ME.cid);
            ZUI.instances[ME.cid] = ME;
            if(document.body == ME.pel){
                window.ZUI.tops.push(ME);
            }

            // 调用子类自定义的 init
            if(typeof ME.$ui.init == 'function')
                ME.$ui.init.call(ME, options);

        },
        destroy : function(){
            // 释放掉自己所有的子
            for(var key in this.gasket){
                var sub = this.gasket[key];
                if(sub.ui)
                    sub.ui.destroy();
            }
            // 移除自己的监听事件
            for(var key in this._watch_keys){
                delete ZUI.keymap[key];
            }
            // 释放掉自己
            $z.invoke(this.$ui, "depose", [], this);

            // 删除自己的 DOM 节点
            this.$el.remove();
            // 移除注册
            delete ZUI.instances[this.cid];
            // 删除顶级节点记录
            var list = [];
            for(var i=0;i<ZUI.tops.length;i++){
                var top = ZUI.tops[i];
                if(top!=this){
                    list.push(top)
                }
            }
            ZUI.tops = list;
            
        },
        // 渲染自身
        render : function(afterRender){
            var ME = this;
            // 加载 CSS
            if(ME.$ui.css) {
                seajs.use(ME.$ui.css);
            }
            // 看看是否需要异步加载多国语言字符串
            var callback = function(mm){
                // 存储多国语言字符串
                ME._msg_map = $z.extend(_.extend({}, ZUI.g_msg_map), mm || {});
                // 定义后续处理
                var do_render = function(){
                    $z.invoke(ME.$ui, "redraw", [], ME);
                    ME.resize();
                    if(typeof afterRender === "function") {
                        afterRender.call(ME);
                    }
                };
                // 看看是否需要解析 DOM
                if(ME.$ui.dom) {
                    // DOM 片段本身就是一段 HTML 代码 
                    if(/^\/\*.+\*\/$/m.test(ME.$ui.dom.replace(/\n/g,""))){
                        parse_dom.call(ME, ME.$ui.dom.substring(2, ME.$ui.dom.length-2));
                        do_render();
                    }
                    // DOM 片段存放在另外一个地址
                    else{
                        require.async(ME.$ui.dom, function(html){
                            parse_dom.call(ME, html);
                            do_render();
                        });
                    }
                }
                // 否则直接渲染
                else{
                    do_render();
                }
            };
            if(ME.$ui.i18n){
                ME.$ui.i18n = _.template(ME.$ui.i18n)({lang : window.$zui_i18n || "zh-cn"});
                require.async(ME.$ui.i18n, callback);
            }else{
                callback({});
            }
        },
        // 修改 UI 的大小
        resize : function() {
            var ME = this;
            //console.log("_do_resize_ui")
            // 调整自身的顶级元素
            // var w = ME.$pel.width();
            // var h = ME.$pel.height();
            // ME.$el.css({"width":w, "height":h});

            // var w2 = ME.$el.width();
            // var h2 = ME.$el.height();
            // ME.arena.css({"width":w2, "height":h2});

            // // 根据布局，调整
            // if(ME.layout) {
            //     adjust_layout(ME.layout, w2, h2);
            // }

            // 调用自身的 resize
            $z.invoke(ME.$ui, "resize", [], ME);

            // 调用自身所有的子 UI 的 resize
            for(var key in ME.gasket){
                var sub = ME.gasket[key];
                if(sub && sub.ui){
                    sub.ui.resize();
                }
            }
        },
        // 监听一个事件
        // ui.watchKey(27, "ctrl", func(){..})
        // ui.watchKey(27, ["ctrl","meta"], func(){..})
        // ui.watchKey(27, func(){..})
        watchKey : function(which, keys, handler){
            var key;
            // 没有特殊 key
            if(typeof keys == "function"){
                handler = keys;
                key = "" + which;
            }
            // 组合的特殊键
            else if(_.isArray(key)){
                key = keys.sort().join("+") + "+" + which;
            }
            // 字符串特殊键
            else{
                key = keys + "+" + which;
            }
            console.log("watchKey : '" + key + "' : " + this.cid);
            var wk = ZUI.keymap[key];
            // 为当前插件创建映射
            if(wk) {
                throw "conflict watchKey : " + which + '(' + key + ') : ' + wk.cid + " <-> " + this.cid;
            }
            // 加入UI全局记录
            ZUI.keymap[key] = {
                cid     : this.cid,
                handler : handler
            }
            // 记录到自身
            this._watch_keys[key] = true;
        },
        // 取消监听一个事件
        // ui.unwatchKey(27, "ctrl"})
        // ui.unwatchKey(27, ["ctrl","meta"])
        // ui.unwatchKey(27)
        unwatchKey : function(which, keys){
            var key;
            // 组合的key
            if(_.isArray(key)){
                key = keys.sort().join("+") + "+" + which;
            }
            // 字符串
            else if(keys){
                key = keys + "+" + which;
            }
            // 没有特殊键
            else{
                key = "" + which;
            }
            console.log("unwatchKey : '" + key + "' : " + this.cid);
            // 删除全局索引
            if(ZUI.keymap[key])
                delete ZUI.keymap[key][which];

            // 删除自身的快速索引
            if(this._watch_keys[key])
                delete this._watch_keys[key];
        },
        // 得到多国语言字符串
        msg : function(key) {
            return this._msg_map[key] || key;
        },
        // 监听模块事件
        listenModel : function(event, handler){
            if(this.model)
                this.listenTo(this.model, event, handler);
        },
        // 返回一个对应的 DOM 节点的克隆
        ccode : function(codeId) {
            var jq = this._code_templates[codeId];
            if(jq)
                return jq.clone();
            throw "Can not found code-template '" + codeId + "'";
        },
        //...................................................................
        // 提供一个通用的文件上传界面，任何 UI 可以通过
        //   this.listenModel("do:upload", this.on_do_upload); 
        // 来启用这个方法
        on_do_upload : function(options){
            //var Mask     = require("ui/mask/mask");
            //var Uploader = require("ui/uploader/uploader");
            require.async(['ui/uploader/uploader', 'ui/mask/mask'], function(Uploader, Mask) {
                new Mask({
                    closer : true,
                    escape : true,
                    width  : 460,
                    height : 500
                }).render(function(){
                    new Uploader({
                        parent     : this,
                        gasketName : "main",
                        target     : "id:" + options.target.id
                    }).render();
                });
            });
        }
    };

    // 初始化 ZUI 工厂类对象
    /*这些字段用来存放 UI 相关的运行时数据*/
    ZUI.keymap      = {};
    ZUI.tops        = [];
    ZUI.definitions = {};
    ZUI.instances   = {};

    // 这个函数用来定义一个 UI 模块，返回一个 Backbone.View 的类用来实例化
    ZUI.def = function(uiName, conf){
        var UIDef = this.definitions[uiName];
        if(!UIDef){
            // 准备配置对象的默认属性
            var viewOptions = {
                uiName    : uiName,
                tagName   : 'div',
                className : uiName.replace(/[.]/g, '-'),
                $ui       : {}
            };
            // 将 UI 的保留方法放入 $ui 中，其余 copy
            for(var key in conf){
                if(/^css|dom|i18n|init|redraw|depose|resize$/.test(key)){
                    viewOptions.$ui[key] = conf[key];
                }else{
                    viewOptions[key] = conf[key] || viewOptions[key];
                }
            }

            // 加入 UI 的原型方法
            _.extend(viewOptions, ZUIPrototype);
            // 注册
            UIDef = Backbone.View.extend(viewOptions);
            UIDef.uiName = uiName;
            this.definitions[uiName] = UIDef;    
        }
        // 返回
        return UIDef;
    };

    // 根据任何一个 DOM 元素，获取其所在的 UI 对象
    ZUI.checkInstance = function(el){
        var jq = $(el);
        var jui = jq.parents("[ui-id]");
        if(jui.size()==0){
            console.warn(el);
            throw "Current DOMElement no belone to any UI!";
        }
        var cid = jui.attr("ui-id");    
        return this.instances[cid];
    };

    // 异步读取全局的消息字符串
    ZUI.loadi18n = function(path, callback){
        path = _.template(path)({lang : window.$zui_i18n || "zh-cn"});
        require.async(path, function(mm){
            ZUI.g_msg_map = mm || {};
            callback();
        });
    };

    // 注册 window 的 resize 和键盘事件
    // 以便统一处理所有 UI 的 resize 行为和快捷键行为 
    if(!window._zui_events_binding){
        // 改变窗口大小
        $(window).resize(function(){
            for(var i=0;i<window.ZUI.tops.length;i++){
                var topUI = window.ZUI.tops[i];
                topUI.resize();
            }
        });
        // 快捷键
        $(document.body).keydown(function(e){
            //console.log(e);
            var keys = [];
            if(e.altKey)   keys.push("alt");
            if(e.ctrlKey)  keys.push("ctrl");
            if(e.metaKey)  keys.push("meta");
            if(e.shiftKey) keys.push("shift");
            var key;
            if(keys.length>0){
                key = keys.join("+") + "+" + e.which;
            }else{
                key = "" + e.which;
            }
            var wk = ZUI.keymap[key];
            if(wk) {
                var ui   = ZUI.instances[wk.cid];
                var func = wk.handler;
                func.call(ui, e);
            }
        });
        // 标记以便能不要再次绑定了
        window._zui_events_binding = true;
    }

    // 修改 underscore.js 的模板设置
    _.templateSettings.escape = /\{\{([\s\S]+?)\}\}/g;

});