(function($z){
$z.declare('zui', function(ZUI){
//==============================================
var html = function(){/*
<div class="ui-arena"></div>
*/};
//==============================================
return ZUI.def("ui.olist", {
    dom  : $z.getFuncBodyAsStr(html.toString()),
    css  : "ui/olist/olist.css",
    init : function(options){
        $z.setUndefined(options, "fitparent", true);
        $z.setUndefined(options, "activable", true);
        $z.setUndefined(options, "blurable",  true);
        $z.setUndefined(options, "idKey",     "id");
        if(options.checkable === true) {
            options.checkable = {
                checked : "fa fa-check-square-o",
                normal  : "fa fa-square-o"
            };
        }

        // 准备列表的显示项
        options.text = options.text 
                       || (options.display
                             ? '<b>{{_display.nm}}</b>'
                             : '<b>{{nm}}</b>');
        // 准备 iconClass 的解析函数
        if(options.icon){
            if(_.isFunction(options.iconClass)){
                this._eval_icon_class = options.iconClass;
            }else if(_.isObject(options.iconClass)){
                this._eval_icon_class = function(o){
                    var key = this.options.iconClass.key;
                    var map = this.options.iconClass.map;
                    var dft = this.options.iconClass.dft;
                    var val = o[key];
                    return map[val] || dft;
                }
            }
        }
    },
    //...............................................................
    events : {
        "click .olist-item" : function(e){
            e.stopPropagation();
            this.setActived(e.currentTarget);
        },
        "click .olist-item [tp=checkbox]" : function(e){
            e.stopPropagation();
            this.toggle($(e.currentTarget).parent());
        },
        "click .ui-arena" : function(){
            if(this.options.blurable)
                this.blur();
        }
    },
    //...............................................................
    getActived : function(){
        return this.arena.find(".olist-item-actived").data("OBJ");
    },
    //...............................................................
    setActived : function(arg){
        var UI = this;
        if(!UI.options.activable)
            return;
        var jq = $z.jq(UI.arena, arg, ".olist-item").first();
        if(jq.hasClass("olist-item") && !jq.hasClass("olist-item-actived")){
            UI.blur();
            jq.addClass("olist-item-actived");
            var o = jq.data("OBJ");
            // 触发消息 
            UI.trigger("olist:actived", o);
            $z.invoke(UI.options, "on_actived", [o], UI);
        }
    },
    //...............................................................
    blur : function(){
        var UI = this;
        var jq = UI.arena.children(".olist-item-actived");

        if(jq.size() > 0){
            var o = jq.removeClass("olist-item-actived").data("OBJ");
            // 触发消息 
            UI.trigger("olist:blur", o);
            $z.invoke(UI.options, "on_blur", [o], UI);
        }
    },
    //...............................................................
    getChecked : function(){
        var UI = this;
        var objs = [];
        UI.arena.children(".olist-item-checked").each(function(){
            objs.push($(this).data("OBJ"));
        });
        return objs;
    },
    //...............................................................
    check : function(arg){
        var UI = this;
        var jq = $z.jq(UI.arena, arg, ".olist-item").not(".olist-item-checked");
        
        if(jq.size()>0){
            var objs = [];
            jq.addClass("olist-item-checked").each(function(){
                $(this).find("[tp=checkbox]")
                    .prop("className", UI.options.checkable.checked);
                objs.push($(this).data("OBJ"));
            });
            // 触发消息 
            UI.trigger("olist:checked", objs);
            $z.invoke(UI.options, "on_checked", [objs], UI);
        }
    },
    //...............................................................
    uncheck : function(arg){
        var UI = this;
        var jq = $z.jq(UI.arena, arg, ".olist-item-checked");
        console.log(jq.size())
        if(jq.size()>0){
            var objs = [];
            jq.removeClass("olist-item-checked").each(function(){
                $(this).find("[tp=checkbox]")
                    .prop("className", UI.options.checkable.normal);
                objs.push($(this).data("OBJ"));
            });
            // 触发消息 
            UI.trigger("olist:uncheck", objs);
            $z.invoke(UI.options, "on_uncheck", [objs], UI);
        }
    },
    //...............................................................
    toggle : function(arg){
        var UI = this;
        var jq = $z.jq(UI.arena, arg, ".olist-item");

        if(jq.size()>0){
            var checkeds = [];
            var unchecks = [];
            jq.each(function(){
                var o = $(this).data("OBJ");
                if($(this).hasClass("olist-item-checked")){
                    $(this)
                        .removeClass("olist-item-checked")
                        .find("[tp=checkbox]")
                            .prop("className", UI.options.checkable.normal);
                    unchecks.push(o);
                }else{
                    $(this)
                        .addClass("olist-item-checked")
                        .find("[tp=checkbox]")
                            .prop("className", UI.options.checkable.checked);
                    checkeds.push(o);
                }
            });
            // 触发消息 : checked
            if(checkeds.length > 0) {
                UI.trigger("olist:checked", checkeds);
                $z.invoke(UI.options, "on_checked", [checkeds], UI);    
            }
            // 触发消息 : uncheck
            if(unchecks.length > 0) {
                UI.trigger("olist:uncheck", unchecks);
                $z.invoke(UI.options, "on_uncheck", [unchecks], UI);    
            }
        }
    },
    //...............................................................
    getData : function(){
        var objs = [];
        this.arena.children('.olist-item').each(function(){
            objs.push($(this).data("OBJ"));
        });
    },
    //...............................................................
    setData : function(d, permanent, callback){
        var UI = this;
        if(_.isFunction(permanent)){
            callback = permanent;
            permanent = false;
        }
        if(permanent)
            UI.options.data = d;
        UI.refresh.call(UI, d, callback);
    },
    //...............................................................
    redraw : function(){
        var UI = this;
        UI.refresh(null, function(){
            UI.defer_report(0, "@DATA");
        });
        return UI.options.data ? ["@DATA"] : undefined;
    },
    //..............................................
    refresh : function(d, callback){
        var UI = this;
        $z.evalData(d || UI.options.data, null, function(objs){
            if(_.isFunction(UI.options.filter)){
                var list = [];
                objs.forEach(function(o){
                    o = UI.options.filter(o);
                    if(o)
                        list.push(o);
                });
                objs = list;
            }

            if(_.isFunction(UI.options.comparer)){
                objs.sort(UI.options.comparer);
            }

            UI._draw_data(objs);
            if(_.isFunction(callback)){
                callback.call(UI, objs);
            }
        }, UI);
    },
    //...............................................................
    _draw_data : function(objs){
        var UI = this;
        var idKey = UI.options.idKey;
        var iconFunc = UI.eval_tmpl_func(UI.options, "icon");
        var textFunc = UI.eval_tmpl_func(UI.options, "text");
        
        var checkable = UI.options.checkable;

        objs = _.isArray(objs) ? objs : [objs];

        UI.arena.empty();
        
        objs.forEach(function(o, index){
            var jq = $('<div class="olist-item">').appendTo(UI.arena);
            jq.attr("index", index);
            if(o[idKey])
                jq.attr("oid", o[idKey]);

            if(checkable){
                jq.append('<i class="' + checkable.normal + '" tp="checkbox">');
            }

            // 分析 icon
            if(UI._eval_icon_class){
                o['_icon_class'] = UI._eval_icon_class(o) || "";
            }
            var iconHtml = iconFunc ? $(iconFunc(o)) : null;
            if(iconHtml)
                $(iconHtml).attr("tp","icon").appendTo(jq);
            
            // 解析列表项内容
            UI.eval_obj_display(o, UI.options.display);
            if(textFunc)
                jq.append($(textFunc(o)));
            // 记录数据
            jq.data("OBJ", o);
        });
        // 最后触发消息
        UI.trigger("olist:change", objs);
        $z.invoke(UI.options, "on_change", [objs], UI);
    },
    //..............................................
    resize : function(){
    }
    //..............................................
});
//==================================================
});
})(window.NutzUtil);