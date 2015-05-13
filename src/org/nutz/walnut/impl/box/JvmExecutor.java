package org.nutz.walnut.impl.box;

import java.io.File;
import java.util.List;

import org.nutz.lang.Each;
import org.nutz.lang.Files;
import org.nutz.lang.Lang;
import org.nutz.lang.Strings;
import org.nutz.walnut.api.err.Er;
import org.nutz.walnut.api.io.WnIo;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.util.Wn;

public abstract class JvmExecutor {

    public abstract void exec(WnSystem sys, String[] args);

    public String getManual() {
        Class<?> klass = this.getClass();
        String ph = klass.getPackage().getName().replace('.', '/');
        ph += "/" + klass.getSimpleName() + ".man";

        File f = Files.findFile(ph);
        if (null == f) {
            return klass.getSimpleName() + " ??? no manual";
        }

        return Files.read(f);
    }

    protected WnObj getCurrentObj(WnSystem sys) {
        String pwd = sys.se.envs().getString("PWD");
        String path = Wn.normalizePath(pwd, sys);
        return sys.io.check(null, path);
    }

    protected void joinObjByPath(WnSystem sys, final List<WnObj> list, WnObj p, String str) {
        // 用 ID
        if (str.startsWith("id:")) {
            String id = str.substring("id:".length());
            WnObj o = sys.io.checkById(id);
            list.add(o);
            return;
        }

        // 用路径
        String ph = Wn.normalizePath(str, sys);

        // 从根开始的路径...
        if (ph.startsWith("/"))
            p = null;

        // 因为要考虑通配符，逐次进入
        String[] ss = Strings.splitIgnoreBlank(ph, "/");

        // 根节点
        if (ss.length == 0) {
            list.add(sys.io.getRootObj());
        }
        // 试图按路径查找
        else {
            __find_last_level_objs(sys.io, p, ss, 0, list);
        }
    }

    private void __find_last_level_objs(final WnIo io,
                                        WnObj p,
                                        final String[] ss,
                                        final int off,
                                        final List<WnObj> list) {
        String nm = ss.length > off ? ss[off] : null;

        // 当前目录
        if (".".equals(nm)) {
            __find_last_level_objs_handle(io, ss, off + 1, list, p);
        }
        // 回退一级
        else if ("..".equals(nm)) {
            WnObj o = io.getParent(p);
            __find_last_level_objs_handle(io, ss, off + 1, list, o);
        }
        // 继续查找
        else {
            io.eachChildren(p, nm, new Each<WnObj>() {
                public void invoke(int index, WnObj o, int length) {
                    __find_last_level_objs_handle(io, ss, off + 1, list, o);
                }
            });
        }
    }

    private void __find_last_level_objs_handle(final WnIo io,
                                               final String[] ss,
                                               final int off,
                                               final List<WnObj> list,
                                               WnObj o) {
        // 如果到了最后一层，才加入 list
        if (off >= ss.length) {
            if (null == o)
                list.add(io.getRootObj());
            else
                list.add(o);
        }
        // 否则继续递归
        else if (!o.isFILE()) {
            __find_last_level_objs(io, o, ss, off, list);
        }
    }

    protected WnObj evalCandidateObjs(WnSystem sys,
                                      String[] paths,
                                      final List<WnObj> list,
                                      boolean joinCurrent) {
        // 得到当前目录
        WnObj p = getCurrentObj(sys);

        // 计算要列出的目录
        // 没参数认为是当前目录
        if (paths.length == 0) {
            if (joinCurrent)
                list.add(p);
        }
        // 否则根据路径归纳需要列的目录
        else {
            for (String val : paths) {
                joinObjByPath(sys, list, p, val);
            }
        }

        return p;
    }

    protected void checkCandidateObjsNoEmpty(String[] args, List<WnObj> list) {
        if (list.isEmpty()) {
            throw Er.create("e.io.obj.noexists", Lang.concat(", ", args));
        }
    }
}