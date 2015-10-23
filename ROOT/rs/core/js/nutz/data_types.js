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

function tPad(n){
    return n>9 ? n : "0"+n;
}

function enum_test(fld, v){
    for(var i=0; i<fld.setup.value.length; i++) {
        var item = fld.setup.value[i];
        if(v == item.val || v == item.text){
            return {
                val  : item.val,
                text : item.text 
            };
        }
    }
    throw _E("i18n:e.fld.invalid.enum",fld,v);
}
//==================================================
module.exports = {
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
            if(_.isString(fld.setup.validate)){
                fld.setup.validate = new RegExp(fld.setup.validate, "g");
            }
            else if(_.isUndefined(fld.setup.validate)){
                fld.setupvalidate = /^(\d{4})-(\d{2})-(\d{2})$/g;
            }
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
                return null;
            //console.log("fld test : ", fld.key, ":["+v+"]", "test:", (v?true:false));
            var d;
            // 数字则表示绝对毫秒数
            if(_.isNumber(v)){
                d = new Date();
                d.setTime(v);
                return d;
            }
            // 否则当做字符串
            var regex = new RegExp(fld.setup.validate);
            var m = regex.exec(v);
            // 格式正确
            if(m && m.length>=4){
                var d;
                // 仅仅是日期
                if(m.length == 4){
                    d = new Date(m[1]*1, m[2]*1-1, m[3]*1);
                }
                // 精确到分
                else if(m.length == 6){
                    d = new Date(m[1]*1, m[2]*1-1, m[3]*1, m[4]*1, m[5]*1, 0);
                }
                // 精确到秒
                else if(m.length == 6){
                    d = new Date(m[1]*1, m[2]*1-1, m[3]*1, m[4]*1, m[5]*1, m[6]*1);
                }
                return d;
            }
            // 未通过校验，抛错
            throw _E("i18n:e.fld.invalid.datetime",fld,v);
        }
    },
    //......................................
    "time" : {
        defaultEditAs : "input",
        normalize : function(fld){
            $z.setUndefined(fld, "setup", {});
            $z.setUndefined(fld.setup, "format", "@min");
            if(_.isString(fld.setup.validate)){
                fld.setup.validate = new RegExp(fld.validate, "g");
            }
            else if(_.isUndefined(fld.setup.validate)){
                if("@min" == fld.setup.format){
                    fld.setup.validate = /^(\d{1,2}):(\d{1,2})$/g;
                }
                else{
                    fld.setup.validate = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/g;
                }
            }
        },
        asEdit : function(fld, _t){
            if("@min" == fld.setup.format)
                return tPad(_t.HH)+":"+tPad(_t.MM);
            return tPad(_t.HH)+":"+tPad(_t.MM)+":"+tPad(_t.ss);
        },
        asValue : function(fld, _t){
            return _t.sec;
        },
        test : function(fld, v){
            // 会解析成这个时间对象
            var _t = {};
            // 数字则表示绝对秒数
            if(_.isNumber(v)){
                var n = parseInt(v);
                _t.HH = parseInt(n / 3600);
                n -= _t.HH * 3600;
                _t.MM = parseInt((n - _t.HH) / 60);
                _t.ss = n - _t.MM * 60;
            }
            // 否则当做字符串
            else{
                var regex = new RegExp(fld.setup.validate);
                var m = regex.exec(v);
                // 格式正确
                if(m){
                    var d;
                    // 仅仅是到分
                    if(m.length == 3){
                        _t.HH = m[1] * 1;
                        _t.MM = m[2] * 1;
                        _t.ss = 0;
                    }
                    // 精确到秒
                    else if(m.length == 4){
                        _t.HH = m[1] * 1;
                        _t.MM = m[2] * 1;
                        _t.ss = m[3] * 1;
                    }
                }
                // 未通过校验，抛错
                else{
                    throw _E("i18n:e.fld.invalid.time",fld,v);
                }
            }
            _t.sec = _t.HH * 3600 + _t.MM*60 + _t.ss;
            // 返回
            return _t;
        }
    },
    //......................................
    "int" : {
        defaultEditAs : "input",
        normalize : function(fld){

        },
        asEdit : function(fld, n){
            return n;
        },
        asValue : function(fld, n){
            return n;
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
            console.log(fld)
            if(_.isUndefined(v))
                return fld.setup.value[0];
            if(_.isString(v)){
                var i =  /^yes|on|true$/gi.test(v) ? 1 : 0;
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
    }
};
//==================================================
});