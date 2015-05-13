package org.nutz.walnut.impl.box;

import java.io.Closeable;
import java.io.Flushable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Writer;

import org.nutz.json.Json;
import org.nutz.json.JsonFormat;
import org.nutz.lang.Lang;
import org.nutz.lang.Streams;

public class JvmBoxOutput implements Flushable, Closeable {

    private OutputStream ops;

    private Writer __w;

    public JvmBoxOutput(OutputStream ops) {
        this.ops = ops;
        this.__w = Streams.utf8w(ops);
    }

    public void write(InputStream ins) {
        try {
            Streams.write(ops, ins);
            ops.flush();
        }
        catch (IOException e) {
            throw Lang.wrapThrow(e);
        }
    }

    public void write(byte[] b) {
        write(b, 0, b.length);
    }

    public void write(byte[] b, int off, int len) {
        try {
            ops.write(b, off, len);
            ops.flush();
        }
        catch (IOException e) {
            throw Lang.wrapThrow(e);
        }
    }

    public void writeLine() {
        write("\n");
    }

    public void writeLine(CharSequence msg) {
        write(msg + "\n");
    }

    public void writeLinef(String fmt, Object... args) {
        write(String.format(fmt, args) + "\n");
    }

    public void writeJson(Object o, JsonFormat fmt) {
        Json.toJson(__w, o, fmt);
        try {
            __w.flush();
        }
        catch (IOException e) {
            throw Lang.wrapThrow(e);
        }
    }

    public void write(CharSequence msg) {
        try {
            __w.write(null == msg ? "null" : msg.toString());
            __w.flush();
        }
        catch (IOException e) {
            throw Lang.wrapThrow(e);
        }
    }

    @Override
    public void flush() {
        Streams.safeFlush(__w);
        Streams.safeFlush(ops);
    }

    @Override
    public void close() {
        flush();
        Streams.safeClose(ops);
    }

}