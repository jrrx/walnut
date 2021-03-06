(function($z){
$z.declare(['zui', 'ui/mask/mask'], function(ZUI, MaskUI){
//==============================================
function __check_ui_part(UI, key, uiTypes, uiConfs){
    var uiD = UI.options[key];
    var jq = UI.arena.find(".osearch-"+key);
    if(uiD && uiD.uiType){
        UI.setup.uiTypes.push(uiD.uiType);
        UI.setup.uiConfs.push(_.extend({},uiD.uiConf,{
            parent     : UI,
            gasketName : key
        }));
        UI.setup.jqs.push(jq);
        UI.setup.keys.push(key);
    }
    else{
        jq.remove();
    }
}

function normalize_sub(options, key, dft) {
    var ud = options[key];
    // 未定义采用默认的
    if(!ud){
        options[key] = dft;
    }
    // 定义了类型
    else if(_.isString(ud)){
        options[key] = {
            uiType : ud,
            uiConf : {}
        };
    }
    // 其他的必须保证有 uiType
    else if(ud.uiType){
        $z.setUndefined(ud, "uiConf", {});
    }
    // 靠，什么玩意
    else{
        throw "osearch invalid define for [" + key + "]:\n" + $z.toJson(ud);
    }
}
//==============================================
var html = function(){/*
<div class="ui-arena" ui-fitparent="true">
    <div class="osearch-sky">
        <div class="osearch-actions" ui-gasket="menu"></div>
        <div class="osearch-filter" ui-gasket="filter"></div>
    </div>
    <div class="osearch-list"  ui-gasket="list"></div>
    <div class="osearch-pager" ui-gasket="pager"></div>
</div>
*/};
//==============================================
return ZUI.def("ui.osearch", {
    dom  : $z.getFuncBodyAsStr(html.toString()),
    css  : "ui/osearch/osearch.css",
    i18n : "ui/osearch/i18n/{{lang}}.js",
    init : function(options){
        var UI = this;
        $z.setUndefined(options, "checkable", options.list.uiConf.checkable ? true : false);
        $z.setUndefined(options, "dftQuery", {
            pn   :1,
            skip : 0,
            pgsz : 50,
        });
        // 必须制定获取数据的方法
        if(!options.data){
            // 如果设置了执行器，默认用可执行命令来执行
            if(UI.exec)
                options.data = "obj -match '<%=condition%>' -skip {{skip}} -limit {{pgsz}} -json -pager -sort 'nm:1'";
            else
                throw "osearch require data or exec field!!!";
        }

        // 确保 filter,list,pager 三个参数格式标准 
        normalize_sub(options, "filter", {uiType:"ui/osearch/ofilter",uiConf:{}});
        normalize_sub(options, "list", {uiType:"ui/otable/otable",uiConf:{checkable:true}});
        normalize_sub(options, "pager",  {uiType:"ui/osearch/opager",uiConf:{}});

        // 加载完毕，触发的事件
        UI.on("ui:redraw", function(){
            UI.listenUI(UI._filter, "filter:change", "do_change_filter");
            UI.listenUI(UI._pager,  "pager:change",  "do_change_page");
            // UI.arena.find(".menu-item").first().click();
        });
    },
    //...............................................................
    do_change_page : function(pg){
        this.do_search(null, pg);
    },
    //...............................................................
    do_change_filter : function(cnd){
        this.do_search(cnd, null);
    },
    //...............................................................
    __check_obj_fld : function(key){
        var UI = this;
        var D = UI.$el.data("@DATA");
        //console.log("osearch.__check_obj_fld:", D.uiForm);
        // 找到 form 的配置 
        var conf = $z.loadResource(D[key]);
        if(!conf) {
            var eKey = "osearch.e.o_no_" + key;
            alert(UI.msg(eKey));
            throw eKey + ":\n" + $z.toJson(D);
        }
        return conf;
    },
    //...............................................................
    __mask_form : function(cmd){
        var UI = this;
        return _.extend({
            setup : {
                uiType : "ui/oform/oform",
                uiConf : _.extend(UI.__check_obj_fld("uiForm"), {
                    exec : UI.exec,
                    i18n : UI._msg_map,
                    actions : [{
                        text : "i18n:ok",
                        cmd  : cmd
                    },{
                        text : "i18n:cancel",
                        handler : function(){
                            console.log(this)
                            this.UI.parent.close();
                        }
                    }]
                }, UI.options.formConf)
            }
        }, UI.options.maskConf);
    },
    //...............................................................
    do_action_new : function(){
        var UI = this;
        var D = UI.$el.data("@DATA");
        var race = UI.options.new_race || 'FILE';
        new MaskUI(UI.__mask_form({
            command  : "obj id:"+D.id+" -new '<%=json%>' -o",
            complete : function(re){
                var obj = $z.fromJson(re);
                UI._list.addLast(obj);
                UI._list.resize();

                UI.trigger("menu:new", obj);
                $z.invoke(UI.options, "on_menu_new", [obj], UI);

                this.UI.parent.close();
            }
        })).render(function(){
            this.body.setData({});
        });
    },
    do_action_delete : function(){
        var UI = this;
        
        var objs = UI._list.getChecked();
        if(!(objs && objs.length>0)){
            var a_obj = UI._list.getActived();
            if(a_obj){
                objs = [a_obj];
            }
        }

        // 生成命令
        if(objs && objs.length > 0){
            var str = "";
            objs.forEach(function(obj){
                str += "rm -rf id:"+obj.id+"\n";
            });
            // 执行命令
            if(confirm(UI.msg("delwarn"))){
                UI.exec(str, function(){
                    UI.trigger("menu:del", objs);
                    $z.invoke(UI.options, "on_menu_del", [objs], UI);

                    UI.do_search();
                });
            }
        }
        // 警告
        else{
            alert(UI.msg("osearch.e.nochecked"));
        }
    },
    do_action_edit : function(){
        var UI = this;
        var obj = UI._list.getActived();
        if(!obj){
            alert(UI.msg("osearch.e.noactived"));
            return;
        }
        new MaskUI(UI.__mask_form({
            command  : "obj id:"+obj.id+" -u '<%=json%>'",
            complete : function(re){
                UI.do_search();
                UI._list.resize();
                this.UI.parent.close();
            }
        })).render(function(){
            this.body.setData(obj);
        });
    },
    do_action_refresh : function(){
        var UI = this;
        UI.do_search();
    },
    //...............................................................
    redraw : function(){
        var UI = this;
        UI.setup = {
            keys    : [],
            uiTypes : [],
            uiConfs : [],
            jqs     : []
        };
        __check_ui_part(UI, "filter");
        __check_ui_part(UI, "list");
        __check_ui_part(UI, "pager");

        // 加载控件
        seajs.use(UI.setup.uiTypes, function(){
            for(var index=0; index<arguments.length; index++){
                var SubUI = arguments[index];
                var conf = UI.setup.uiConfs[index];
                var jq = UI.setup.jqs[index];
                var key = UI.setup.keys[index];
                (function(index, uiType){
                    //console.log("osearch defer:", index, uiType);
                    var _ui = (new SubUI(conf));
                    UI["_"+key] = _ui;
                    _ui.render(function(){
                        UI.defer_report(index, uiType);
                    });
                })(index,UI.setup.uiTypes[index]);
            };
        });

        var deferUiTypes = [].concat(UI.setup.uiTypes);

        // 绘制动作按钮
        if(UI._draw_actions()){
            deferUiTypes.push("ui/menu/menu");
        }else{
            UI.arena.find(".osearch-actions").remove();
        }

        // 标识这是一次异步重绘
        return deferUiTypes;
    },
    //...............................................................
    _draw_actions : function(){
        var UI = this;
        if(_.isArray(UI.options.actions)){
            var menuC = {
                parent       : UI,
                gasketName   : "menu",
                setup        : []
            };
            UI.options.actions.forEach(function(mi){
                // 特殊的快捷按钮
                if(_.isString(mi)){
                    var qkey = mi;
                    var handler = UI["do_action_" + qkey];

                    // 回调必须是个函数啊
                    if(!_.isFunction(handler))
                        throw "!!! osearch: unknown mi handler: " + qkey;
                    
                    // 添加菜单配置项
                    menuC.setup.push({
                        type    : "button",
                        text    : "i18n:" + qkey,
                        handler : handler
                    });
                }
                // 其他
                else{
                    menuC.setup.push(mi);
                }
            });
            // 显示按钮 
            seajs.use("ui/menu/menu", function(UIMenu){
                new UIMenu(menuC).render(function(){
                    //console.log("osearch defer: ui/menu/menu");
                    UI.defer_report(UI.setup.uiTypes.length, "ui/menu/menu");
                });
            });
            // 返回 true，以便延迟加载
            return true;
        }
        return false;
    },
    //...............................................................
    resize : function(deep){
        var UI = this;
        var jSky = UI.arena.find(".osearch-sky");
        var jActions = jSky.children(".osearch-actions");
        var jFilter = jSky.children(".osearch-filter");

        var w_sky = jSky.width();

        // 没有 action
        if(jActions.size() == 0){
            jFilter.css("width", "100%");
            jSky.css("height", jFilter.outerHeight(true));
        }
        else {
            var w_action = jActions.outerWidth(true);
            var h_action = jActions.outerHeight();
            var w_action_inner = jActions.find(".menu").outerWidth();
            // if(!w_action){
            //     w_action = jActions.outerWidth(true);
            //     jActions.attr("org-width", w_action);
            //     jActions.attr("org-width-inner", jActions.children().outerWidth(true));
            //     jFilter.css("height", jActions.outerHeight());
            // }
            jFilter.css("height", h_action);
            
            // 太窄
            if(w_sky/2 < w_action_inner){
                var hh = jActions.outerHeight(true);
                var pad = jFilter.outerHeight(true) - jFilter.height();
                jSky.css("height", hh * 2 - (pad/2)).attr("narrow","true");
                jActions.css({
                    top:0
                });
                jFilter.css({
                    top: hh - (pad/2), width:w_sky
                });
            }
            // 并排
            else{
                var hh = jActions.outerHeight(true);
                var pad = jFilter.outerWidth(true) - jFilter.width();
                jSky.css("height", hh).removeAttr("narrow");
                jFilter.css({
                    top   : 0,
                    width : w_sky - w_action + (pad/2)
                }); 
            }
            // 确保被 resize
            if(UI._filter)
                UI._filter.resize();
        }
        

        // 计算中间部分的高度
        var jPager = UI.arena.children(".osearch-pager");
        var jList = UI.arena.children(".osearch-list");
        var lH = UI.arena.height() - jSky.outerHeight() - jPager.outerHeight();
        jList.css("height", lH);
    },
    //...............................................................
    getData : function(){
        var D = this.$el.data("@DATA");
        //console.log("osearch.getData:", D.uiForm)
        return D;
    },
    //...............................................................
    setData : function(D, callback){
        var UI = this;

        // 如果数据应该被忽略
        if($z.invoke(UI.options, "ignoreData", [D], UI)){
            return;
        }
        
        // 保存数据
        UI.$el.data("@DATA", D);

        //console.log("A osearch.setData:", D.uiForm)

        // 将数据丢掉过滤器里，并取出查询信息
        if(UI._filter){
            UI._filter.setData(D);

            //console.log("B osearch.setData:", D.uiForm)
            
            return UI.do_search(null, {
                skip : 0
            }, callback);
        }
    },
    //...............................................................
    refresh : function(){
        this.do_search();
    },
    //...............................................................
    getQuery : function(cnd, pg){
        var UI = this;
        cnd = cnd  || UI._filter.getData();
        pg  = pg   || UI.options.dftQuery;
        return _.extend({}, UI.options.dftQuery, cnd, pg);
    },
    //...............................................................
    do_search : function(cnd, pg, callback){
        var UI = this;

        // zozoh@20151026:
        // 推迟运行，以便确保界面都加载完毕了
        // 这个问题，现在只发现在版本帝 Firefox 41.0.2 上有， Chrome 上没问题
        //window.setTimeout(function(){
            var q = UI.getQuery(cnd, pg);
            console.log("do_search",q, pg)
            
            // 显示正在加载数据
            if(UI._list)
                UI._list.showLoading();

            // 组合成查询条件，执行查询
            $z.evalData(UI.options.data, q, function(re){
                // 将查询的结果分别设置到列表以及分页器里
                UI._list.setData(re ? re.list : []);
                UI._pager.setData(re? re.pager: {pn:0, pgnb:0, pgsz:0, nb:0, sum:0});
                UI.resize();

                // 触发事件回调
                UI.trigger("do:search", re);
                $z.invoke(UI.options, "on_do_search", [re], UI);

                // 回调
                if(_.isFunction(callback)){
                    callback.call(UI, re.list);
                }
            }, UI);
        //}, 0);

        // 返回自身
        return UI;
    }
    //..............................................
});
//==================================================
});
})(window.NutzUtil);