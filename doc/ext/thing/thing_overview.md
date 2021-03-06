---
title:任何东西都是 Thing
author:zozoh
tags:
- 系统
- 扩展
- thing
---

# 什么是 thing

Walnut 的 `WnObj` 是对所有的数据进行的最高级的抽象。 因为抽象层次较高，所有无法围绕它进行更多的组件和命令编写。 

`thing` 就是任何东西。 它通过一组 *WnObj* 的组合，描述了以下但不限于:

* 论坛版块
* 论坛贴士
* 商品
* 订单
* 货品
* 等等

你可以认为任何一个目录下面，都存放了一组（可能是海量）的 *thing*，通常它的目录结构为:

```
# 带有 thing 元数据的目录被认为是一个 ThingSet
@DIR {thing:"xxxx"}   # 集合内每个 Thing 的物品种类名称，支持 i18n:xxx 形式
    thing_init        # 初始化配置，是 app-init 支持的配置文件格式
    thing.json        # 每个 Thing 的定义
    cate              # ［选］表示 Thing 的分类
        cateA         # 每个分类就是一个子目录
            cateAA    # 分类可以无限嵌套
        cateB         # 可以有无限多的分类
    data              # 集合内全部的数据
        $ThingID           # 每个子目录就是一个 thing
            detail         # 详情文件，其 tp 可以是 "md|txt|html"
            photos         # 相关的一组照片
            attachments    # 相关的一组附件
            comments       # 每个 thing 都可能有评论信息，信息可以是 md,html,txt
                20150721132134321     # 一个注释一个文件
``` 

我们认为:

* Thing 没有子
* 基于约定，通过文件和目录，可以描述世间万物

# ThingSet

```
thing  : "i18n:xxx"   // 标识了东西的名称
//...........................................
icon  : HTML     // 小图标
thumb : ID       // 缩略图ID  @see 缩略图机制
//...........................................
th_icon  : HTML  // Thing 的默认图标
th_thumb : ID    // Thing 的默认缩略图
//...........................................
```

* 标识了元数据 `thing` 的目录就是 *ThingSet*

# thing.json

```
{
     name : "xxx",         // 东东的类型名称
     text : "i18n:xxx".    // 东东的多国语言显示
     icon : "<...>",       // 东东的图标 HTML
     
     // 物品的字段，这个遵守 ui/form/form 控件的 field 字段定义规范
     fields : [...]
}
```

# Thing

```
nm    : ID       // 与自己的id字段相同，无意义，你可以随意修改，只不过 ls 的时候好看
tp    : "thing"  // 目录类型表示是个 Thing
lbls  : ["xx"]   // 标签
ct    : MS       // 创建时间
lm    : MS       // 最后修改时间
//...........................................
icon  : HTML     // 小图标，如果没有，默认用 ThingSet.th_icon
thumb : ID       // 缩略图ID  @see 缩略图机制，如果没有，默认用 ThingSet.th_thumb
//...........................................
th_ow     : "xxx"   // 所属者，通常表示 dusr 指定的账号系统，默认null
th_nm     : "xxx"   // 东西的名称
th_breif  : "xxx"   // 东西的简单文本介绍，用作详细列表显示
th_live   : 1       // 1 表示有效， -1 表示删除了
//...........................................
th_set    : ID      // 对应 ThingSet 的 ID
th_cate   : "xxx"   // 分类ID（如果有分类）
//...........................................
th_c_cmt   : 45      // 评论数
th_c_view  : 1980    // 浏览次数
th_c_agree : 86      // 赞同次数
//...........................................
tha_xxx : ??     // 其他以 tha_ 开头的属性是根据定义文件里面的字段来声明的
..
```

# ThingComments

```
nm    : ID       // 创建时时间戳，格式类似 20150721132134321
tp    : "md"     // 文件类型，表示这个评论文件的内容
mime  : "text/plain" // 文件的 MIME 类型
ct    : MS       // 创建时间
lm    : MS       // 最后修改时间
//...........................................
th_etp : "comment"   // Thing 的元素类型。 标识是评论
th_set : ID          // 对应 ThingSet 的 ID
th_id  : ID          // 对应的 ThingID
th_rep : ID          // 「选」表示本评论是针对某个评论的评论
//...........................................
th_ow_id  : "xxx"   // 所属者（Wn账号）
th_ow_nm  : “xxx"   // 「冗余」所属者显示名
th_name   : "xxx"   // 东西的名称
th_breif  : "xxx"   // 东西的简单文本介绍，用作详细列表显示
//...........................................
th_c_agree  : 86      // 赞同次数
```

* 评论发出，不能删除，只能修改

