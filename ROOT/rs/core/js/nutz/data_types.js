/*
normalize(fld)     // 整理 fld，预先处理一下一些字段
asEdit(fld,_v)     // 让值变成易于编辑的字符串
asValue(fld,_v)    // 让值变成对象真正的值，可以用来保存到后台的
test(fld,v)        // 将任何值变成本类型的标准值，并返回，如果出错，则抛错
*/
define(function (require, exports, module) {
//==================================================
function _E(code, fld, val) {
    return {
        code : code,
        fld  : {
            key   : fld.key,
            type  : fld.type
        },
        val  : val
    };
}

function enum_test(fld, v){
    var re = null;
    for(var i=0; i<fld.setup.value.length; i++) {
        var item = fld.setup.value[i];
        if(v == item.val || v == item.text){
            return {
                val  : item.val,
                text : item.text 
            };
        }else if (fld.dft == item.val || fld.dft == item.text){
            re = {
                val  : item.val,
                text : item.text 
            };
        }
    }
    //throw _E("i18n:e.fld.invalid.enum",fld,v);
    if(!re)
        return _.extend({}, fld.setup.value[0]);
    return re;
}
//==================================================
module.exports = {
    //......................................
    "object" : {
        defaultEditAs : "text",
        normalize : function(fld){},
        asEdit : function(fld, obj){
            return obj;
        },
        asValue : function(fld, obj){
            return obj;
        },
        test : function(fld, v){
            // DOM
            if(_.isElement(v) || $z.isjQuery(v)){
                return $(v)[0].outerHTML;
            }
            // 字符串要变 JSON
            else if(_.isString(v)){
                return $z.fromJson(v);
            }
            // 其他的直接返回就好
            return v;
        }
    },
    //......................................
    "string" : {
        defaultEditAs : "input",
        normalize : function(fld){
            $z.setUndefined(fld, "setup", {});
        },
        asEdit : function(fld, str){
            return str;
        },
        asValue : function(fld, str){
            return str;
        },
        test : function(fld, v){
            if(_.isUndefined(v) || _.isNull(v)){
                return fld.dft;
            }
            v = "" + v;
            if(_.isRegExp(fld.setup.validate)){
                var regex = new RegExp(fld.setup.validate);
                if(!regex.test(v)){
                    throw _E("i18n:e.fld.invalid.string",fld,v);
                }
            }
            return v || fld.dft;
        }
    },
    //......................................
    "daterange" : {
        defaultEditAs : "daterange",
        normalize : function(fld){
            $z.setUndefined(fld, "setup", {});
            if(_.isString(fld.setup)){
                fld.setup = {format : fld.setup};
            }
            else{
                $z.setUndefined(fld.setup, "format", "yyyy-mm-dd");
            }
        },
        asEdit : function(fld, dr){
            var re = [];
            for(var i=0;i<dr.length;i++){
                re.push(dr[i].format(fld.setup.format));
            }
            return re;
        },
        asValue : function(fld, dr){
            var re = [];
            for(var i=0;i<dr.length;i++){
                re.push(dr[i].format(fld.setup.format));
            }
            return re;
        },
        test : function(fld, v){
            if(_.isString(v)){
                v = $.trim(v).split(",");
            }
            if(!v)
                v = fld.dft;
            if(!v)
                return null;
            //console.log("fld test : ", fld.key, ":["+v+"]", "test:", (v?true:false));
            for(var i=0;i<v.length;i++){
                var item = v[i];
                if(_.isString(item)){
                    v[i] = $z.parseDate($.trim(item), fld.setup.validate);
                } else {
                    v[i] = $z.parseDate(v[i]);
                }
            }
            return v;
        }
    },
    //......................................
    "datetime" : {
        defaultEditAs : "input",
        normalize : function(fld){
            $z.setUndefined(fld, "setup", {});
            if(_.isString(fld.setup)){
                fld.setup = {format : fld.setup};
            }
            else{
                $z.setUndefined(fld.setup, "format", "yyyy-mm-dd");
            }
            // if(_.isString(fld.setup.validate)){
            //     fld.setup.validate = new RegExp(fld.setup.validate);
            // }
            // else if(_.isUndefined(fld.setup.validate)){
            //     fld.setup.validate = /^(\d{4})-(\d{2})-(\d{2})$/;
            // }
        },
        asEdit : function(fld, d){
            return d ? d.format(fld.setup.format) : "";
        },
        asValue : function(fld, d){
            return d ? d.format(fld.setup.format) : null;
        },
        test : function(fld, v){
            if(_.isString(v)){
                v = $.trim(v);
            }
            if(!v)
                v = fld.dft;
            if(!v)
                return null;
            //console.log("fld test : ", fld.key, ":["+v+"]", "test:", (v?true:false));
            return $z.parseDate(v, fld.setup.validate);
        }
    },
    //......................................
    "time" : {
        defaultEditAs : "input",
        normalize : function(fld){
            $z.setUndefined(fld, "setup", {});
            $z.setUndefined(fld.setup, "format", "@min");
            if(_.isString(fld.setup.validate)){
                fld.setup.validate = new RegExp(fld.validate);
            }
            else if(_.isUndefined(fld.setup.validate)){
                if("@min" == fld.setup.format){
                    fld.setup.validate = /^(\d{1,2}):(\d{1,2})$/;
                }
                else{
                    fld.setup.validate = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
                }
            }
        },
        asEdit : function(fld, _t){
            if("@min" == fld.setup.format)
                return _t.key_min;
            return _t.key;
        },
        asValue : function(fld, _t){
            return _t.sec;
        },
        test : function(fld, v){
            return $z.parseTime(v, fld.setup.validate);
        }
    },
    //......................................
    "int" : {
        defaultEditAs : "input",
        normalize : function(fld){
            if(!_.isNumber(fld.dft)){
                fld.dft = parseInt(fld.dft);
                if(isNaN(fld.dft))
                    fld.dft = -1;
            }
        },
        asEdit : function(fld, n){
            return isNaN(n) ? fld.dft : n;
        },
        asValue : function(fld, n){
            return isNaN(n) ? fld.dft : n;
        },
        test : function(fld, v){
            return parseInt(v);
        }
    },
    //......................................
    /*
    @see enum
    */
    "boolean" : {
        defaultEditAs : "switchs",
        normalize : function(fld){
            var UI = this;
            $z.setUndefined(fld, "setup", {
                value : [{text:"i18n:no",val:false},{text:"i18n:yes",val:true}]
            });
            // 可以是数组，那么 0 表示 false, 1 表示 true
            // 假想数组的格式为 ["no","yes"]
            if(_.isArray(fld.setup)){
                var values = [];
                for(var i=0; i<2; i++){
                    var se = fld.setup[i];
                    if(_.isString(se)) {
                        values[i] = {
                            text : UI.text(se),
                            val  : (i==1)
                        }
                    }
                    else {
                        values[i] = {
                            text : se.text || (i==0?"i18n:no":"i18n:yes"),
                            val  : se.val || (i==0?false:true)
                        }
                    }
                }
                fld.setup = { value : values };  
            }
        },
        asEdit : function(fld, en){
            return en.text;
        },
        asValue : function(fld, en){
            return en.val;
        },
        test : function(fld, v){
            if(_.isUndefined(v))
                return fld.setup.value[0];
            if(_.isString(v)){
                var i =  /^yes|on|true$/i.test(v) ? 1 : 0;
                return fld.setup.value[i];
            }
            return fld.setup.value[ v ? 1:0];
        }
    },
    //......................................
    /*
    标准配置结构为:
    {
        value : [{text:'xxx', val:0}, {text:'xxxx', val:1}]
    }
    */
    "enum" : {
        defaultEditAs : "switchs",
        normalize : function(fld){
            $z.setUndefined(fld.setup, "value", {value:[]});
            var value = {};
            // 整理数组
            if(_.isArray(fld.setup)){
                var values = [];
                fld.setup.forEach(function(v, index){
                    values[index] = _.isObject(v) ? v : {text:v, val:index};
                });
                fld.setup = {value:values};
            }
        },
        asEdit : function(fld, en){
            return en.text;
        },
        asValue : function(fld, en){
            return en.val;
        },
        test : function(fld, v){
            return enum_test(fld, v);
        }
    },
    //......................................
    /*
    标准配置结构为:
    {
        data    : ...  // 同步函数或者数组
        _list   : ...  // 缓存所有备选数据
        key_txt : "txt",
        key_val : "val"
    }
    */
    "array" : {
        defaultEditAs : "multiselectbox",
        normalize : function(fld){
            $z.setUndefined(fld, "setup", {});
            if(!fld.setup.data)
                throw "fld '"+fld.key+"' not setup.data";
            $z.setUndefined(fld.setup, "key_txt", "txt");
            $z.setUndefined(fld.setup, "key_val", "val");
        },
        asEdit : function(fld, en){
            var ss = [];

            en.forEach(function(v){
                ss.push(fld._val_map[v]);
            });

            return ss.join(", ");
        },
        asValue : function(fld, en){
            return en;
        },
        test : function(fld, v){
            var UI = this;

            // 读取数据 
            if(!fld._list){
                var list;
                // 如果是字符串，那就是命令，要缓存一下结果
                if(_.isString(fld.setup.data)){
                    var jBody = $(document.body);
                    var cache = jBody.data("@multiselectbox");
                    if(!cache){
                        cache = {};
                        jBody.data("@multiselectbox", cache);
                    }
                    list = cache[fld.setup.data];
                    if(!list){
                        list = $z.evalData(fld.setup.data, null, UI);
                        cache[fld.setup.data] = list;
                    }
                }
                // 其他的，转换一下
                else{
                    list = $z.evalData(fld.setup.data, null, UI);
                }

                if(!list){
                    list = [];
                }
                else if(!_.isArray(list)){
                    list = [list];
                }

                // 缓存一下，以便显示控件等能得到数据
                fld._list = list;

                // 生成  val map
                fld._val_map = {};
                list.forEach(function(v){
                    fld._val_map[v[fld.setup.key_val]] = v[fld.setup.key_txt];
                });
            }

            if(!v){
                return [];
            }
            if(_.isString(v)){
                return v.split("/[ \t]*[,;，][ \t]*/");
            }
            else if(!_.isArray(v)){
                return [v];
            }
            return v;
        }
    }
};
//==================================================
});