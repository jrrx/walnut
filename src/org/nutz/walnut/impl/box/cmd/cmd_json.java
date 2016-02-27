package org.nutz.walnut.impl.box.cmd;

import java.util.Map;

import org.nutz.castor.Castors;
import org.nutz.json.Json;
import org.nutz.json.JsonFormat;
import org.nutz.lang.Lang;
import org.nutz.lang.MapKeyConvertor;
import org.nutz.lang.Streams;
import org.nutz.lang.util.NutMap;
import org.nutz.mapl.Mapl;
import org.nutz.walnut.impl.box.JvmExecutor;
import org.nutz.walnut.impl.box.WnSystem;
import org.nutz.walnut.util.ZParams;

public class cmd_json extends JvmExecutor {

    private static class _Context {
        String prefix;
        String pKey;
        boolean not;
        boolean recur;
    }

    @SuppressWarnings("unchecked")
	@Override
    public void exec(WnSystem sys, String[] args) throws Exception {

        ZParams params = ZParams.parse(args, "cqnr");

        // 读取输入
        String json = Streams.read(sys.in.getReader()).toString();

        // 格式化
        Object obj = Json.fromJson(json);

        // 取值模式
        String key = params.get("get");
        if (null != key) {
            Object val = Mapl.cell(obj, key);
            sys.out.println(Castors.me().castToString(val));
            return;
        }

        // 过滤字段
        JsonFormat fmt;
        if (params.is("c"))
            fmt = JsonFormat.compact();
        else
            fmt = JsonFormat.forLook();

        fmt.setQuoteName(!params.is("q"));
        fmt.setIgnoreNull(params.is("n"));

        if (params.has("e")) {
            String regex = params.get("e");
            if (regex.startsWith("!")) {
                fmt.setLocked(regex.substring(1));
            } else {
                fmt.setActived(regex);
            }
        }

        if (params.has("d")) {
            fmt.setDateFormat(params.get("d"));
        }

        // 深层的修改键值
        if (params.has("prefix")) {

            // 分析参数
            final _Context C = new _Context();
            C.prefix = params.get("prefix");
            C.pKey = params.get("prefix_key");
            C.recur = params.is("r");
            if (null != C.pKey) {
                C.not = C.pKey.startsWith("!");
                if (C.not)
                    C.pKey = C.pKey.substring(1);
            }

            // 执行修改
            Lang.convertMapKey(obj, new MapKeyConvertor() {
                public String convertKey(String key) {
                    // 所有
                    if (null == C.pKey)
                        return C.prefix + key;

                    // 匹配
                    if (key.matches(C.pKey))
                        return C.not ? key : C.prefix + key;

                    // 不匹配
                    return C.not ? C.prefix + key : key;
                }
            }, C.recur);
        }
        
        if (params.has("u")) {
        	NutMap map = Json.fromJson(NutMap.class, params.get("u"));
        	if (map != null && map.size() > 0) {
        		((Map<String, Object>)obj).putAll(map);
        	}
        }

        // 最后输出
        sys.out.println(Json.toJson(obj, fmt));

    }

}
