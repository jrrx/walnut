package org.nutz.walnut.impl.box;

import java.io.InputStream;
import java.io.OutputStream;

import org.nutz.lang.Encoding;
import org.nutz.lang.Streams;
import org.nutz.lang.Strings;
import org.nutz.lang.random.R;
import org.nutz.lang.util.Callback;
import org.nutz.log.Log;
import org.nutz.log.Logs;
import org.nutz.repo.Base64;
import org.nutz.walnut.api.box.WnBox;
import org.nutz.walnut.api.box.WnBoxContext;
import org.nutz.walnut.api.box.WnBoxService;
import org.nutz.walnut.api.box.WnBoxStatus;
import org.nutz.walnut.util.Cmds;

public class JvmBox implements WnBox {

    private static final Log log = Logs.get();

    OutputStream out;

    OutputStream err;

    InputStream in;

    private String id;

    private JvmAtomRunner runner;

    private Callback<WnBoxContext> on_before_free;

    public JvmBox(WnBoxService boxes) {
        id = R.UU32();
        runner = new JvmAtomRunner(boxes);
        runner.boxId = id;
        runner.status = WnBoxStatus.FREE;
    }

    @Override
    public String id() {
        return id;
    }

    @Override
    public WnBoxStatus status() {
        return runner.status;
    }

    void setJvmExecutorFactory(JvmExecutorFactory jef) {
        runner.jef = jef;
    }

    @Override
    public void setup(WnBoxContext bc) {
        runner.bc = bc;
    }

    @Override
    public void onBeforeFree(Callback<WnBoxContext> handler) {
        this.on_before_free = handler;
    }

    @Override
    public void run(String cmdText) {
        String[] cmdLines = Cmds.splitCmdLine(cmdText);

        for (String cmdLine : cmdLines) {
            if (Strings.isBlank(cmdLine))
                continue;
            if (Strings.trim(cmdLine).endsWith("&")) {
                cmdLine = cmdLine.substring(0, cmdLine.length() -1);
                cmdLine = "job add -base64 true " + Base64.encodeToString(cmdLine.getBytes(Encoding.CHARSET_UTF8), false);
            }
            runner.run(cmdLine);
            runner.wait_for_idle();
        }
    }

    void idle() {
        runner.status = WnBoxStatus.IDLE;
    }

    void free() {
        // 调用回调
        if (null != this.on_before_free) {
            this.on_before_free.invoke(runner.bc);
            this.on_before_free = null;
        }

        // 释放主运行器
        runner.__free();

        // 释放其他资源
        if (log.isDebugEnabled())
            log.debug("box: release resources");
        Streams.safeClose(out);
        Streams.safeClose(in);
        Streams.safeClose(err);

    }

    @Override
    public void setStdout(OutputStream out) {
        this.out = out;
        runner.out = new EscapeCloseOutputStream(out);
    }

    @Override
    public void setStderr(OutputStream err) {
        this.err = err;
        runner.err = new EscapeCloseOutputStream(err);
    }

    @Override
    public void setStdin(InputStream in) {
        this.in = in;
        runner.in = new EscapeCloseInputStream(in);
    }

}
