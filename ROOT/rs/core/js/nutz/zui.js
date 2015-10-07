define(function (require, exports, module) {
    //console.log("***************** define the ZUI ***********************");
    //console.log(module);
    //console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
    // 采用统一的 ZUI.css
    seajs.use("zui_css");

    // 这个逻辑用来解析 UI 的 DOM， 并根据约定，预先得到 gasket 和 layout
    // 当然 layout 不是必须有的
    var parse_dom = function (html) {
        var ME = this;
        // 解析代码模板
        var tmpl = _.template(html);
        html = tmpl(ME._msg_map);
        ME.$el[0].innerHTML = html;  // FIXME 这里有严重的bug, tr不能被加入到页面中

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
        ME.arena = ME.$el.children('.ui-arena');

        // 搜索所有的 DOM 扩展点
        ME.gasket = {};
        ME.arena.find("[ui-gasket]").each(function () {
            var me = $(this);
            var nm = $.trim(me.attr("ui-gasket"));
            ME.gasket[nm] = {
                ui    : [],
                jq    : $(this),
                multi : me.attr("ui-multi") || false
            };
        });

        // DOM 解析完成
    };

    // 定义一个 UI 的原型
    var ZUIPrototype = {
        // Backbone.View 的初始化函数
        initialize: function (options) {
            var UI = this;
            // 初始化必要的内部字段
            UI._nutz_ui = "1.a.0";
            UI.uiKey = options.uiKey;
            UI._code_templates = {};  // 代码模板
            UI._watch_keys = {};
            UI.options = options;
            UI.parent = options.parent;
            UI.gasketName = options.gasketName;

            UI.$el.attr(options.theme || "w0");

            // 考虑将自己组合到自己的父插件
            if (UI.parent && UI.gasketName) {
                var gas = UI.parent.gasket[UI.gasketName];
                if (!gas)
                    throw "Fail to found gasket '" + UI.gasketName + "'";
                // 如果已经存在了插件，是否需要释放
                if(!gas.multi && gas.ui.length>0) {
                    gas.ui.forEach(function(ui){
                        ui.destroy();
                    });
                    gas.ui = [];
                }
                // 将自己添加到父插件
                gas.ui.push(UI);
                UI.$pel = gas.jq;
                UI.pel = gas.jq[0];
            }
            // 采用给定的父，如果没指定父，则直接添加到 document.body 上
            else {
                UI.$pel = options.$pel || $(document.body);
                UI.pel = UI.$pel[0];
            }
            // 加入 DOM 树
            UI.$pel.append(UI.$el);

            // 记录自身实例
            UI.$el.attr("ui-id", UI.cid);
            ZUI.instances[UI.cid] = UI;
            if (document.body == UI.pel || !UI.parent) {
                window.ZUI.tops.push(UI);
            }

            // 确定 uiKey，并用其索引自身实例
            if(UI.uiKey){
                if(ZUI.getByKey(UI.uiKey)){
                    throw 'UI : uiKey="'+uiKey+'" exists!!!';
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

            // 调用子类自定义的 init，以及触发事件
            $z.invoke(UI.$ui, "init", [options], UI);
            $z.invoke(UI.options, "on_init", [], UI);
            UI.trigger("ui:init", UI);

            // 最后调用自定义的 UI 监听
            if(UI.options.do_ui_listen){
                for(var key in UI.options.do_ui_listen){
                    var m = /^([^ ]+)[ ]+(.+)$/.exec(key);
                    if(null==m){
                        throw "wrong do_ui_listen key: " + key;
                    }
                    var handle = UI.options.do_ui_listen[key];
                    if(!_.isFunction(handle)){
                        handle = UI[handle];
                    }
                    UI.listenUI(m[1], m[2], handle);
                }
            }
        },
        destroy: function () {
            var UI = this;
            // 触发事件
            $z.invoke(UI.options, "on_depose", [], UI);
            UI.trigger("ui:depose", UI);

            // 释放掉自己所有的子
            for (var key in UI.gasket) {
                var sub = UI.gasket[key];
                sub.ui.forEach(function(ui){
                    ui.destroy();
                }); 
            }
            UI.gasket = {};
            // 移除自己的监听事件
            for (var key in UI._watch_keys) {
                delete ZUI.keymap[key];
            }
            // 释放掉自己
            $z.invoke(UI.$ui, "depose", [], UI);

            // 删除自己的 DOM 节点
            $z.invoke(UI.$el, "undelegate", []);
            UI.$el.off().remove();
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
        // 渲染自身
        render: function (afterRender) {
            var UI = this;
            // 加载 CSS
            if (UI.$ui.css) {
                seajs.use(UI.$ui.css);
            }
            // 看看是否需要异步加载多国语言字符串
            var callback = function (mm) {
                // 存储多国语言字符串
                UI._msg_map = $z.extend(_.extend({}, ZUI.g_msg_map), 
                                        UI.parent ?  UI.parent._msg_map : {},
                                        mm || {});
                // 用户自定义 redraw 执行完毕的处理
                var do_after_redraw = function(){
                    //console.log("!!!!! do_after_redraw:", UI.uiName, UI._defer_uiTypes)
                    // 回调
                    if (typeof afterRender === "function") {
                        afterRender.call(UI);
                    }

                    // 触发事件
                    $z.invoke(UI.options, "on_redraw", [], UI);
                    UI.trigger("ui:redraw", UI);

                    // 因为重绘了，看看有木有必要重新计算尺寸
                    UI.resize(true);
                };
                // 定义后续处理
                var do_render = function () {
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
                        UI._defer_uiTypes = uiTypes;
                        UI._check_defer_done("redraw");
                    }
                    //console.log("do_render:", UI.uiName, UI._defer_uiTypes)
                };
                // 看看是否需要解析 DOM
                if (UI.$ui.dom) {
                    // DOM 片段本身就是一段 HTML 代码 
                    if (/^\/\*.+\*\/$/m.test(UI.$ui.dom.replace(/\n/g, ""))) {
                        parse_dom.call(UI, UI.$ui.dom.substring(2, UI.$ui.dom.length - 2));
                        do_render();
                    }
                    // DOM 片段存放在另外一个地址
                    else {
                        require.async(UI.$ui.dom, function (html) {
                            parse_dom.call(UI, html);
                            do_render();
                        });
                    }
                }
                // 否则直接渲染
                else {
                    do_render();
                }
            };
            // 采用父 UI 的字符串
            if (".." == UI.$ui.i18n) {
                callback({});
            }
            // 采用自己的字符串
            else if (UI.$ui.i18n) {
                UI.$ui.i18n = _.template(UI.$ui.i18n)({lang: window.$zui_i18n || "zh-cn"});
                require.async(UI.$ui.i18n, callback);
            }
            // 空的
            else {
                callback({});
            }
            // 返回自身
            return UI;
        },
        // 汇报自己完成了哪个延迟加载的 UI
        defer_report : function(i, uiType){
            var UI = this;
            if(!UI._loaded_uiTypes)
                UI._loaded_uiTypes = [];
            UI._loaded_uiTypes[i] = uiType;
            UI._check_defer_done("" + i + uiType);
        },
        _check_defer_done : function(msg){
            var UI = this;
            if(UI._loaded_uiTypes && UI._defer_uiTypes && UI._defer_do_after_redraw){
                if(UI._loaded_uiTypes.length == UI._defer_uiTypes.length){
                    for(var i=0; i<UI._loaded_uiTypes.length; i++){
                        if(UI._loaded_uiTypes[i] != UI._defer_uiTypes[i]){
                            return;
                        }
                    }
                    UI._defer_do_after_redraw.call(UI);
                    delete UI._defer_uiTypes;
                    delete UI._loaded_uiTypes;
                    delete UI._defer_do_after_redraw;
                }
            }
        },
        // 修改 UI 的大小
        resize: function (deep) {
            var UI = this;

            // 如果是选择自适应
            if (UI.options.fitself) {
                return;
            }

            // 有时候，初始化的时候已经将自身加入父UI的gasket
            // 父 UI resize 的时候会同时 resize 子
            // 但是自己这时候还没有初始化完 DOM (异步加载)
            // 那么自己的 arena 就是未定义，因此不能继续执行 resize
            if (UI.arena) {
                // 需要调整自身，适应父大小
                if (UI.options.fitparent === true
                    || (UI.options.fitparent !== false && UI.arena.attr("ui-fitparent"))) {
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
                    UI.$el.css({
                        "width": w, 
                        "height": h
                    });
                    UI.arena.css({
                        "width": UI.$el.width(), 
                        "height": UI.$el.height()
                    });
                }

                // 调用自身的 resize
                $z.invoke(UI.$ui, "resize", [deep], UI);

                // 触发事件
                $z.invoke(UI.options, "on_resize", [], UI);
                UI.trigger("ui:resize", UI);

                // 调用自身所有的子 UI 的 resize
                if(deep){
                    for (var key in UI.gasket) {
                        var sub = UI.gasket[key];
                        sub.ui.forEach(function(ui){
                            ui.resize(deep);
                        });
                    }
                }
            }
        },
        // 监听一个事件
        // ui.watchKey(27, "ctrl", F(..))
        // ui.watchKey(27, ["ctrl","meta"], F(..))
        // ui.watchKey(27, F(..))
        watchKey: function (which, keys, handler) {
            var key;
            // 没有特殊 key
            if (typeof keys == "function") {
                handler = keys;
                key = "" + which;
            }
            // 组合的特殊键
            else if (_.isArray(key)) {
                key = keys.sort().join("+") + "+" + which;
            }
            // 字符串特殊键
            else {
                key = keys + "+" + which;
            }
            //console.log("watchKey : '" + key + "' : " + this.cid);
            var wk = ZUI.keymap[key];
            // 为当前插件创建映射
            if (wk) {
                throw "conflict watchKey : " + which + '(' + key + ') : ' + wk.cid + " <-> " + this.cid;
            }
            // 加入UI全局记录
            ZUI.keymap[key] = {
                cid: this.cid,
                handler: handler
            }
            // 记录到自身
            this._watch_keys[key] = true;
        },
        // 取消监听一个事件
        // ui.unwatchKey(27, "ctrl"})
        // ui.unwatchKey(27, ["ctrl","meta"])
        // ui.unwatchKey(27)
        unwatchKey: function (which, keys) {
            var key;
            // 组合的key
            if (_.isArray(key)) {
                key = keys.sort().join("+") + "+" + which;
            }
            // 字符串
            else if (keys) {
                key = keys + "+" + which;
            }
            // 没有特殊键
            else {
                key = "" + which;
            }
            // console.log("unwatchKey : '" + key + "' : " + this.cid);
            // 删除全局索引
            if (ZUI.keymap[key])
                delete ZUI.keymap[key][which];

            // 删除自身的快速索引
            if (this._watch_keys[key])
                delete this._watch_keys[key];
        },
        // 得到多国语言字符串
        msg: function (key, ctx) {
            var re = this._msg_map;
            var re = $z.getValue(this._msg_map, key);
            if(!re){
                return key;
            }
            // 需要解析
            if (re && _.isObject(ctx)) {
                re = (_.template(re))(ctx);
            }
            return re;
        },
        // 对一个字符串进行文本转移，如果是 i18n: 开头采用 i18n
        text: function(str, ctx){
            // 多国语言
            if(/^i18n:.+$/g.test(str)){
                return this.msg(str.substring(5), ctx);
            }
            // 字符串模板
            if(str && _.isObject(ctx)){
                return (_.template(str))(ctx);
            }
            // 普通字符串
            return str;
        },
        // 处理一个对象的字段，将其记录成特殊显示的值
        eval_obj_display : function(obj, displayMap){
            if(!_.isObject(obj))
                return;
            if(!_.isObject(displayMap))
                return;
            obj._display = {};
            for(var key in displayMap){
                var val = obj[key];
                var str = displayMap[key][val];
                if(/^i18n:.+$/g.test(str)){
                    str = this.msg(str.substring(5));
                }
                obj._display[key] = str || val;
            }
        },
        // 字段显示方式可以是模板或者回调，这个函数统一成一个方法
        eval_tmpl_func : function(obj, nm){
            var F = obj ? obj[nm] : null;
            if(!F)
                return null;
            return _.isFunction(F) ? F : _.template(F);
        },
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
            if(uiKey._nutz_ui){
                this._listen_to(uiKey, event, handler);
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
                return jq.clone();
            throw "Can not found code-template '" + codeId + "'";
        },
        //...................................................................
        // 提供一个通用的文件上传界面，任何 UI 可以通过
        //   this.listenModel("do:upload", this.on_do_upload); 
        // 来启用这个方法
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
            return this.def(arg0, arg1);
        }
        // 获取实例
        else if(_.isElement(arg0) || (arg0 instanceof jQuery)){
            return arg1 ? this.checkInstance(arg0)
                        : this.getInstance(arg0);
        }
        // 根据 uiKey
        else if(_.isString(arg0)){
            return arg1 ? this.checkByKey(arg0)
                        : this.getByKey(arg0);
        }
        // 未知处理
        throw "Unknown arg0 : " + arg0 + ", arg1" + arg1;
    };
    // 初始化 ZUI 工厂类对象
    /*这些字段用来存放 UI 相关的运行时数据*/
    ZUI.keymap = {};
    ZUI.tops = [];
    ZUI.definitions = {};
    ZUI.instances = {};  // 根据cid索引的 UI 实例
    ZUI._uis = {};       // 根据键值索引的 UI 实例，没声明 key 的 UI 会被忽略
    // 如果监听一个 UI 的键值，但是这个 UI 的实例因为异步还没有被加载
    // 那么，先暂存到这个属性里，当 UI 实例被加载完毕了，会自动应用这个监听的
    ZUI._defer_listen = {}

    // 这个函数用来定义一个 UI 模块，返回一个 Backbone.View 的类用来实例化
    ZUI.def = function (uiName, conf) {
        var UIDef = this.definitions[uiName];
        if (!UIDef) {
            // 准备配置对象的默认属性
            var viewOptions = {
                uiName: uiName,
                tagName: 'div',
                className: uiName.replace(/[.]/g, '-'),
                $ui: {}
            };
            // 将 UI 的保留方法放入 $ui 中，其余 copy
            for (var key in conf) {
                if (/^(css|dom|i18n|init|redraw|depose|resize)$/g.test(key)) {
                    viewOptions.$ui[key] = conf[key];
                } else {
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
    ZUI.getInstance = function (el) {
        var jq = $(el);
        var jui = jq.parents("[ui-id]");
        if (jui.size() == 0) {
            console.warn(el);
            throw "Current DOMElement no belone to any UI!";
        }
        var cid = jui.attr("ui-id");
        return getByCid(cid);
    };
    ZUI.checkInstance = function (el) {
        var jq = $(el);
        var jui = jq.parents("[ui-id]");
        if (jui.size() == 0) {
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
        path = _.template(path)({lang: window.$zui_i18n || "zh-cn"});
        require.async(path, function (mm) {
            ZUI.g_msg_map = mm || {};
            callback();
        });
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
        // 快捷键
        $(document.body).keydown(function (e) {
            //console.log(e);
            var keys = [];
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
            var wk = ZUI.keymap[key];
            if (wk) {
                var ui = ZUI.instances[wk.cid];
                var func = wk.handler;
                func.call(ui, e);
            }
        });
        // TODO 捕获 ondrop，整个界面不能被拖拽改变
        // 标记以便能不要再次绑定了
        window._zui_events_binding = true;
    }

    // 修改 underscore.js 的模板设置
    _.templateSettings.escape = /\{\{([\s\S]+?)\}\}/g;

});