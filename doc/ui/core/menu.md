---
title:菜单控件
author:zozoh
---

# 控件概述

创建多级菜单 

# 如何创建实例

```
new UIMenu({
    // 给定一个数组，说明菜单如何布局，每个数组项目都是一个菜单项
    // 如果给的不是数组，则会被数组包裹
    setup   : [..]
    
    // 如果这个菜单是鼠标显示的上下文菜单，那么需要给定一个选项
    // 说明这个菜单需要显示的位置，这个位置相对于 body 的。
    // 并且，控件会自动检测 body 的点击事件，和 escape 键盘事件
    // 随时释放自己的显示
    position : {
        x : $pageX,  y : $pageY
    }
    
    // 提示信息的展出方向，up|down|left|right
    // 默认 down
    tipDirection : "down"
    
    // 指明每个菜单项被调用的时候，函数的上下文是什么，默认为菜单控件的父视图
    // 如果没有父视图，则用自身
    context : parent
}).render();
```

# 菜单项的数据结构

```
{
    key     : "xxx",        // 菜单项的标识名
    text    : "i18n:xxx",   // 动作的显示名称
    icon    : HTML,         // ICON 可选，为一段 HTML
    type    : "xxx"         // 动作的类型 "button|status|group|separator"
    // 动作显示的时候，可以执行初始化函数，根据外部数据动态修改自身的配置
    // 这个函数会在开始绘制之前调用，你完全可以通过这个函数将菜单项改成任意的类型
    // 参数 mi - 就是菜单项对象本身，函数可以对其进行任意修改
    init    : {context}F(mi);
    
    // 如果 type=="status"，那么下面就是这个枚举的详细信息
    // 当枚举类型值被改变后，会触发事件(前提是 context 支持 trigger 函数)
    // context.trigger("menu:$key?'status'", val)
    status : [{             // 如果是枚举
        text : "i18n:xxx",  // 每个枚举项目的显示文字
        icon : HTML,        // 显示的图标
        val  : "xxx",       // 对应的值
        on   : false        // 表示菜单项是否是选中状态
                            // 如果多个 on，实际上只有第一个生效
    },{..}..],


    // 如果 type="button"，那么这个按钮的执行操作就是一个函数
    handler  : {context}F($ele, a);
    
    // 如果 type="group"，那么会展现出一个二级菜单
    // 为了动态加载的便利，items 也可以是一个函数 {context}F($ele, a, callback)
    // 函数在计算完毕后，必须主动调用 callback 以便显示
    // callback 的格式循是 callback(items)
    items : [{..菜单项..}, {..菜单项..}}]
}
```

# 菜单项:按钮

```
{
    type    : "button"          // 类型
    handler : {c}F($jq, e)      // 菜单项的回调
    context : undefined         // 菜单项回调时，特殊的调用上下文，默认采用全局配置
}
```

* 如果没写 `type`，那么如果主要判断 `handle` 段是不是一个函数

# 菜单项:命令组

```
{
    type   : "group"         // 类型
    items  : [..]            // 子菜单项，命令组可以层层嵌套
}
```

* 如果没写 `type`，那么主要判断 `items` 段是不是一个数组

# 菜单项:状态按钮

```
{
    type   : "status"          // 类型
    init    : {context}F(mi)   // 初始化枚举选项 
    status   : [..]            // 枚举选项
}
```

* 如果没写 `type`，那么主要判断 `status` 段是不是一个数组

# 菜单项:分隔线

```
{type : "separator"}
```

* 如果没写 `type`，你直接写个空对象也成，比如 `{}`

