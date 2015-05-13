package org.nutz.walnut.web.module;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.nutz.ioc.loader.annotation.IocBean;
import org.nutz.json.Json;
import org.nutz.json.JsonFormat;
import org.nutz.lang.Lang;
import org.nutz.lang.Strings;
import org.nutz.lang.segment.Segment;
import org.nutz.lang.segment.Segments;
import org.nutz.lang.util.Context;
import org.nutz.lang.util.NutMap;
import org.nutz.mvc.View;
import org.nutz.mvc.annotation.*;
import org.nutz.mvc.view.JspView;
import org.nutz.mvc.view.ServerRedirectView;
import org.nutz.mvc.view.ViewWrapper;
import org.nutz.walnut.api.err.Er;
import org.nutz.walnut.api.io.WnObj;
import org.nutz.walnut.api.usr.WnSession;
import org.nutz.walnut.util.Wn;
import org.nutz.walnut.web.bean.WnApp;
import org.nutz.walnut.web.filter.WnCheckSession;
import org.nutz.walnut.web.view.WnObjDownloadView;

@IocBean
@At("/a")
@Filters(@By(type = WnCheckSession.class))
public class AppModule extends AbstractWnModule {

    @At("/open/**")
    @Ok("jsp:jsp.app")
    @Fail("jsp:jsp.show_text")
    public View open(String str, @Param("m") boolean meta) throws UnsupportedEncodingException {
        str = Strings.trim(str);
        str = URLDecoder.decode(str, "UTF-8");

        // 分析
        int pos = str.indexOf(':');
        String appName;
        if (pos > 0) {
            appName = str.substring(0, pos);
            str = Strings.trim(str.substring(pos + 1));
        } else {
            appName = str;
            str = null;
        }

        // 找到应用
        WnObj oAppHome = this._check_app_home(appName);

        // 得到会话对象
        WnSession se = Wn.WC().checkSE();

        // 得到要处理的对象
        WnObj o = null;
        if (!Strings.isEmpty(str)) {
            str = URLDecoder.decode(str, "UTF-8");
            o = Wn.checkObj(io, se, str);
            if (meta)
                o.setv(Wn.OBJ_META_RW, true);
            // 看看是否需要重定向一下
            if (!str.startsWith("~") && !str.startsWith("/") && !str.startsWith("id:")) {
                String url = "/a/open/" + appName + ":id:" + o.id();
                if (meta || o.getBoolean(Wn.OBJ_META_RW)) {
                    url += "?m=true";
                }
                return new ServerRedirectView(url);
            }
        }

        // 生成 app 的对象
        WnApp app = new WnApp();
        app.setObj(o);
        app.setSession(Wn.WC().checkSE());
        app.setName(appName);

        // 这个是 app 的 JSON 描述
        String appJson = Json.toJson(app, JsonFormat.forLook().setQuoteName(true));

        // 临时设置一下当前目录
        se.env("PWD", oAppHome.path());

        // 这个是要输出的模板
        String tmpl;

        // 如果存在 `init_tmpl` 文件，则执行，将其结果作为模板
        WnObj oInitTmpl = io.fetch(oAppHome, "init_tmpl");
        if (null != oInitTmpl) {
            String cmdText = io.readText(oInitTmpl);
            tmpl = _run_cmd("app-init-tmpl:", se, appJson, cmdText);
        }
        // 否则查找静态模板文件
        else {
            tmpl = __find_tmpl(appName, oAppHome);
        }

        // 分析模板
        Segment seg = Segments.create(tmpl);

        // 如果存在 `init_context` 文件，则执行，将其结果合并到渲染上下文中
        NutMap map = null;
        WnObj oInitContext = io.fetch(oAppHome, "init_context");
        if (null != oInitContext) {
            String cmdText = io.readText(oInitContext);
            String contextJson = _run_cmd("app-init-context", se, appJson, cmdText);
            map = Json.fromJson(NutMap.class, contextJson);
        }

        // 标题
        String title = appName;
        if (null != o)
            title = o.name() + " : " + title;

        // 填充模板占位符
        Context c = Lang.context();
        c.set("title", title);
        c.set("rs", conf.get("app-rs"));
        c.set("appName", appName);
        c.set("app", appJson);
        c.set("appClass", appName.replace('.', '_').toLowerCase());
        if (null != map)
            c.putAll(map);

        // 渲染输出
        return new ViewWrapper(new JspView("jsp.app"), seg.render(c));
    }

    private String __find_tmpl(String appName, WnObj oAppHome) {
        // 找到主界面模板
        String tt = "pc"; // 可以是 "pc" 或者 "mobile"

        WnObj oTmpl = io.fetch(oAppHome, tt + "_tmpl.html");

        // 没有模板则一层层向上寻找
        if (null == oTmpl) {
            String nm = "dft_app_" + tt + "_tmpl.html";
            WnObj p = oAppHome;
            while (null == oTmpl && null != p && !p.isRootNode()) {
                p = io.get(p.parent());
                oTmpl = io.fetch(p, nm);
            }
            if (null == oTmpl) {
                throw Er.create("e.app.notemplate", appName);
            }
        }

        // 读取模板并分析
        String tmpl = io.readText(oTmpl);
        return tmpl;
    }

    @At("/load/?/**")
    @Ok("void")
    @Fail("http:404")
    public View load(String appName, String rsName) {
        WnObj oAppHome = this._check_app_home(appName);
        WnObj o = io.check(oAppHome, rsName);
        return new WnObjDownloadView(io, o);
    }

    @At("/run/?/**")
    @Ok("void")
    public void run(String appName,
                    String mimeType,
                    HttpServletRequest req,
                    HttpServletResponse resp) throws IOException {

        // 得到命令行
        String cmdText = Strings.trim(URLDecoder.decode(req.getQueryString(), "UTF-8"));

        // 默认返回的 mime-type 是文本
        if (Strings.isBlank(mimeType))
            mimeType = "text/plain";
        resp.setContentType(mimeType);

        // 准备输出
        OutputStream out = new AppRespOutputStreamWrapper(resp, 200);
        OutputStream err = new AppRespOutputStreamWrapper(resp, 500);

        // 运行
        WnSession se = Wn.WC().checkSE();
        _run_cmd("", se, cmdText, out, err, null);
    }

}