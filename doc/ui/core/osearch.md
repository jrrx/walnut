---
title: 对象搜索器
author:zozoh
---

# 控件概述

`osearch` 提供了对数据搜索和翻页的功能。对于数据的列表显示，它委托给一个能支持列表的控件。

```
+-------------------------------------------+
| V | Btns   |            Seach Condition   |
+-------------------------------------------+
|  _______________________________________  |
|  _______________________________________  |
|  _______________________________________  |
|  ______________ Date List ______________  |
|  _______________________________________  |
|  _______________________________________  |
|  _______________________________________  |
|  _______________________________________  |
|  _______________________________________  |
+-------------------------------------------+
|                    Pager                  |
+-------------------------------------------+
```

# 如何创建实例

```
new UIOSearch({
    $pel  : $(document.body),

    // 如果可多选，你这么搜索的结果应该支持复选框
    // 并且顶部左上的搜索区域，应该有 -全-无-反- 三个快捷操作
    // 默认为参考自身的 list.uiConf.checkable 配置
    checkable : Boolean,

    // 是否支持更多的操作
    //  - 支持快捷按钮配置字符串 "new", "delete", "edit", "refresh"
    // 具体配置信息 @see menu 控件
    actions : ["new","delete","edit"]

    // 搜索条件的 UI，它必须: 
    //  - 支持 get/setData 以便存取搜索条件
    //  - 搜索条件对象必须是一个普通对象
    //  - 支持消息 "filter:change"(fo)
    filter : {..}

    // 如何获取数据
    // 但是由于搜索条件是来自控件本身，那么这个条件的格式是固定的:
    /*
    q = {
        // 以下来自 pager 控件
        pn   : 1     // 请求第几个数据页，1 base, 0 表示全部数据，不分页
        pgsz : 50    // 每页的数据大小
        off  : 0     // 这个值就相当于 (pn-1)*pgsz 

        // 以下来自 filter 控件
        condition : "{..}"   // 一个 JSON 字符串表示的查询条件 
        sort      : "{..}"   // 一个 JSON 字符串表示的字段排序
    }
    */
    // 因此自定义函数，命令模板，或者 ajax 请求，都需要主动适配这个搜索条件
    // 获取得到的结果也必须符合格式:
    /*
    re = {
        pager : {         // 翻页信息
            pn   : 1,     // 第几页
            pgsz : 10,    // 每页多少数据
            pgnb : 4,     // 一共多少页
            sum  : 32,    // 一共多少记录
            skip : 0,     // 跳过了多少数据
            nb   : 10     // 本页实际获取了多少数据
        }
        list  : [..]                 // 一组数据对象，用来列表显示
    }
    */
    data : F(q,callback(re))         // 根据给定的函数
           |'obj * {{pn}}'       // 指定命令模板，需要 exec
           | {url:..}            // 发送 Ajax 请求
    exec : Wn.exec               // 指明执行器，给 search 用的

    // 列表展示的 UI，它必须: 
    //  - 支持 get/setData 以便存取数据
    //  - 支持 check/uncheck/toggle 操作
    //  - 支持 checkable 配置
    list : {..}

    // 翻页器的 UI，它必须:
    //  - 支持 get/setData 以便存取翻页信息
    //  - 翻页信息对象格式为 {pn:1, pgsz:50, pgnb: 6, sum:289}
    //  - 支持消息 "pager:change"(pg)
    pager : {..}
    

}).render();
```

# 控件方法

.. 以后再添加 ..


