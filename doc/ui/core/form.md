---
title: 表单控件
author:zozoh
---

# 控件概述

表单控件将根据配置信息，创建一个对象表单。以及维护这个表单的保存行为

# 如何创建实例

```
new FormUI({
    // 默认的，控件将调用者通过 setData(o) 传入的对象 o 存储，当 getData 的时候
    // 控件将 o 与最新的编辑信息合并，返回给调用者
    // 如果希望 getData 返回一个新对象，那么将这个属性设置为 false
    mergeData  : true
    
    // setData 前的预处理
    parseData  : {c}F(o):obj
    
    // getData 后的后续处理
    formatData : {c}F(o):obj
    
    // 指明对象哪个字段是 ID，默认为 "id"
    //  - ID 字段如果在 fields 里，则它不可编辑
    //  - 如果 mergeData==true，那么至少会保留源对象的 ID 字段，如果它有的话
    idKey : "id"

    // 表单可以指定一个标题，你可以随意写一段 HTML
    // 如果未定义，标题将不显示
    title : HTML
    
    // 表单的字段列表
    fields : [..]

    // 默认一行可以容纳多少组
    cols : 1
    
    // 默认的，每个组编辑区字段应该占有的宽度
    // 如果是个浮点数，则表示百分比（相对 .ff-val)
    // 如果是整数，则表示一个绝对的像素
    // 如果值为 "auto" 则表示自动适合控件的最小宽度
    // 当然，前提是控件有最小宽度
    // 如果为 "all" 则表示撑满行
    // 默认为 "auto"
    uiWidth : 0.3
    
    //............................................................
    // 事件
    on_change  : {c}F(key, val)      // "form:change" 字段有修改

}).render();
```



# 表单的字段

## 普通字段

```
{
   // 有 key 就是普通字段
   key      : "nm"          // 字段对应的对象键
   icon     : HTML          // 字段的图标
   text     : "i18n:xxx"    // 字段的标题
   tip      : "i18n:xxx"    // 字段的提示说明
   required : Boolean       // 字段是否必须
   className : "XXXX"       // 指定特殊的类选择器
   
   // 如果为 true 则会自动将文字区设置行高，并将 padding-top/bottom 归零
   autoLineHeight : false
   
   // 控件跨越的编辑区，如果一行只有1列，那么写多大都相当于1
   span     : 1
   
   // 字段编辑区宽度，与全局意义相当
   uiWidth  : 0.3
   
   type     : "string"      // @see jtypes.js
   editAs   : "input"       // 快捷的编辑控件类型
   uiType   : "xxxx"        // 编辑控件类型，比 editAs 优先
   uiConf   : {..}          // 编辑控件的配置信息
}
```

## 字段分组

```
{
   icon     : HTML          // 字段的图标
   text     : "i18n:xxx"    // 字段的标题
   tip      : "i18n:xxx"    // 字段的提示说明
   className : "XXXX"       // 指定特殊的类选择器
   
   // 如果为 true 则会自动将文字区设置行高，并将 padding-top/bottom 归零
   // 组内字段默认采用这个设置
   autoLineHeight : false
   
   // 本组内，一行有多少列字段，默认1
   cols     : 1
   
   // 一个数组表示每列字段的宽度，
   //  - 没有的项目当做 0
   //  - 0 表示平均分配
   //  - 0.5 小于1的浮点表示比例
   //  - 322 大于 1 的数表示绝对大小
   colSizeHint : [0]
   
   // 字段编辑区宽度，与全局意义相当
   uiWidth  : 0.3
   
   // 如果为 true，那么每个字段都有一个开关，显示表示自己在 getData 的时候是否要被忽略
   asTemplate : false,

   // 本组内的字段 
   fields   : [..]
}
```

* 没有 *key* 就是字段组
* 每当遇到一个字段组，就重新开始一组控件
* 字段组不能被嵌套

# 控件方法

## getData

```
// 返回控件正在编辑的表单数据
var o = oform.getData();
```

## setData

```
// 为控件设置数据以便展示编辑界面
oform.setData(o);
```









