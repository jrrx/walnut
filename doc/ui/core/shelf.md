---
title:Shelf控件
author:zozoh
---

# 控件概述

Shelf 提供了一个较通用的富客户端界面的布局方式。 它假想你会这么布局你的客户端

```
+-------------------------------------------------------+
|                         sky                           |
+----------++-------------------------------++----------+
|          ||                               ||          |
|          ||                               ||          |
|   chute  ||            main               ||   view   |
|          ||                               ||          |
|          ||                               ||          |
|          ||                               ||          |
+----------++-------------------------------++----------+
|                       footer                          |
+-------------------------------------------------------+
```

* 其中，除了 main 区域其他都是可选的
* 竖排的三列都可以调整宽度

# 如何创建实例

```
new UIShelf({
    $pel: $(document.body),
    fitparent: true,
    // 控件整体的布局配置信息
    resizable : true | false,  // 列能不能改变
    localKey  : "..",          // 显示的信息如何保存到本地, 没声明就不保存
    // 定义了各个区域的尺寸和如何显示，如果定义了 locakKey 这个对象会被整体保存到用户本地
    // 对于 chute|main|view 这三个区域，值声明为 '*' 则表示均分剩下的宽度 
    // 同时也支持百分比
    display : {
        sky  : 120,   
        chute  : 300,
        main   : "*",
        view   : "20%",
        footer : 100
    }
    // 下面是各个区域的配置，如果某个区域未定义，则不显示该区域
    sky    : {..},
    chute  : {..},
    main   : {..},
    view   : {..},
    footer : {..}
}).render();
```

# 控件区域的配置

```
{
    uiType  : "name/to/ui",
    uiConf  : {
        // 这个就是对应 UI 的配置
        // 只是会无视 $pel 和 fitparent 等通用配置参数
    }
}
```


