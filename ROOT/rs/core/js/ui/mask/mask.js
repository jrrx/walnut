(function($z){
$z.declare('zui', function(ZUI){
//==============================================
var html = function(){/*
<div class="ui-arena" ui-fitparent="yes">
    <div class="ui-mask-bg"></div>
    <div class="ui-mask-main" ui-gasket="main"></div>
    <div class="ui-mask-closer"><i class="fa fa-close"></i></div>
</div>
*/};
//===================================================================
return ZUI.def("ui.mask", {
    //...............................................................
    dom  : $z.getFuncBodyAsStr(html.toString()),
    css  : "theme/ui/mask/mask.css",
    //...............................................................
    init : function(options){
        $z.setUndefined(options, "width", 0.618);
        $z.setUndefined(options, "height", 0.618);
    },
    //...............................................................
    redraw : function() {
        var UI = this;
        var options = this.options;

        // 禁止拖拽
        UI.$el.on("dragover", ".ui-mask-bg", function(e){
            e.stopPropagation();
            e.preventDefault();
        });
        UI.$el.on("drop", ".ui-mask-bg", function(e){
            e.stopPropagation();
            e.preventDefault();
        });

        // 标记界面其他元素，以便通过 CSS 将其设成半透明
        // TODO zozoh: 靠 webkit 这里有 bug，一旦页面有了 input type=color，
        // 设置了 opactiy，整个页面元素就全不显示了，
        // 那么这种情下就先不加了，之后再找找为啥，应该是浏览器的 bug
        // 记录一下三个浏览器的 UserAgent
        /*
        Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:43.0) Gecko/20100101 Firefox/43.0
        Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/601.4.4 (KHTML, like Gecko) Version/9.0.3 Safari/601.4.4
        Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36
        */
        if(/AppleWebKit/i.test(window.navigator.userAgent)
            && $(document.body).find('input[type="color"]').size()>0){
            // webkit 在 input type=color 的时候，设置 opactiy，只要小于 1 就全隐藏，靠
            // 不知道为毛
        }
        else{
            UI.$el.prevAll().addClass("ui-mask-others");
        }

        // 记录主区域
        UI.$main = UI.arena.children(".ui-mask-main");
        if(options.closer === false) {
            this.arena.find(".ui-mask-closer").hide();
        }
        if(!(options.escape === false)) {
            this.watchKey(27, function(e){
                this.close();
            });
        }
        // 如果声明了主体 UI
        var uiType = (options.setup||{}).uiType;
        if(uiType){
            var uiConf = _.extend({}, options.setup.uiConf, {
                parent     : UI,
                gasketName : "main"
            });
            // 建立 UI 并记录实例到自己的属性
            seajs.use(uiType, function(BodyUI){
                UI.body = new BodyUI(uiConf).render(function(){
                    UI.defer_report(0, uiType);
                });
            });
            return [uiType];
        }
    },
    //...............................................................
    events : {
        "click .ui-mask-closer" : function(e){
            this.close();
        }
    },
    //...............................................................
    resize : function(){
        var UI = this;
        var winsz = $z.winsz();
        var W = winsz.width;
        var H = winsz.height;
        //console.log(W,H)
        // 计算主区域的宽高和位置
        var uoW = UI.options.width;
        var uoH = UI.options.height;

        var mW, mH;
        // 高度先计算
        if(_.isString(uoH) || parseInt(uoH) == uoH){
            mH = $z.dimension(UI.options.height, H);
            var _n = UI.options.width;
            mW = $z.dimension(_n, _.isString(_n) ? W : mH)
        }
        // 那就一定是宽度先计算咯
        else{
            mW = $z.dimension(UI.options.width, W)
            var _n = UI.options.height;
            mH = $z.dimension(_n, _.isString(_n) ? H : mW);
        }

        var mL = (W-mW)/2
        var mT = (H-mH)*0.382;
        UI.$main.css({
            "width" : mW,
            "height": mH,
            "left"  : mL,
            "top"   : mT,
        });
        var jCloser = UI.arena.find(".ui-mask-closer");
        var iR = Math.max(0, mL - jCloser.width()/2);
        var iT = Math.max(0, mT - jCloser.height()/2);
        jCloser.css({
            "right": iR, "top" : iT
        });
        if(UI.options.resize){
            UI.options.resize.call(UI, mW, mH);
        }
    },
    //...............................................................
    depose : function(){
        // 将之前的对象的半透明度，都设置回来
        this.$el.prevAll().removeClass("ui-mask-others");
    },
    //...............................................................
    close : function(){
        var UI = this;
        // 最后触发消息
        UI.trigger("mask:close", UI._body);
        $z.invoke(UI.options, "on_close", [UI._body], UI);
        // 实现销毁
        this.destroy();
    }
});
//===================================================================
});
})(window.NutzUtil);