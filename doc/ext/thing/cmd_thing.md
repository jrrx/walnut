# 命令简介 

    `thing` 用来管理数据，当然你也可以用更底层一些的 `obj`
    很多时候用这个命令会更加方便

# 用法

    thing [xxx] ACTION [options] [-json "{..}] [-tmpl "TMPL"] [-N] [-Q]
    
    - 第一个参数(如果有)代表一个 Thing 或者 ThingSet
    - ACTION     可以是  get|init|create|detail|delete|update|query|comment|clean
                 默认为 "get"
    - options    根据不同的 ACTION 意义不同
    
    下面是所有子命令都支持的参数:
    
    -e      输出对象字段的时候，符合正则表达式的字段才会被输出，如果以 ! 开头，表示取反
    
    -Q      强制不输出，比如 -check 的时候，可以不输出
    
    -t      按表格输出，这个参数指定了表格的列
    -i      按表格输出时，显示序号，默认不显示序号
    -ibase  按表格输出时，显示序号起始值，默认为 0
    -h      按表格输出时，显示表头
    -b      按表格输出时，显示表格边框
    -s      按表格输出时，在表格后显示脚注

    -json   输出为 JSON，后面是详细的 JSON 格式化信息
    -c      按json输出时，紧凑显示
    -n      按json输出时，如果有 null 值的键也不忽略
    -q      按json输出时，键值用双引号包裹
    -l      按json输出时，强制输出成列表。默认的，多个结果才显示成列表
    -H      按json输出时，也显示双下划线开头的隐藏字段

    -V      仅输出值
    -sep    值之间用什么分隔，默认用空字符串，即指之间紧凑显示
    -N      每个对象之间换行
    
    -tmpl   表示每个对象按照一个模板输出，上下文为 obj 本身
            模板占位符为 `@{xxx}` 的格式
        
    > thing 命令会将第一个参数对应的 WnObj 临时设置为当前会话的 PWD
      就是说，如果不指定第一个参数，那么当前的目录就作为所在的 ThingSet 或者 Thing
    > 执行任何命令，默认是输出 JSON

# thing xxx get
    
    #----------------------------------------------------
    # 命令格式
    thing [xxx] [get]
    #----------------------------------------------------
    # 得到一个 thing 的详细信息 
    thing [xxx]
    
    # 打印某个 thing 的全部 JSON 信息
    thing [xxx] get -json 
    
    # 打印某个 thing 的名称和所属者，且不输出换行符
    thing [xxx] get -out '@{th_ow} belong to @{th_name}' -N

# thing xxx init

    #----------------------------------------------------
    # 命令格式
    thing [xxx] init
    #----------------------------------------------------
    - 初始化一个 ThingSet，当前的目录必须是个 ThingSet，否则跑错
   
# thing xxx create

    #----------------------------------------------------
    # 命令格式
    thing [xxx] create ["$th_nm"] 
                       [-brief "xxx"]
                       [-ow "xxx"]
                       [-cate CateID]
                       [-fields "{..}"]
    #----------------------------------------------------
     - 当前对象可以是一个 thing 或者 ThingSet
     - 如果是一个 thing，相当于是它的 ThingSet
     - 参数的意义和 thing update 一致
# thing xxx detail

    #----------------------------------------------------
    # 命令格式
    thing [xxx] detail [-set "xxxxx"] [-tp "md|txt|html"] [-drop]
    #----------------------------------------------------
    - 内容，支持从管道读取
    - 默认 tp 为 txt
    
    # 显示 thing 的 detail
    thing xxx detail
    
    # 为 thing 修改详细内容
    thing xxx detail -set "哈哈哈"
    
    # 为 thing 修改详细内容 HTML
    thing xxx detail -set "<b>哈哈哈</b>" -tp "html"
    
    # 为 thing 删除详细内容
    thing xxx detail -drop
    
# thing xxx delete
    
    #----------------------------------------------------
    # 命令格式
    thing [xxx] delete
    #----------------------------------------------------
     - 当前对象必须是一个 thing，否则不能删除
     - 所谓删除其实就是做一个标记 th_live = -1

# thing xxx update

    #----------------------------------------------------
    # 命令格式
    thing [xxx] update ["$th_nm"] 
                       [-brief "xxx"]
                       [-ow "xxx"]
                       [-cate CateID]
                       [-fields "{..}"]
    #----------------------------------------------------
     - 当前对象必须是一个 thing，否则不能更新
     - fields 里面的值，均会被添加 "tha_" 前缀
    
    # 改名
    thing xxx update "原力觉醒电影票"
    
    # 修改简介
    thing xxx update -brief "会员半价"
    
    # 修改更多的信息
    thing xxx update -fields "x:100,y:99" -json
    {
        ...
        tha_x : 100,    <- 会被添加 "tha_" 前缀
        tha_y : 99
        ...
    }

     
# thing xxx query

    #----------------------------------------------------
    # 命令格式
    thing [xxx] query "{...}"
                      [-t "c0,c1,c2.."]
                      [-pager]
                      [-sort {..}]
                      [-limit 10]
                      [-skip 0]
    #----------------------------------------------------
     - 当前对象可以是一个 thing 或者 ThingSet
     - 如果是一个 thing，相当于是它的 ThingSet
     - t 表示按照表格方式输出，是 query 的专有形式，内容就是半角逗号分隔的列名
     - pager  显示分页信息，如果是 JSON 输出，则将对象显示成 {list:[..],pager:{..}} 格式
        - 在 limit 小于等于 0 时，本参数依然无效
     - limit  限制输出的数量，默认 100
     - skip   跳过的对象数量，默认 0
     
# thing xxx comment

    #----------------------------------------------------
    # 命令格式
    thing [xxx] comment [options]
    #----------------------------------------------------
    - 注释内容，支持从管道读取
    
    # 添加注释，会自动修改 task.th_c_cmt 字段 
    thing xxx comment add "搞定了，呼" 
    
    # 修改注释
    thing xxx comment 20150721132134321 "修改一下注释"
    
    # 删除注释，会自动修改 task.th_c_cmt 字段 
    thing xxx comment del 20150721132134321
     
    
# thing xxx clean

    #----------------------------------------------------
    # 命令格式
    thing [xxx] clean
    #----------------------------------------------------
    - 当前对象可以是一个 thing 或者 ThingSet
    - 如果是一个 thing，相当于是它的 ThingSet
    - 将真正执行 `rm`，所有的 th_live = -1 的都会被清除
    

