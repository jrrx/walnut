package org.nutz.walnut;

import org.junit.After;
import org.junit.Before;
import org.nutz.ioc.impl.PropertiesProxy;
import org.nutz.lang.Mirror;
import org.nutz.walnut.api.io.MimeMap;
import org.nutz.walnut.impl.io.MimeMapImpl;
import org.nutz.walnut.impl.io.mongo.MongoDB;
import org.nutz.walnut.util.Wn;

public abstract class BaseApiTest {

    // ------------------------------------------------ 这些是测试目标的构建
    protected PropertiesProxy pp;

    protected MongoDB db;

    protected MimeMap mimes;

    @Before
    public void before() {
        // 解析配置文件
        pp = new PropertiesProxy("org/nutz/walnut/junit.properties");

        // 初始化 MongoDB
        db = new MongoDB();
        Mirror.me(db).setValue(db, "host", pp.get("mongo-host"));
        Mirror.me(db).setValue(db, "port", pp.getInt("mongo-port"));
        Mirror.me(db).setValue(db, "usr", pp.get("mongo-usr"));
        Mirror.me(db).setValue(db, "pwd", pp.get("mongo-pwd"));
        Mirror.me(db).setValue(db, "db", pp.get("mongo-db"));
        db.on_create();

        PropertiesProxy ppMime = new PropertiesProxy(pp.check("mime"));
        mimes = new MimeMapImpl(ppMime);

        // 调用子类初始化
        on_before(pp);
    }

    @After
    public void after() {
        on_after(pp);
        db.on_depose();
    }

    protected void on_before(PropertiesProxy pp) {
        // 默认每个测试运行都是用 root
        Wn.WC().me("root", "root");
    };

    protected void on_after(PropertiesProxy pp) {
        Wn.WC().me("root", "root");
    }

}
