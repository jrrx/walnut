package org.nutz.walnut.ext.job.hdl;

import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.api.io.WnQuery;
import org.nutz.walnut.impl.box.JvmHdlContext;
import org.nutz.walnut.impl.box.WnSystem;
import org.nutz.web.Webs.Err;

public class job_delete extends job_abstract{

    public void invoke(WnSystem sys, JvmHdlContext hc) {
        if (hc.args.length == 0) {
            throw Err.create("e.cmds.need_args");
        }
        sudo(sys, () -> {
            for (String id : hc.args) {
                WnObj jobDir = sys.io.get(id);
                if (jobDir == null)
                    continue;
                if (!"root".equals(sys.me.name())) {
                    if (!jobDir.equals(sys.me.name())) {
                        sys.err.println("not your job id="+id);
                        continue;
                    }
                }
                sys.exec("rm -r id:"+jobDir.id());
                WnQuery query = new WnQuery().setv("pid", jobRootDir(sys).id());
                query.setv("job_pid", id);
                for (WnObj ele : sys.io.query(query)) {
                    sys.exec("rm -r id:" + ele.id());
                }
            }
        });
    } 
}
