package org.nutz.walnut.impl.local.data;

import org.nutz.walnut.api.io.WnHistory;
import org.nutz.walnut.api.io.WnObj;

public class LocalObjWnHistory implements WnHistory {

    public LocalObjWnHistory(WnObj o) {
        oid(o.id());
        owner(o.mender());
        sha1(o.sha1());
        data(o.data());
        len(o.len());
        nanoStamp(o.nanoStamp());
    }

    private String oid;

    private String data;

    private String sha1;

    private String owner;

    private long len;

    private long nano;

    @Override
    public String oid() {
        return oid;
    }

    @Override
    public WnHistory oid(String oid) {
        this.oid = oid;
        return this;
    }

    @Override
    public String sha1() {
        return sha1;
    }

    @Override
    public WnHistory sha1(String sha1) {
        this.sha1 = sha1;
        return this;
    }

    @Override
    public String data() {
        return data;
    }

    @Override
    public WnHistory data(String data) {
        this.data = data;
        return this;
    }

    @Override
    public boolean isSameData(String data) {
        if (null == data)
            return false;
        String myData = data();
        if (null == myData)
            return false;
        return myData.equals(data);
    }

    @Override
    public boolean isSameSha1(String sha1) {
        if (null == sha1)
            return false;
        String mySha1 = sha1();
        if (null == mySha1)
            return false;
        return mySha1.equals(sha1);
    }

    @Override
    public String owner() {
        return owner;
    }

    @Override
    public WnHistory owner(String ow) {
        this.owner = ow;
        return this;
    }

    @Override
    public long len() {
        return len;
    }

    @Override
    public WnHistory len(long len) {
        this.len = len;
        return this;
    }

    @Override
    public long nanoStamp() {
        return nano;
    }

    @Override
    public WnHistory nanoStamp(long nano) {
        this.nano = nano;
        return this;
    }

}
