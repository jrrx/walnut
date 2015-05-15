package org.nutz.walnut.impl.box.cmd;

import java.util.LinkedList;
import java.util.List;

import org.nutz.lang.Each;
import org.nutz.lang.util.Disks;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.impl.box.JvmExecutor;
import org.nutz.walnut.impl.box.WnObjTable;
import org.nutz.walnut.impl.box.WnSystem;
import org.nutz.walnut.util.ZParams;

public class cmd_ls extends JvmExecutor {

    @Override
    public void exec(final WnSystem sys, String[] args) {
        // 分析参数
        final ZParams params = ZParams.parse(args, "lhAi");
        // TODO 搞搞参数...

        // 计算要列出的目录并得到当前目录
        List<WnObj> list = new LinkedList<WnObj>();
        WnObj p = evalCandidateObjs(sys, params.vals, list, true);

        // 检查是否候选对象列表为空
        checkCandidateObjsNoEmpty(args, list);

        // 准备要显示的表格
        String keys = "";
        if (params.is("l")) {
            keys = "md,m,g,len,lm";
            if (params.is("i"))
                keys = "id," + keys;
        }
        final WnObjTable tab = new WnObjTable(keys);
        final boolean useColor = sys.nextId < 0;
        final boolean briefSize = params.is("h");

        // 只有一个内容
        if (list.size() == 1) {
            WnObj o = list.get(0);
            // 本身就是文件
            if (o.isFILE()) {
                tab.add(o, useColor, briefSize);
            }
            // 是个目录
            else {
                sys.io.eachChildren(o, null, new Each<WnObj>() {
                    public void invoke(int index, WnObj child, int length) {
                        tab.add(child, useColor, briefSize);
                    }
                });
            }
        }
        // 多个内容
        else {
            // 先输出所有的文件
            for (WnObj o : list) {
                if (o.isFILE()) {
                    tab.add(o, useColor, briefSize);
                }
            }
            sys.out.println();
            // 再输出所有的目录
            for (WnObj o : list) {
                if (!o.isFILE()) {
                    String rph = Disks.getRelativePath(p.path(), o.path());
                    sys.out.println(rph + " :");
                    sys.io.eachChildren(o, null, new Each<WnObj>() {
                        public void invoke(int index, WnObj child, int length) {
                            tab.add(child, useColor, briefSize);
                        }
                    });
                }
            }
        }

        // 最后写到标准输出
        sys.out.print(tab.toString());
    }

}
