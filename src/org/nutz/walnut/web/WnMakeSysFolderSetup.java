package org.nutz.walnut.web;

import org.nutz.ioc.Ioc;
import org.nutz.lang.Lang;
import org.nutz.log.Log;
import org.nutz.log.Logs;
import org.nutz.mvc.NutConfig;
import org.nutz.mvc.Setup;
import org.nutz.walnut.api.io.WnIo;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.api.io.WnRace;

/**
 * 执行一次就丢弃的
 * 
 * @author zozoh(zozohtnt@gmail.com)
 */
public class WnMakeSysFolderSetup implements Setup {

    private static final Log log = Logs.get();

    @Override
    public void init(NutConfig nc) {
        Ioc ioc = nc.getIoc();

        WnConfig conf = ioc.get(WnConfig.class, "conf");
        WnIo io = ioc.get(WnIo.class, "io");

        // 确保有 sys 目录
        io.createIfNoExists(null, "/sys", WnRace.DIR);

        // 如果 /usr /grp /session 存在，迁移到其下面
        WnObj oD = io.fetch(null, "/usr");
        if (null != oD) {
            String destph = conf.get("usr-home", "/sys");
            io.move(oD, destph);
            if (log.isInfoEnabled())
                log.info("! move /usr to " + destph);
        }
        oD = io.fetch(null, "/grp");
        if (null != oD) {
            String destph = conf.get("grp-home", "/sys");
            io.move(oD, destph);
            if (log.isInfoEnabled())
                log.info("! move /grp to " + destph);
        }
        oD = io.fetch(null, "/session");
        if (null != oD) {
            String destph = conf.get("se-home", "/sys");
            io.move(oD, destph);
            if (log.isInfoEnabled())
                log.info("! move /session to " + destph);
        }

        throw Lang.makeThrow("done for upgrade!");

    }

    @Override
    public void destroy(NutConfig nc) {}

}
