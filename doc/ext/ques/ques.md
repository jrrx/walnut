# 问卷概述

问卷包含以下几个部分

1. 问卷模板，包含问卷的样式，题目，相关权限，收集目标等等
2. 填写结果，用户填写的问卷答案等信息
3. 统计分析 （待定）
  
问卷模板采用json格式，以*ques*为后缀名, 在同一目录下会有一个同名文件加*.result*的目录存放填写结果

填写结果采用json格式，命名规则（待定）

例如:

```js
/问卷目录
    /模板1.ques                   // 问卷模板
    /模板1.ques.result            // 填写结果(目录)
        /xxxxxxxxx001.json
        /xxxxxxxxx002.json
        /xxxxxxxxx003.json
        /xxxxxxxxx004.json
        /......
    /模板2.ques                   // 问卷模板
    /模板2.ques.result            // 填写结果(目录)
        /xxxxxxxxx001.json
        /xxxxxxxxx002.json
        /xxxxxxxxx003.json
        /xxxxxxxxx004.json
        /......
```


# 问卷模板数据结构

问卷模板由以下几部分组成

```js
{
    id:             "xxx",  // 文件唯一编号
    base:           {...},  // 基础信息
    content:        {...},  // 问卷内容
    style:          {...},  // 问卷样式（可选）
    respondent:     {...},  // 答卷人信息（可选）
    permission:     {...}   // 权限设置（可选）
}
```


## 基础信息(base)

```js
{
    name:           "问卷名称",
    description:    "简单介绍下问卷内容",
    i18n:           "zh",                   // 页面帮助文字国际化设置
    start:          "2016-04-22 12:00:00",  // 开始时间（可选）
    end:            "2016-04-22 12:00:00",  // 结束时间（可选）
    max:            0                       // 最大收集数，大于0限制数量，小于等于0则无限收集
}
```

## 问卷内容(content)

问题(question)包含两部分内容

```js
{
    setting:    {...}, // 问题配置
    style:      {...}  // 问题样式，比如选项排列方式，横向还是纵向，填空大小有几行等等
}
```

问题包含以下类型：

1. 单选题
2. 多选题
3. 填空题
4. 表单单选题
4. 表单多选题
5. 表单填空题
6. 投票型（需显示统计结果）
7. 分页符
8. 段落说明

部分类型问题可以添加验证方式:

1. 日期格式
2. 手机格式
3. 省份城市
4. 数字格式
5. 身份证格式
6. .......

也可以使用正则表达式自定义验证

// TODO 各个题目的配置与样式

## 问卷样式(style)

比如页眉页脚的设置，logo，背景色，还有主题等等

## 答卷人信息(respondent)

考虑是否合并到问卷内容中，还是独立出来

## 权限设置(permission)

1. 是否需要密码才能打开
2. 公开级别
3. 防重复填写，提交时使用验证码（防止刷票），IP地址限制等


# 填写结果数据结构

// TODO
