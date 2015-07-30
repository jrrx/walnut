package org.nutz.walnut.impl.io;

import java.util.List;
import java.util.Map;

import org.nutz.lang.Lang;
import org.nutz.lang.Strings;
import org.nutz.lang.util.NutMap;
import org.nutz.walnut.api.err.Er;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.api.io.WnRace;
import org.nutz.walnut.api.io.WnTree;
import org.nutz.walnut.util.Wn;

// import org.nutz.walnut.util.WnContext;

public class WnBean extends NutMap implements WnObj {

    private WnTree tree;

    public WnTree tree() {
        return tree;
    }

    public WnObj setTree(WnTree tree) {
        this.tree = tree;
        return this;
    }

    public WnBean() {}

    public WnBean(WnBean o) {
        this.putAll(o);
        this.setTree(tree);

    }

    public NutMap toMap4Update(String regex) {
        NutMap map = new NutMap();
        for (Map.Entry<String, Object> en : this.entrySet()) {
            String key = en.getKey();
            // 如果 regex 为空，只要不是 id 且不是 "__" 开头（表隐藏），则全要
            if (null == regex) {
                if (!"id".equals(key) && !key.startsWith("__"))
                    map.put(key, en.getValue());
            }
            // 否则只给出正则表达式匹配的部分，以及几个固定需要更新的字段
            else if (key.matches("^nm|race|pid|mnt$") || key.matches(regex)) {
                map.put(key, en.getValue());
            }
        }
        return map;
    }

    @Override
    public NutMap toMap(String regex) {
        NutMap map = new NutMap();
        for (Map.Entry<String, Object> en : this.entrySet()) {
            String key = en.getKey();
            if (null == regex) {
                map.put(key, en.getValue());
            }
            // 否则只给出正则表达式匹配的部分，以及几个固定需要更新的字段
            else if (key.matches(regex)) {
                map.put(key, en.getValue());
            }
        }
        return map;
    }

    public String id() {
        return getString("id");
    }

    public WnObj id(String id) {
        setv("id", id);
        return this;
    }

    public boolean hasID() {
        return !Strings.isBlank(id());
    }

    public boolean isSameId(String id) {
        return id().equals(id);
    }

    public WnObj genID() {
        throw Er.create("e.io.obj.forbiden.genid");
    }

    public String checkString(String key) {
        String str = getString(key);
        if (null == str)
            throw Er.create("e.io.obj.nokey", key);
        return str;
    }

    public boolean isSameId(WnObj o) {
        return isSameId(o.id());
    }

    public boolean isLink() {
        return !Strings.isBlank(link());
    }

    public String link() {
        return this.getString("ln");
    }

    public WnBean link(String lid) {
        this.setv("ln", lid);
        return this;
    }

    public boolean isType(String tp) {
        String mytp = type();
        if (null == mytp)
            return null == tp;
        if (null == tp)
            return false;
        return mytp.equals(tp);
    }

    @Override
    public boolean hasType() {
        return !Strings.isBlank(type());
    }

    public String type() {
        return this.getString("tp");
    }

    public WnBean type(String tp) {
        this.setOrRemove("tp", tp);
        return this;
    }

    public String mime() {
        return this.getString("mime");
    }

    public WnBean mime(String mime) {
        this.setOrRemove("mime", mime);
        return this;
    }

    public boolean hasSha1() {
        return !Strings.isBlank(sha1());
    }

    public String sha1() {
        return this.getString("sha1");
    }

    public WnBean sha1(String sha1) {
        this.setv("sha1", sha1);
        return this;
    }

    public boolean isSameSha1(String sha1) {
        if (null == sha1)
            return false;
        String mySha1 = sha1();
        if (null == mySha1)
            return false;
        return mySha1.equals(sha1);
    }

    public boolean hasData() {
        return !Strings.isBlank(data());
    }

    public String data() {
        return this.getString("data");
    }

    public WnBean data(String data) {
        this.setv("data", data);
        return this;
    }

    public boolean isSameData(String data) {
        if (null == data)
            return false;
        String myData = data();
        if (null == myData)
            return false;
        return myData.equals(data);
    }

    public long len() {
        return this.getLong("len", 0);
    }

    public WnBean len(long len) {
        this.put("len", len);
        return this;
    }

    public int remain() {
        return this.getInt("remain");
    }

    public WnBean remain(int remain) {
        this.put("remain", remain);
        return this;
    }

    public String creator() {
        return this.getString("c");
    }

    public WnBean creator(String creator) {
        this.setOrRemove("c", creator);
        return this;
    }

    public String mender() {
        return this.getString("m");
    }

    public WnBean mender(String mender) {
        this.setOrRemove("m", mender);
        return this;
    }

    public String group() {
        return this.getString("g");
    }

    public WnBean group(String grp) {
        this.setOrRemove("g", grp);
        return this;
    }

    public int mode() {
        return this.getInt("md");
    }

    public WnBean mode(int md) {
        this.setOrRemove("md", md);
        return this;
    }

    public String d0() {
        return this.getString("d0");
    }

    public WnBean d0(String d0) {
        this.setv("d0", d0);
        return this;
    }

    public String d1() {
        return this.getString("d1");
    }

    public WnBean d1(String d1) {
        this.setv("d1", d1);
        return this;
    }

    public WnBean update(NutMap map) {
        this.putAll(map);
        return this;
    }

    public String[] labels() {
        return this.getArray("lbls", String.class);
    }

    public WnBean labels(String[] lbls) {
        this.setOrRemove("lbls", lbls);
        return this;
    }

    public long createTime() {
        return this.getLong("ct", -1);
    }

    public WnBean createTime(long ct) {
        this.setOrRemove("ct", ct);
        return this;
    }

    @Override
    public long syncTime() {
        return this.getLong("st", -1);
    }

    @Override
    public WnObj syncTime(long st) {
        this.setOrRemove("st", st);
        return this;
    }

    public long expireTime() {
        return this.getLong("expi", -1);
    }

    public WnBean expireTime(long expi) {
        this.setOrRemove("expi", expi);
        return this;
    }

    public boolean isExpired() {
        return isExpiredBy(System.currentTimeMillis());
    }

    @Override
    public boolean isExpiredBy(long now) {
        long expi = expireTime();
        if (expi <= 0)
            return false;
        return expi < now;
    }

    public long lastModified() {
        return this.getLong("lm");
    }

    public long nanoStamp() {
        return this.getLong("nano");
    }

    public WnBean nanoStamp(long nano) {
        this.setv("nano", nano);
        this.setv("lm", nano / 1000000L);
        return this;
    }

    public boolean equals(Object obj) {
        if (obj instanceof WnBean) {
            WnBean o = (WnBean) obj;
            if (o.size() != size())
                return false;
            for (String key : o.keySet()) {
                if (!Lang.equals(o.get(key), get(key)))
                    return false;
            }
            return true;
        }
        return false;
    }

    public String toString() {
        return String.format("%s:{%s:%s:%s}", path(), id(), creator(), group());
    }

    // -----------------------------------------
    // 下面的属性不要主动设置，用 nd() 方法设置
    // -----------------------------------------

    public String path() {
        String ph = getString("ph");
        if (Strings.isBlank(ph)) {
            this.loadParents(null, true);
            ph = getString("ph");
        }
        return ph;
    }

    public WnObj path(String path) {
        setv("ph", path);
        return this;
    }

    public WnObj appendPath(String path) {
        path(Wn.appendPath(path(), path));
        return this;
    }

    public String name() {
        return getString("nm");
    }

    public WnObj name(String nm) {
        setv("nm", nm);
        return this;
    }

    public WnRace race() {
        return getEnum("race", WnRace.class);
    }

    public WnObj race(WnRace race) {
        setv("race", race);
        return this;
    }

    public boolean isRace(WnRace race) {
        return race() == race;
    }

    public boolean isDIR() {
        return isRace(WnRace.DIR);
    }

    public boolean isFILE() {
        return isRace(WnRace.FILE);
    }

    public String parentId() {
        return getString("pid");
    }

    @Override
    public boolean hasParent() {
        return !Strings.isBlank(parentId());
    }

    public String mount() {
        return getString("mnt");
    }

    public WnObj mount(String mnt) {
        setv("mnt", mnt);
        return this;
    }

    @Override
    public boolean isMount(String mntType) {
        String mnt = mount();
        return mnt != null && mnt.startsWith(mntType);
    }

    public boolean isHidden() {
        return name().startsWith(".");
    }

    @Override
    public boolean isRootNode() {
        return !this.hasParent();
    }

    private WnObj parent;

    public WnObj parent() {
        if (null == parent && hasParent()) {
            parent = tree.getParent(this);
        }
        return parent;
    }

    public void setParent(WnObj parent) {
        this.parent = parent;
        String pid = (null == parent ? null : parent.id());
        this.setv("pid", pid);
    }

    @Override
    public WnObj loadParents(List<WnObj> list, boolean force) {
        // 已经加载过了，且不是强制加载，就啥也不干
        if (null != parent && !force) {
            if (Strings.isBlank(path())) {
                path(parent.path()).appendPath(name());
            }
            if (null != list && !parent.path().equals("/")) {
                parent.loadParents(list, force);
                list.add(parent);
            }
            return parent;
        }

        // 如果自己就是树的根节点则表示到头了
        // 因为 Mount 的树，它的树对象是父树
        if (!this.hasParent()) {
            path("/");
            return this;
        }

        // 得到父节点
        String pid = parentId();
        WnObj p = tree.get(pid);

        // 没有父，是不可能的
        if (null == p) {
            throw Lang.impossible();
        }

        // 递归加载父节点的祖先
        p.loadParents(list, force);

        // 确保可访问
        p = Wn.WC().whenEnter(p);

        // 设置成自己的父
        parent = p;

        // 记录到输出列表
        if (null != list)
            list.add(parent);

        // 更新路径
        path(parent.path()).appendPath(name());

        // 返回父节点
        return parent;
    }

    public boolean isMyParent(WnObj p) {
        return Lang.equals(parentId(), p.id());
    }

    public WnObj clone() {
        return duplicate();
    }

    @Override
    public WnObj duplicate() {
        return new WnBean(this);
    }

}
