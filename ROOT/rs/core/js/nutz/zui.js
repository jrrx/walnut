define(function (require, exports, module) {
//====================================================
// 采用统一的 ZUI.css
require("ui/dateformat.js");
require("theme/ui/zui.css");
//====================================================
var parse_dom = function (html) {
    var UI = this;
    // 解析代码模板
    var tmpl = $z.tmpl(html);
    html = tmpl(UI._msg_map);
    UI.$el[0].innerHTML = html;  // FIXME 这里有严重的bug, tr不能被加入到页面中

    // 分析 DOM 结构
    var map = this._code_templates;
    var jTmpl = this.$el.children('.ui-code-template').hide();
    var commonClass = jTmpl.attr("common-class");
    jTmpl.children('[code-id]').each(function () {
        var jq = $(this);
        if (commonClass && jq.attr("nocommon") != "true")
            jq.addClass(commonClass);
        var key = jq.attr('code-id');
        map[key] = jq;
    });
    UI.arena = UI.$el.children('.ui-arena');

    // 标识所有的扩展点
    sign_gaskets(UI);

    // DOM 解析完成
};
var sign_gaskets = function(UI){
    // 搜索所有的 DOM 扩展点, 为其增加前缀
    UI.$el.find("[ui-gasket]").each(function(){
        var jq = $(this);
        var ga = jq.attr("ui-gasket");
        // 已经被标识过了的话
        var m = /^([\w\d]+)@(.+)$/.exec(ga);
        if(m) {
            // 不是自己标识的，改成自己
            if(m[1] != UI.cid){
                jq.attr("ui-gasket", UI.cid + "@" + m[2]);
            }
        }
        // 没被标识过，标识一下
        else{
            jq.attr("ui-gasket", UI.cid + "@" + ga);
        }
    });
};
//====================================================
var register = function(UI) {
    var opt = UI.options;
    //....................................
    // 直接指明了 $el，那么需要进行替换
    if(UI.$el){
        // 重新定义自己的父选区
        UI.$pel   = UI.$el.parent();
        UI.pel    = UI.$pel[0];
        UI.parent = UI.parent || ZUI.getInstance(UI.pel);
        // 这种模式下，默认是要 keepDom 的
        $z.setUndefined(UI, "keepDom", (_.isUndefined(opt.keepDom) || opt.keepDom));
        UI.keepDom = _.isUndefined(opt.keepDom)
                        ? (UI.keepDom===false? false:true)
                        : opt.keepDom

        // 指明了 $el 那么 arena 与 $el 指向同样的 DOM
        UI.arena = UI.$el;

        // 看看这个 $el 是不是已经是个 UI 了
        var cid = UI.$el.attr("ui-id");

        // 如果本身就是一个 UI，则试图注销它
        if(cid){
            var oldUI = ZUI(cid);
            if(oldUI)
                oldUI.destroy();
            UI.$el = null;
            UI.el  = null;
        }
        // 否则清空它
        else if(!UI.keepDom){
            UI.$el.empty();
        }
    }
    //....................................
    // 指定了 $pel 的话 ...
    else if(UI.$pel){
        // 如果有 gasketName 那么就试图看看其所在 UI
        UI.parent = UI.parent || ZUI.getInstance(UI.$pel);
        // 如果这个元素带了 gasketName，则采用它
        var gnm = UI.$pel.attr("ui-gasket");
        var m   = /^(\w+)@(\w+)$/.exec(gnm);
        opt.gasketName = m ? m[2] : gnm;
        // 如果配置里没指定父，那么就得手动来一下
        if(!opt.parent && UI.parent){
            UI.parent.children.push(UI);
            UI.depth = UI.parent.depth + 1;
        }        
    }
    //....................................
    // 没有 $pel 则需要寻找选区
    else if(opt.gasketName && UI.parent){
        var selector = '[ui-gasket="'+UI.parent.cid+"@"+opt.gasketName+'"]';
        UI.$pel = UI.parent.$el.find(selector);
        // 从扩展的搜索范围里去寻找
        if(UI.$pel.size()==0 && UI.__elements.length>0){
            for(var i=0; i<UI.__elements.length; i++){
                var $_ele = UI.__elements[i];
                UI.$pel = $_ele.find(selector);
                if(UI.$pel.size()>0)
                    break;
            }
        }

        // 没找到是不能忍受的哦
        if(UI.$pel.size() == 0){
            throw $z.tmpl("fail to match gasket[{{gas}}] in {{pnm}}({{pid}})")({
                gas : opt.gasketName,
                pnm : UI.parent.uiName,
                pid : UI.parent.cid
            });
        }
    }
    //....................................
    // 顶级的 UI 啦
    else {
        UI.parent = null;
        UI.$pel = $(document.body);
        UI.pel  = document.body;
    }
    //....................................
    // 指明了扩展点的要记录哦，如果已经存在了 UI 就毁掉哦
    if(UI.parent && opt.gasketName){
        var oldUI = UI.parent.gasket[opt.gasketName];
        if(oldUI)
            oldUI.destroy();
        UI.parent.gasket[opt.gasketName] = UI;
    }
    //....................................
    // 确保 $el 被创建
    if(!UI.$el){
        UI.$el = $('<' + (opt.tagName||'div') + '>').addClass(UI.className);
        UI.el  = UI.$el[0];
        if(opt.className)
            UI.$el.addClass(opt.className);
        //.....................................
        // 加载时保持隐藏
        UI.$el.attr("ui-loadding","yes").hide();
        // 加入 DOM 树
        UI.$pel.append(UI.$el);
    }
    //.....................................
    // 记录自身实例
    UI.$el.attr("ui-id", UI.cid);
    ZUI.instances[UI.cid] = UI;

    // 记录顶级 UI
    if (!UI.parent) {
        window.ZUI.tops.push(UI);
    }
    //.....................................
};
//====================================================
// 定义一个 UI 的原型
var ZUIObj = function(){};
ZUIObj.prototype = {
    nutz_ui_version : "1.0",
    //............................................
    // Backbone.View 的初始化函数
    __init__: function (options) {
        var UI  = this;
        //............................... 保存配置项
        var opt = options || {};
        UI.options = opt;
        //............................... 必要的内部字段
        UI.uiKey = opt.uiKey;
        UI._code_templates = {};   // 代码模板
        UI._watch_keys = {};       // 键盘监听
        UI.gasket = {};            // 记录扩展点对应 UI
        //............................... 确定父子关系
        UI.parent = opt.parent;
        UI.children = [];
        if(UI.parent){
            UI.parent.children.push(UI);
            UI.depth = UI.parent.depth + 1;
        }
        else{
            UI.depth = 0;
        }
        //............................... 确定 el
        if(opt.$el){
            UI.el  = opt.$el[0];
            UI.$el = opt.$el;
        }
        else if(opt.el){
            UI.el  = opt.el;
            UI.$el = $(opt.el);
        }
        //............................... 确定 pel
        if(opt.$pel){
            UI.pel  = opt.$pel[0];
            UI.$pel = opt.$pel;
        }
        else if(opt.pel){
            UI.pel  = opt.pel;
            UI.$pel = $(opt.pel);
        }

        //............................... 控件的通用方法
        $z.setUndefined(UI, "blur", function(){
            this.$el.removeAttr("actived");
            $z.invoke(this.$ui, "blur", [], this);
        });
        $z.setUndefined(UI, "active", function(){
            this.$el.attr("actived", "yes");
            $z.invoke(this.$ui, "active", [], this);
        });

        // 默认先用父类的多国语言字符串顶个先
        UI._msg_map = UI.parent ? UI.parent._msg_map : ZUI.g_msg_map;

        // 注册 UI 实例
        register(UI);

        //............................... 继承父UI的属性执行器
        UI.exec = opt.exec || (UI.parent||{}).exec;
        UI.app = opt.app || (UI.parent||{}).app;

        // 得到 UI 的事件
        var events = _.extend({}, UI.events, opt.events);

        // 监听事件
        if(UI.$el){
            for(var key in events){
                var m = /^([^ ]+)[ ]+(.+)$/.exec(key);
                if(null==m){
                    throw "wrong events key: " + key;
                }
                UI.$el.on(m[1], m[2], events[key], function(e){
                    e.data.apply(UI, [e]);
                });
            }
        }

        // 调用子类自定义的 init
        $z.invoke(UI.$ui, "init", [opt], UI);

        // 触发初始化事件
        $z.invoke(opt, "on_init", [opt], UI);
        UI.trigger("ui:init", UI);
    },
    //............................................
    // 释放全部自己的子
    releaseAllChildren : function(forceRemoveDom){
        var UI = this;
        // 释放掉自己所有的子
        var __children = UI.children ? [].concat(UI.children) : [];
        for (var i=0; i<__children.length; i++) {
            __children[i].destroy(forceRemoveDom);
        }
    },
    //............................................
    destroy: function (forceRemoveDom) {
        var UI  = this;
        var opt = UI.options;

        // 调用更多的释放逻辑
        $z.invoke(UI.$ui, "depose", [], UI);
        $z.invoke(opt, "on_depose", [], UI);
        UI.trigger("ui:depose", UI);

        // 释放掉自己所有的子
        UI.releaseAllChildren(forceRemoveDom);

        // 移除自己在父节点的记录
        if(UI.parent){
            UI.parent.children = UI.parent.children.filter(function(subUI){
                return subUI.cid != UI.cid;
            });
            if(opt.gasketName){
                delete UI.parent.gasket[opt.gasketName];
            }
        }

        // 移除自己的监听事件
        UI.unwatchKey();
        UI.unwatchMouse();

        // 移除 DOM 的事件监听
        $z.invoke(UI.$el, "undelegate", []);
        UI.$el.off();

        // 删除自己的 DOM 节点
        if(forceRemoveDom || !UI.keepDom){
            UI.$el.remove();
        }

        // 移除注册
        delete ZUI.instances[UI.cid];
        // 移除 uiKey
        if(UI.uiKey){
            delete ZUI._uis[UI.uiKey];
        }

        // 删除顶级节点记录
        var list = [];
        ZUI.tops.forEach(function(top){
            if (top != UI)
                list.push(top)
        }, UI);
        ZUI.tops = list;
    },
    //............................................
    // 渲染自身
    render: function (afterRender) {
        var UI = this;
        
        // 确定语言
        UI.lang = (UI.parent||{}).lang || window.$zui_i18n || "zh-cn";

        //============================================== i18n读完后的回调
        // 看看是否需要异步加载多国语言字符串
        var callback = function () {
            // 合并成一个语言集合
            for(var i=0; i<arguments.length; i++){
                _.extend(UI._msg_map, arguments[i]);
            }
            // 用户自定义 redraw 执行完毕的处理
            var do_after_redraw = function(){
                // if("ui.mask" == UI.uiName)
                //     console.log("!!!!! do_after_redraw:", UI.uiName, UI._defer_uiTypes)
                // 回调，延迟处理，以便调用者拿到返回值之类的
                window.setTimeout(function(){
                    if (typeof afterRender === "function") {
                        afterRender.call(UI);
                    }

                    // 触发事件
                    $z.invoke(UI.options, "on_redraw", [], UI);
                    UI.trigger("ui:redraw", UI);

                    // 确定 uiKey，并用其索引自身实例
                    if(UI.uiKey){
                        if(ZUI.getByKey(UI.uiKey)){
                            throw 'UI : uiKey="'+UI.uiKey+'" exists!!!';
                        }
                        ZUI._uis[UI.uiKey] = UI;
                        // 看看有没有要延迟监听的
                        var dl = ZUI._defer_listen[UI.uiKey];
                        if(dl){
                            for(var i in dl){
                                var dlo = dl[0];
                                dlo.context.listenUI(UI, dlo.event, dlo.handler);
                            }
                            delete ZUI._defer_listen[UI.uiKey];
                        }
                    }

                    // 触发显示事件
                    $z.invoke(UI.options, "on_display", [], UI);
                    UI.trigger("ui:display", UI);

                    // 让 UI 的内容显示出来
                    UI.$el.removeAttr("ui-loadding").show();

                    // 因为重绘了，看看有木有必要重新计算尺寸，这里用 setTimeout 确保 resize 是最后执行的指令
                    // TODO 这里可以想办法把 resize 的重复程度降低
                    window.setTimeout(function(){
                        UI.resize(true);
                    }, 0);
                }, 0);
            };
            // 定义后续处理
            var do_render = function () {
                // 首先看看是否有增加 class
                if(UI.options.arenaClass){
                    UI.arena.addClass(UI.options.arenaClass);
                }

                // 调用UI的特殊重绘方法，如果方法返回了一组 ui 的类型，那么就表示
                // 用户在方法里采用了异步还要加载这组 UI
                // 加载完毕后，调用者需要主动在自己的 redraw 函数里，调用 
                //  UI.defer_report(i, uiType)
                // 标识加载完成，待全部异步加载的 UI 完成后，会调才会调用 do_after_redraw
                var uiTypes = $z.invoke(UI.$ui, "redraw", [], UI);
                if(!uiTypes || uiTypes.length == 0){
                    do_after_redraw();
                }
                // 哦？ 是异步的绘制，那么先存储一下回调，等待 UI 全部加载完再调用
                else {
                    UI._defer_do_after_redraw = do_after_redraw;
                    UI._defer_uiTypes = [].concat(uiTypes);
                    UI._check_defer_done("redraw");
                }

                // 调用自定义的 dom 监听
                if(UI.options.dom_events) {
                    for(var key in UI.options.dom_events){
                        var m = /^([^ ]+)[ ]+(.+)$/.exec(key);
                        if(null==m){
                            throw "wrong dom_events key: " + key;
                        }
                        var handler = UI.options.dom_events[key];
                        if(!_.isFunction(handler)){
                            handler = UI[handler];
                        }
                        UI.$el.on(m[1], m[2], handler);
                    }
                }

                // 调用自定义的 UI 监听
                if(UI.options.do_ui_listen){
                    for(var key in UI.options.do_ui_listen){
                        var m = /^([^ ]+)[ ]+(.+)$/.exec(key);
                        if(null==m){
                            throw "wrong do_ui_listen key: " + key;
                        }
                        var handler = UI.options.do_ui_listen[key];
                        if(!_.isFunction(handler)){
                            handler = UI[handler];
                        }
                        UI.listenUI(m[1], m[2], handler);
                    }
                }
                //console.log("do_render:", UI.uiName, UI._defer_uiTypes)
            };
            // 看看是否需要解析 DOM
            var uiDOM = UI.options.dom || UI.$ui.dom;
            if (uiDOM) {
                // DOM 片段本身就是一段 HTML 代码  /*...*/ 包裹
                if (/^(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)$/.test(uiDOM)) {
                    parse_dom.call(UI, uiDOM.substring(2, uiDOM.length - 2));
                    do_render();
                }
                // DOM 片段就是一段 HTML 代码
                else if(/^[ \t\n\r]*<.+>[ \t\n\r]*$/m.test(uiDOM)){
                    parse_dom.call(UI, uiDOM);
                    do_render();
                }
                // DOM 片段存放在另外一个地址
                else {
                    require.async(uiDOM, function (html) {
                        parse_dom.call(UI, html);
                        do_render();
                    });
                }
            }
            // 否则直接渲染
            else {
                sign_gaskets(UI);
                do_render();
            }
        };
        //============================================== i18n
        var do_i18n = function(){
            // 采用父 UI 的字符串
            var uiI18N = $z.concat(UI.$ui.i18n, UI.options.i18n);
            // console.log(UI.uiName, "UI.$ui.i18n", UI.$ui.i18n);
            // console.log(UI.uiName, "UI.options.i18n", UI.$ui.i18n);

            // 存储多国语言字符串
            // 需要将自己的多国语言字符串与父 UI 的连接 
            UI._msg_map = $z.inherit({}, UI.parent ? UI.parent._msg_map : ZUI.g_msg_map);

            // 找到需要加载的消息字符串
            var i18nLoading = [];
            for(var i=0; i<uiI18N.length; i++){
                var it = uiI18N[i];
                // 字符串的话，转换后加入待加载列表
                if(_.isString(it)){
                    i18nLoading.push($z.tmpl(it)({lang: UI.lang}));
                }
                // 对象的话，直接融合进来
                else if(_.isObject(it)){
                    _.extend(UI._msg_map, it);
                }
                // 其他的无视就好
            }

            // 不需要读取了
            if (i18nLoading.length == 0) {
                callback();
            }
            // 异步加载 ...
            else {
                //console.log(UI.uiName, "i18n", uiI18N);
                require.async(i18nLoading, callback);
            }
        }
        //============================================== 从处理CSS开始
        // 加载 CSS
        var uiCSS = $z.concat(UI.$ui.css, UI.options.css);
        if (uiCSS.length > 0) {
            seajs.use(uiCSS, do_i18n);
        }else{
            do_i18n();
        }
        // 返回自身
        return UI;
    },
    //............................................
    // 汇报自己完成了哪个延迟加载的 UI
    defer_report : function(i, uiType){
        var UI = this;
        if(!UI._loaded_uiTypes)
            UI._loaded_uiTypes = [];

        // 因为是延迟，所以放到执行队列最后执行
        window.setTimeout(function(){
            // 如果仅仅给了个 uiType，那么自动寻找 i
            if(_.isString(i)){
                uiType = i;
                i = UI._defer_uiTypes.indexOf(uiType);
                if(i<0){
                    alert("defer uiType '" + uiType + "' without define!");
                    throw "defer uiType '" + uiType + "' without define!";
                }
            }
            // 记录加载完的项目
            UI._loaded_uiTypes[i] = uiType;
            UI._check_defer_done();

        }, 0);
    },
    _check_defer_done : function(){
        var UI = this;
        if(UI._loaded_uiTypes && UI._defer_uiTypes && UI._defer_do_after_redraw){
            if(UI._loaded_uiTypes.length == UI._defer_uiTypes.length){
                for(var i=0; i<UI._loaded_uiTypes.length; i++){
                    if(UI._loaded_uiTypes[i] != UI._defer_uiTypes[i]){
                        return;
                    }
                }
                // 延迟调用
                window.setTimeout(function(){
                    if(UI._loaded_uiTypes && UI._defer_uiTypes && UI._defer_do_after_redraw){
                         UI._defer_do_after_redraw.call(UI);
                         delete UI._defer_uiTypes;
                        delete UI._loaded_uiTypes;
                        delete UI._defer_do_after_redraw;
                    }
                }, 0);
            }
        }
    },
    //............................................
    // 修改 UI 的大小
    resize: function (deep) {
        var UI  = this;
        var opt = UI.options;
        // 如果是选择自适应
        if (opt.fitself) {
            return;
        }

        // 如果还在加载中，也什么都不做
        if(UI.$el.attr("ui-loadding")){
            return;
        }

        // 有时候，初始化的时候已经将自身加入父UI的gasket
        // 父 UI resize 的时候会同时 resize 子
        // 但是自己这时候还没有初始化完 DOM (异步加载)
        // 那么自己的 arena 就是未定义，因此不能继续执行 resize
        if (UI.arena) {
            // 需要调整自身，适应父大小
            if (opt.fitparent === true
                || (opt.fitparent !== false && UI.arena.attr("ui-fitparent"))) {
                // 调整自身的顶级元素
                var w, h;
                if (this.pel === document.body) {
                    var winsz = $z.winsz();
                    w = winsz.width;
                    h = winsz.height;
                } else {
                    w = UI.$pel.width();
                    h = UI.$pel.height();
                }
                // 得到自身顶级元素的左右边距
                var margin = $z.margin(UI.$el);
                UI.$el.css({
                    "width" : w - margin.x, 
                    "height": h - margin.y
                });
                margin = $z.margin(UI.arena);
                UI.arena.css({
                    "width" : UI.$el.width()  - margin.x, 
                    "height": UI.$el.height() - margin.y
                });
            }

            // 调用自身的 resize
            $z.invoke(UI.$ui, "resize", [deep], UI);

            // 触发事件
            $z.invoke(opt, "on_resize", [], UI);
            UI.trigger("ui:resize", UI);

            // 调用自身所有的子 UI 的 resize
            if(deep){
                for (var i=0; i<UI.children.length; i++) {
                    UI.children[i].resize(deep);
                }
            }
        }
    },
    //............................................
    // 记录了更多的外部 DOM(jQuery包裹)，扩展点也会从这里面寻找
    // 仅仅是记录，控件销毁的时候并不会清空这些扩展点
    // 除非你在 depose 方法里编写逻辑
    __elements : [],
    addElement : function(jq){
        this.__elements.push(jq);
    },
    //............................................
    // 监听一个事件
    // ui.watchKey(27, "ctrl", F(..))
    // ui.watchKey(27, ["ctrl","meta"], F(..))
    // ui.watchKey(27, F(..))
    /*
    对象格式
    ZUI.keymap = {
        "alt+shift+28" : {
            "c2" : [F(e), F(e)]
        }
    }
    */
    watchKey: function (which, keys, handler) {
        // 没有特殊 key
        if (typeof keys == "function") {
            handler = keys;
            keys = undefined;
        }
        
        var key = this.__keyboard_watch_key(which, keys);
        //console.log("watchKey : '" + key + "' : " + this.cid);
        $z.pushValue(ZUI.keymap, [key, this.cid], handler);

        // 记录到自身以便可以快速索引
        this._watch_keys[key] = true;
    },
    __keyboard_watch_key : function(which, keys){
        // 直接就是字符串
        if(_.isString(which)){
            return which;
        }
        // 组合的key
        if (_.isArray(keys)) {
            return keys.sort().join("+") + "+" + which;
        }
        // 字符串
        if (_.isString(keys)) {
            return  keys + "+" + which;
        }
        // 没有特殊键
        return "" + which;
    },
    // 取消监听一个事件
    // ui.unwatchKey(27, "ctrl"})
    // ui.unwatchKey(27, ["ctrl","meta"])
    // ui.unwatchKey(27)
    unwatchKey: function (which, keys) {
        // 注销全部监听
        if(_.isUndefined(which)){
            for(var key in this._watch_keys){
                var wkm = ZUI.keymap[key];
                if(wkm && wkm[this.cid]){
                    delete wkm[this.cid];
                }
            }
            this._watch_keys=[];
            return;
        }
        // 注销指定事件监听
        var key = this.__keyboard_watch_key(which, key);
        // console.log("unwatchKey : '" + key + "' : " + this.cid);
        // 删除全局索引
        var wkm = ZUI.keymap[key];
        if (wkm && wkm[this.cid]) {
            delete wkm[this.cid];
        }
        // 删除自身的快速索引
        if (this._watch_keys[key])
            delete this._watch_keys[key];
    },
    // 监听全局鼠标事件
    watchMouse : function(eventType, handler){
        $z.pushValue(ZUI.mousemap, [eventType, this.cid], handler);
    },
    // 取消全局鼠标事件监听
    unwatchMouse : function(eventType){
        // 去掉所有的事件监听
        if(!eventType){
            for(var key in ZUI.mousemap){
                this.unwatchMouse(key);
            }
        }
        // 去掉指定事件
        else{
            var wmm = ZUI.mousemap[eventType];
            if(wmm && wmm[this.cid])
                delete wmm[this.cid];
        }
    },
    // 得到多国语言字符串
    msg: function (key, ctx, msgMap) {
        var re = $z.getValue(msgMap || this._msg_map, key);
        if(!re){
            return key;
        }
        // 需要解析
        if (re && ctx && _.isObject(ctx)) {
            re = ($z.tmpl(re))(ctx);
        }
        return re;
    },
    // 得到多国语言字符串，如果没有返回默认值，如果没指定默认值，返回空串 ("")
    str : function(key, dft){
        if(/^i18n:.+$/g.test(key)){
            key = key.substring(5);
        }
        var re = $z.getValue(this._msg_map, key);
        return re || dft || "";
    },
    // 对一个字符串进行文本转移，如果是 i18n: 开头采用 i18n
    text: function(str, ctx, msgMap){
        // 多国语言
        if(/^i18n:.+$/g.test(str)){
            return this.msg(str.substring(5), ctx, msgMap);
        }
        // 字符串模板
        if(str && ctx && _.isObject(ctx)){
            return ($z.tmpl(str))(ctx);
        }
        // 普通字符串
        return str;
    },
    // 在某区域显示读取中，如果没有指定区域，则为整个 arena
    showLoading : function(selector){
        var html = '<div class="ui-loading">';
        html += '<i class="fa fa-spinner fa-pulse"></i> <span>'+this.msg("loading")+'</span>';
        html += '</div>';

        var jq = selector ? $(selector) : this.arena;
        jq.empty().html(html);
    },
    hideLoading : function(){
        this.arena.find(".ui-loading").remove();
    },
    // 根据路径获取一个子 UI
    subUI : function(uiPath){
        var UI = this;
        var ss = uiPath.split(/[\/\\.]/);
        for(var i=0;i<ss.length;i++){
            var s = ss[i];
            UI = UI.gasket[s];
            if(!UI)
                return null;
        }
        return UI;
    },
    // 释放某个子 UI
    releaseSubUI : function(uiPath){
        var sub = this.subUI(uiPath);
        if(sub)
            sub.destroy();
    },
    // 快捷方法，帮助 UI 存储本地状态
    // 需要设置 "app" 段
    // 参数 appName 默认会用 app.name 来替代 
    local : function(key,val, appName){
        var UI = this;
        var app = UI.app;
        if(!app || !app.session || !app.session.me){
            throw "UI.local need 'app.session.me'";
        }
        return $z.local(appName||app.name, app.session.me, key, val);
    },
    // 字段显示方式可以是模板或者回调，这个函数统一成一个方法
    eval_tmpl_func : function(obj, nm){
        var F = obj ? obj[nm] : null;
        if(!F)
            return null;
        return _.isFunction(F) ? F : $z.tmpl(F);
    },
    //............................................
    ui_parse_data : function(obj, callback) {
        var UI   = this;
        var opt  = UI.options;
        var context = opt.context || UI;
        // 同步
        if(_.isFunction(opt.parseData)){
            var o = opt.parseData.call(context, obj, UI);
            callback.call(UI, o, opt);
        }
        // 异步 
        else if(_.isFunction(opt.asyncParseData)){
            opt.asyncParseData.call(context, obj, function(o){
                callback.call(UI, o, opt);
            }, UI);
        }
        // 直接使用
        else{
            callback.call(UI, obj, opt);
        }
    },
    //............................................
    ui_format_data : function(callback){
        var UI  = this;
        var opt = UI.options;
        var obj = callback.call(UI, opt);
        if(_.isFunction(opt.formatData)){
            var context = opt.context || UI;
            return opt.formatData.call(context, obj, UI);
        }
        return obj;
    },
    //............................................
    // 监听本 UI 的模块事件
    listenModel: function (event, handler) {
        this._listen_to(this.model, event, handler);
    },
    // 监听本 UI 的父UI事件
    listenParent : function(event, handler) {
        this._listen_to(this.parent, event, handler);
    },
    // 监听某个 UI 的事件
    listenUI : function(uiKey, event, handler) {
        // 给的就是一个 UI 实例，那么直接监听了
        if(uiKey.nutz_ui_version){
            this._listen_to(uiKey, event, handler);
        }
        // 监听自己的父
        else if("$parent" == uiKey){
            this._listen_to(this.parent, event, handler);
        }
        // 否则看看是不是需要推迟建立
        else{
            var taUI = ZUI.getByKey(uiKey);
            // 不需要推迟
            if(taUI) {
                this._listen_to(taUI, event, handler);       
            }
            // 暂存
            else {
                var dl = ZUI._defer_listen[uiKey];
                if(!dl){
                    dl = [];
                    ZUI._defer_listen[uiKey] = dl;
                }
                dl.push({
                    event : event, 
                    handler : handler,
                    context : this
                });
            }
        }
    },
    // 监听某个 backbone 的模块消息 
    _listen_to: function (target, event, handler) {
        if (target){
            // 如果给的是一个字符串，那么就表示当前对象的一个方法
            // 支持 . 访问子对象
            if(_.isString(handler)){
                handler = $z.getValue(this, handler);
            }
            this.listenTo(target, event, handler);
        }
    },
    // 监听父UI的事件
    // 返回一个对应的 DOM 节点的克隆
    ccode: function (codeId) {
        var jq = this._code_templates[codeId];
        if (jq)
            return jq.clone().removeAttr("code-id");
        throw "Can not found code-template '" + codeId + "'";
    },
    //...................................................................
    ajaxReturn : function(re, option, context){
        var UI = this;
        context = context || UI;
        if(_.isString(re)){
            re = $z.fromJson(re);
        }
        // 格式化 callback
        if(_.isFunction(option)){
            option = {
                success : option
            }
        }
        // 如果失败了
        if(!re.ok){
            console.warn(UI.msg(re.errCode) + "\n\n" + re.msg);
            return $z.doCallback(option.fail, [re], context);
        }
        // 如果成功了
        return $z.doCallback(option.success, [re.data], context);
    },
    //...................................................................
    // 提供一个通用的文件上传界面，任何 UI 可以通过
    //   this.listenModel("do:upload", this.on_do_upload); 
    // 来启用这个方法
    // !!! 这个方法将被删除
    on_do_upload: function (options) {
        //var Mask     = require("ui/mask/mask");
        //var Uploader = require("ui/uploader/uploader");
        require.async(['ui/uploader/uploader', 'ui/mask/mask'], function (Uploader, Mask) {
            new Mask({
                closer: true,
                escape: true,
                width: 460,
                height: 500
            }).render(function () {
                    new Uploader({
                        parent: this,
                        gasketName: "main",
                        target: "id:" + options.target.id
                    }).render();
                });
        });
    }
};

// ZUI 就是一个处理方法 
var ZUI = function(arg0, arg1){
    // 定义
    if(_.isString(arg0) && _.isObject(arg1)){
        return ZUI.def(arg0, arg1);
    }
    // 获取实例
    else if(_.isElement(arg0) || (arg0 instanceof jQuery)){
        return arg1 ? ZUI.checkInstance(arg0)
                    : ZUI.getInstance(arg0);
    }
    // 根据 uiKey
    else if(_.isString(arg0)){
        return arg1 ? ZUI.checkByKey(arg0) || ZUI.checkByCid(arg0)
                    : ZUI.getByKey(arg0) || ZUI.getByCid(arg0); 
    }
    // 未知处理
    throw "Unknown arg0 : " + arg0 + ", arg1" + arg1;
};
// 初始化 ZUI 工厂类对象
/*这些字段用来存放 UI 相关的运行时数据*/
ZUI.keymap = {/*
    "alt+shift+28" : {
        "c2" : [F(e), F(e)..]
    }
*/};
ZUI.mousemap = {/*
    click: {
       "c2" : [F(e), F(e)..]
    }
*/};
ZUI.tops = [];
ZUI.definitions = {};
ZUI.instances = {};  // 根据cid索引的 UI 实例
ZUI._uis = {};       // 根据键值索引的 UI 实例，没声明 key 的 UI 会被忽略
ZUI.__CID = 0;       // 统一的 UI 计数器

// 如果监听一个 UI 的键值，但是这个 UI 的实例因为异步还没有被加载
// 那么，先暂存到这个属性里，当 UI 实例被加载完毕了，会自动应用这个监听的
ZUI._defer_listen = {}

// 这个函数用来定义一个 UI 模块，返回一个 Backbone.View 的类用来实例化
ZUI.def = function (uiName, conf) {
    var uiDef = this.definitions[uiName];
    if (!uiDef) {
        // 准备配置对象的默认属性
        var opt = {
            uiName: uiName,
            tagName: 'div',
            className: uiName.replace(/[.]/g, '-'),
            $ui: {}
        };
        // 将 UI 的保留方法放入 $ui 中，其余 copy
        for (var key in conf) {
            if (/^(css|dom|i18n|init|redraw|depose|resize|active|blur)$/g.test(key)) {
                opt.$ui[key] = conf[key];
            }
            else if("className" == key){
                opt.className += " " + conf.className;
            }
            else {
                opt[key] = opt[key] || conf[key];
            }
        }

        // 定义新 UI
        uiDef = function(options){
            // 建立自己的 ID
            this.cid = "view"+(ZUI.__CID++);
            // 加入 Backbone 的事件支持
            _.extend(this, Backbone.Events);
            // 调用初始化方法
            this.__init__(options);
        };
        uiDef.prototype = _.extend(opt, new ZUIObj());
        uiDef.uiName = uiName;

        // 缓存上这个定义
        this.definitions[uiName] = uiDef;
    }
    // 返回
    return uiDef;
};

// 根据任何一个 DOM 元素，获取其所在的 UI 对象
ZUI.getInstance = function (el) {
    var jq = $(el);
    var jui = jq.closest("[ui-id]");
    if (jui.size() == 0) {
        return null;
    }
    var cid = jui.attr("ui-id");
    return this.getByCid(cid);
};
ZUI.checkInstance = function (el) {
    var jq = $(el);
    var jui = jq.closest("[ui-id]");
    if (jui.size() == 0) {
        if(console && console.warn)
            console.warn(el);
        throw "Current DOMElement no belone to any UI!";
    }
    var cid = jui.attr("ui-id");
    return this.checkByCid(cid);
};

// 根据 cid 获取 UI 的实例 
ZUI.getByCid = function(cid){
    return this.instances[cid];
};
ZUI.checkByCid = function(cid){
    var UI = this.getByCid(cid);
    if(!UI)
        throw "UI instances 'cid="+cid+"' no exists!";
    return UI;
};

// 根据 uiKey 获取 UI 的实例 
ZUI.getByKey = function(uiKey){
    return this._uis[uiKey];
};
ZUI.checkByKey = function(uiKey){
    var UI = this.getByKey(uiKey);
    if(!UI)
        throw "UI instances 'uiKey="+uiKey+"' no exists!";
    return UI;
};

// 异步读取全局的消息字符串
ZUI.loadi18n = function (path, callback) {
    path = $z.tmpl(path)({lang: window.$zui_i18n || "zh-cn"});
    require.async(path, function (mm) {
        ZUI.g_msg_map = mm || {};
        callback();
    });
};

// 调试方法，打印当前 UI 的级联 tree
ZUI.dump_tree = function(UI, depth, stopBy, No){
    // 显示一个 UI 的树
    if(UI){
        No = No || "";
        var depth  = _.isUndefined(depth) ? 0 : depth
        var indent = "    ";
        var prefix = $z.dupString(indent, depth);
        var ctx    = {
            nm     : UI.uiName,
            cid    : UI.cid,
            uiKey  : UI.uiKey ? "["+UI.uiKey+"]" : "",
            klass  : UI.$pel.prop("className"),
            childN : UI.children.length
        }
        var str = ($z.tmpl("{{nm}}({{cid}}){{uiKey}}<{{klass}}>:{{childN}}children"))(ctx);
        // 显示扩展点
        for(var key in UI.gasket) {
            var sui = UI.gasket[key];
            if(sui){
                str += "\n" + prefix 
                       + "  @" + $z.alignLeft('"' + key + '"', 8, " ")
                       + "-> " + ZUI.dump_tree(sui, depth+1, stopBy);
            }
        }
        // 显示子
        if(!stopBy || !stopBy.test(UI.uiName))
            if(UI.children.length > 0){
                str += "\n" + prefix + "   >>>>>>>>>>>>>>";
                for(var i=0; i<UI.children.length; i++){
                    str += "\n" + prefix + indent
                           + "[" + No + i + "]" 
                           + ZUI.dump_tree(UI.children[i], depth+1, stopBy, No+i+".");
                }
            }
        // 返回
        return str;
    }
    // 显示全部顶层 UI
    var str = "";
    for(var i in ZUI.tops){
        str += "-> " + ZUI.dump_tree(ZUI.tops[i], 0) + "\n"; 
    }
    return str;
};

// 创建全局变量，以及模块导出
window.ZUI = ZUI;
module.exports = ZUI;
//===================================================================
// 注册 window 的 resize 和键盘事件
// 以便统一处理所有 UI 的 resize 行为和快捷键行为 
if (!window._zui_events_binding) {
    // 改变窗口大小
    $(window).resize(function () {
        for (var i = 0; i < window.ZUI.tops.length; i++) {
            var topUI = window.ZUI.tops[i];
            topUI.resize(true);
        }
    });
    // 键盘快捷键
    $(document.body).keydown(function (e) {
        //console.log(e.which);
        var keys = [];
        // 顺序添加，所以不用再次排序了
        if (e.altKey)   keys.push("alt");
        if (e.ctrlKey)  keys.push("ctrl");
        if (e.metaKey)  keys.push("meta");
        if (e.shiftKey) keys.push("shift");
        var key;
        if (keys.length > 0) {
            key = keys.join("+") + "+" + e.which;
        } else {
            key = "" + e.which;
        }
        var wkm = ZUI.keymap[key];
        if (wkm) {
            for(var cid in wkm){
                var ui = ZUI(cid);
                if(!ui) continue;
                var funcs = wkm[cid];
                if(funcs){
                    for(var i=0;i<funcs.length;i++)
                        funcs[i].call(ui, e);
                }
            }
        }
    });
    // 全局鼠标事件
    var on_g_mouse_event = function(e){
        var wmm = ZUI.mousemap[e.type];
        if(wmm)
            for(var cid in wmm){
                var ui = ZUI(cid);
                if(!ui) continue;
                var funcs = wmm[cid];
                for(var i=0;i<funcs.length;i++)
                        funcs[i].call(ui, e);
            }
    };
    $(document).mousedown(on_g_mouse_event);
    $(document).mouseup(on_g_mouse_event);
    $(document).mousemove(on_g_mouse_event);
    $(document).click(on_g_mouse_event);
    $(document).dblclick(on_g_mouse_event);
    $(document).mouseover(on_g_mouse_event);
    $(document).mouseout(on_g_mouse_event);
    $(document).mouseenter(on_g_mouse_event);
    $(document).mouseleave(on_g_mouse_event);
    $(document).contextmenu(on_g_mouse_event);

    // TODO 捕获 ondrop，整个界面不能被拖拽改变
    // 标记以便能不要再次绑定了
    window._zui_events_binding = true;
}

// 修改 underscore.js 的模板设置
_.templateSettings.escape = /\{\{([\s\S]+?)\}\}/g;
//====================================================
});