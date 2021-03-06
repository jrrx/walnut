package org.nutz.walnut.impl.io.handle;

import java.util.HashMap;
import java.util.Map;

import org.nutz.walnut.api.err.Er;
import org.nutz.walnut.api.io.WnHandle;
import org.nutz.walnut.api.io.WnHandleManager;

public class WnHandleManagerImpl implements WnHandleManager {

    private Map<String, WnHandle> map;

    public WnHandleManagerImpl() {
        map = new HashMap<String, WnHandle>();
    }

    @Override
    public WnHandle create() {
        return new WnHandle();
    }

    @Override
    public synchronized WnHandle get(String hid) {
        return map.get(hid);
    }

    @Override
    public synchronized WnHandle check(String hid) {
        WnHandle hdl = get(hid);
        if (null == hdl) {
            throw Er.create("e.io.hdl.noexists", hid);
        }
        return hdl;
    }

    @Override
    public synchronized void save(WnHandle hdl) {
        map.put(hdl.id, hdl);
    }

    @Override
    public synchronized void remove(String hid) {
        map.remove(hid);
    }

    @Override
    public synchronized void dropAll() {
        map.clear();
    }

}
