package org.nutz.walnut.impl.mongo;

import java.util.Map;

import org.nutz.lang.ContinueLoop;
import org.nutz.lang.Each;
import org.nutz.lang.ExitLoop;
import org.nutz.lang.util.NutMap;
import org.nutz.mongo.ZMoCo;
import org.nutz.mongo.ZMoDoc;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.api.io.WnQuery;
import org.nutz.walnut.impl.AbstractWnIndexer;

import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class MongoWnIndexer extends AbstractWnIndexer {

    private ZMoCo co;

    public MongoWnIndexer(ZMoCo co) {
        this.co = co;
    }

    @Override
    public void _clean_for_unit_test() {
        co.remove(ZMoDoc.NEW());
    }

    @Override
    public WnObj getBy(String id, String... keys) {
        ZMoDoc q = WnMongos.qID(id);
        ZMoDoc fields = keys.length == 0 ? null : ZMoDoc.NEW();
        if (null != fields) {
            for (String key : keys)
                fields.put(key, 1);
        }
        ZMoDoc doc = co.findOne(q, fields);
        return WnMongos.toWnObj(doc);
    }

    @Override
    public void set(String id, NutMap map) {
        // 移除
        if (null == map) {
            remove(id);
        }
        // 更新或者创建
        if (map.size() > 0) {
            ZMoDoc q = WnMongos.qID(id);
            ZMoDoc doc = ZMoDoc.NEW();

            // 提炼字段
            for (Map.Entry<String, Object> en : map.entrySet()) {
                String key = en.getKey();
                if (key.matches("^id|nd$"))
                    continue;
                doc.set(key, en.getValue());
            }

            // 执行更新
            co.update(q, doc, true, false);
        }
    }

    @Override
    public Object getValue(String id, String key) {
        ZMoDoc doc = co.findOne(WnMongos.qID(id), ZMoDoc.NEW(key, 1));
        return doc.get(key);
    }

    @Override
    public void setValue(String id, String key, Object val) {
        ZMoDoc q = WnMongos.qID(id);
        ZMoDoc doc = ZMoDoc.SET(key, val);
        co.update(q, doc, true, false);
    }

    @Override
    public int each(WnQuery q, Each<WnObj> callback) {
        if (null == callback)
            return 0;
        ZMoDoc qDoc = null == q ? ZMoDoc.NEW() : WnMongos.toQueryDoc(q);
        DBCursor cu = co.find(qDoc);

        try {
            int i = 0;
            int n = 0;
            WnMongos.setup_paging(cu, q);
            WnMongos.setup_sorting(cu, q);

            while (cu.hasNext() && (null == q || !q.isPaging() || (q.isPaging() && n < q.limit()))) {
                DBObject dbobj = cu.next();
                WnObj o = WnMongos.toWnObj(dbobj);
                try {
                    callback.invoke(i++, o, n);
                    n++;
                }
                catch (ExitLoop e) {
                    break;
                }
                catch (ContinueLoop e) {}
            }

            return n;
        }
        finally {
            cu.close();
        }
    }

    @Override
    public void remove(String id) {
        co.remove(WnMongos.qID(id));
    }

}