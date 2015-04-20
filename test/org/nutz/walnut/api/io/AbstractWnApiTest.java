package org.nutz.walnut.api.io;

import org.junit.After;
import org.junit.Before;
import org.nutz.ioc.impl.PropertiesProxy;
import org.nutz.lang.Mirror;
import org.nutz.walnut.impl.mongo.MongoDB;
import org.nutz.walnut.util.Wn;

public abstract class AbstractWnApiTest {

    // ------------------------------------------------ 这些是测试目标的构建
    protected WnIndexer indexer;

    protected WnTreeFactory treeFactory;

    protected WnStoreFactory storeFactory;

    protected PropertiesProxy pp;

    protected MongoDB db;

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

        // 创建当前线程操作的用户
        Wn.WC().me("zozoh");

        // 调用子类初始化
        on_before(pp);
    }

    @After
    public void after() {
        on_after(pp);
    }

    protected void on_before(PropertiesProxy pp) {};

    protected void on_after(PropertiesProxy pp) {}

}