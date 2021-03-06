package org.nutz.walnut.api.io;

import java.util.List;
import java.util.Map;

import org.nutz.lang.util.NutBean;
import org.nutz.lang.util.NutMap;

public interface WnObj extends NutBean {

    WnTree tree();

    WnObj setTree(WnTree tree);

    boolean isRootNode();

    String id();

    WnObj id(String id);

    boolean hasWriteHandle();

    String getWriteHandle();

    WnObj setWriteHandle(String hid);

    boolean hasID();

    boolean isSameId(WnObj o);

    boolean isSameId(String id);

    boolean isMyParent(WnObj p);

    boolean isRWMeta();

    WnObj setRWMeta(boolean rwmeta);

    boolean hasRWMetaKeys();

    String getRWMetaKeys();

    WnObj setRWMetaKeys(String regex);

    WnObj clearRWMetaKeys();

    String path();

    WnObj path(String path);

    WnObj appendPath(String path);

    String name();

    WnObj name(String nm);

    WnRace race();

    WnObj race(WnRace race);

    boolean isRace(WnRace race);

    boolean isDIR();

    boolean isFILE();

    boolean isHidden();

    boolean hasParent();

    WnObj parent();

    WnObj loadParents(List<WnObj> list, boolean force);

    void setParent(WnObj parent);

    String parentId();

    String mount();

    WnObj mount(String mnt);

    String mountRootId();

    WnObj mountRootId(String mrid);

    boolean isMount();

    long len();

    long lastModified();

    WnObj lastModified(long lm);

    String toString();

    WnObj clone();

    WnObj update(Map<? extends String, ? extends Object> map);

    WnObj update2(WnObj o);

    boolean isLink();

    String link();

    WnObj link(String lid);

    boolean isType(String tp);

    boolean hasType();

    String type();

    WnObj type(String tp);

    String mime();

    WnObj mime(String mime);

    boolean hasSha1();

    String sha1();

    WnObj sha1(String sha1);

    boolean isSameSha1(String sha1);

    boolean hasThumbnail();

    String thumbnail();

    WnObj thumbnail(String thumbnail);

    boolean hasData();

    String data();

    WnObj data(String data);

    boolean isSameData(String data);

    WnObj len(long len);

    int remain();

    WnObj remain(int remain);

    WnObj creator(String creator);

    WnObj mender(String mender);

    WnObj group(String grp);

    WnObj mode(int md);

    String creator();

    String mender();

    String group();

    int mode();

    String d0();

    WnObj d0(String d0);

    String d1();

    WnObj d1(String d1);

    String[] dN();

    String[] labels();

    WnObj labels(String[] lbls);

    long createTime();

    WnObj createTime(long ct);

    long expireTime();

    WnObj expireTime(long expi);

    long syncTime();

    WnObj syncTime(long st);

    boolean isExpired();

    boolean isExpiredBy(long now);

    boolean equals(Object obj);

    NutMap toMap4Update(String regex);

    NutMap toMap(String regex);

}
