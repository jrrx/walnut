package org.nutz.walnut.impl.box.cmd;

import org.nutz.lang.Times;
import org.nutz.walnut.impl.box.JvmExecutor;
import org.nutz.walnut.impl.box.WnSystem;
import org.nutz.walnut.util.ZParams;

public class cmd_date extends JvmExecutor {

    @Override
    public void exec(WnSystem sys, String[] args) {
        // 分析参数
        ZParams params = ZParams.parse(args, "n");

        // 将显示这个时间
        long now;

        // 从参数里解析日期字符串
        if (params.has("d")) {
            now = Times.D(params.get("d")).getTime();
        }
        // 从参数里解析纳秒字符串
        else if (params.has("dns")) {
            now = params.getLong("dns") / 1000000L;
        }
        // 从参数里解析毫秒字符串
        else if (params.has("dms")) {
            now = params.getLong("dms");
        }
        // 从管线里
        else if (sys.pipeId > 0) {
            String s = sys.in.readAll();
            now = Times.D(s).getTime();
        }
        // 当前时间
        else {
            now = System.currentTimeMillis();
        }

        // -fmt
        if (params.has("fmt")) {
            sys.out.print(Times.format(params.get("fmt"), Times.D(now)));
        }
        // -ss
        else if (params.is("ss")) {
            sys.out.print("" + now / 1000L);
        }
        // -ms
        else if (params.is("ms")) {
            sys.out.print("" + now);
        }
        // -1ms
        else if (params.is("1ms")) {
            sys.out.print("" + (now - (now / 1000L) * 1000L));
        }
        // -full
        else if (params.is("full")) {
            sys.out.print(Times.D(now).toString());
        }
        // -dt
        else if (params.is("dt")) {
            sys.out.print(Times.format("yyyy-MM-dd HH:mm:ss", Times.D(now)));
        }
        // -dtms
        else if (params.is("dtms")) {
            sys.out.print(Times.format("yyyy-MM-dd HH:mm:ss.SSS", Times.D(now)));
        }
        // -time
        else if (params.is("time")) {
            sys.out.print(Times.format("HH:mm:ss", Times.D(now)));
        }
        // -timems
        else if (params.is("timems")) {
            sys.out.print(Times.format("HH:mm:ss.SSS", Times.D(now)));
        }
        // 默认
        else {
            sys.out.print(Times.format("yy-MM-dd HH:mm:ss", Times.D(now)));
        }

        if (!params.is("n"))
            sys.out.println();
    }
}
