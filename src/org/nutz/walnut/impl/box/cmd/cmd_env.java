package org.nutz.walnut.impl.box.cmd;

import org.nutz.lang.Strings;
import org.nutz.walnut.impl.box.JvmExecutor;
import org.nutz.walnut.impl.box.WnSystem;
import org.nutz.walnut.util.ZParams;

public class cmd_env extends JvmExecutor {

    @Override
    public void exec(WnSystem sys, String[] args) {
        ZParams params = ZParams.parse(args, null);

        // 如果是移除
        if (params.has("u")) {
            String[] ss = Strings.splitIgnoreBlank(params.get("u"), "[, \t\n]");
            for (String varName : ss) {
                sys.se.var(varName, null);
            }
            sys.se.persist(ss);
            sys.sessionService.save(sys.se);
        }
        // 持久化给定变量
        else if (params.has("export")) {
            String[] ss = Strings.splitIgnoreBlank(params.get("export"));
            sys.se.persist(ss);
            sys.sessionService.save(sys.se);
        }
        // 没有参数，列出所有环境变量
        else if (params.vals.length == 0) {
            for (String key : sys.se.vars().keySet()) {
                sys.out.printlnf("%-8s : %s", key, sys.se.vars().getString(key));
            }
        }
        // 一个值，仅仅列出值
        else if (params.vals.length == 1) {
            String str = params.vals[0];
            int pos = str.indexOf('=');

            // 设置变量
            if (pos > 0) {
                String key = str.substring(0, pos);
                String val = str.substring(pos + 1);
                sys.se.var(key, val);
            }
            // 列出变量的值
            else {
                String key = str;
                String val = sys.se.vars().getString(key);
                if (null != val)
                    sys.out.println(val);
            }
        }
        // 一个个的列出环境变量
        else {
            for (String key : params.vals) {
                String val = sys.se.vars().getString(key);
                if (null != val)
                    sys.out.printlnf("%s : %s", key, val);
            }
        }

    }

}
