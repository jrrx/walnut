package org.nutz.walnut.ext.noti.hdl;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.nutz.lang.Lang;
import org.nutz.lang.Strings;
import org.nutz.lang.util.Region;
import org.nutz.walnut.api.err.Er;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.api.io.WnQuery;
import org.nutz.walnut.api.io.WnRace;
import org.nutz.walnut.api.usr.WnUsr;
import org.nutz.walnut.impl.box.JvmHdl;
import org.nutz.walnut.impl.box.JvmHdlContext;
import org.nutz.walnut.impl.box.JvmHdlParamArgs;
import org.nutz.walnut.impl.box.WnSystem;
import org.nutz.walnut.util.Wn;

@JvmHdlParamArgs("Q")
public class noti_clean implements JvmHdl {

    @Override
    public void invoke(WnSystem sys, JvmHdlContext hc) {

        boolean quiet = hc.params.is("Q");
        int limit = hc.params.getInt("limit", 0);
        String keep = hc.params.get("keep");

        // 进入内核态执行
        Wn.WC().core(null, true, null, () -> {

            // 分析保留多长时间
            long keepInMs = 0;
            if (!Strings.isBlank(keep)) {
                Matcher m = Pattern.compile("^(\\d+)(h|m|day)$").matcher(keep);
                if (m.find()) {
                    int nb = Integer.parseInt(m.group(1));
                    String unit = m.group(2);
                    // 分钟
                    if ("m".equals(unit)) {
                        keepInMs = 60000L * nb;
                    }
                    // 小时
                    else if ("h".equals(unit)) {
                        keepInMs = 3600000L * nb;
                    }
                    // 天
                    else {
                        keepInMs = 86400000L * nb;
                    }
                }
            }

            // 得到要操作的用户
            String myName = sys.se.me();
            WnUsr me = sys.usrService.check(myName);

            // 得到自己在 root 组的权限
            int roleInRoot = sys.usrService.getRoleInGroup(me, "root");
            boolean I_am_member_of_root = roleInRoot == Wn.ROLE.ADMIN
                                          || roleInRoot == Wn.ROLE.MEMBER;

            // 只有 root 组用户才能执行这个命令
            if (!I_am_member_of_root) {
                throw Er.create("e.cmd.noti.clean.nopvg");
            }

            // 得到消息主目录
            WnObj oNotiHome = sys.io.createIfNoExists(null, "/sys/noti", WnRace.DIR);

            // 准备条件
            WnQuery q = Wn.Q.pid(oNotiHome);
            q.setv("noti_st", Lang.map("$ne:1"));

            // 保留一定的消息
            q.setv("ct", Region.Longf("(,%d)", System.currentTimeMillis() - keepInMs));

            if (limit > 0)
                q.limit(limit);

            // 逐个删除删除
            sys.io.each(q, (int index, WnObj oN, int len) -> {
                sys.io.delete(oN);

                if (!quiet) {
                    sys.out.printlnf("rm %s(%s)[%d] > %s",
                                     oN.getString("noti_type", "?"),
                                     oN.id(),
                                     oN.getInt("noti_st", 1),
                                     oN.getString("noti_target", "?"));
                }
            });
        });

    }

}
