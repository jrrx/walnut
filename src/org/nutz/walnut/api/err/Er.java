package org.nutz.walnut.api.err;

import java.lang.reflect.InvocationTargetException;

import org.nutz.web.WebException;
import org.nutz.web.Webs;

public abstract class Er {

    public static WebException create(String key) {
        return Webs.Err.create(key);
    }

    public static WebException create(String key, Object reason) {
        return Webs.Err.create(key, reason);
    }

    public static WebException createf(String key, String fmt, Object... args) {
        return Webs.Err.create(key, String.format(fmt, args));
    }

    public static WebException create(Throwable e, String key, Object reason) {
        return Webs.Err.create(e, key, reason);
    }

    public static WebException wrap(Throwable e) {
        return Webs.Err.wrap(e);
    }

    public static Throwable unwrap(Throwable e) {
        if (e == null)
            return null;
        if (e instanceof InvocationTargetException) {
            InvocationTargetException itE = (InvocationTargetException) e;
            if (itE.getTargetException() != null)
                return unwrap(itE.getTargetException());
        }
        if (e instanceof WebException) {
            return e;
        }

        if (e instanceof RuntimeException && e.getCause() != null)
            return unwrap(e.getCause());
        return e;
    }

    public static WebException create(Throwable e, String key) {
        return Webs.Err.create(e, key);
    }

}
