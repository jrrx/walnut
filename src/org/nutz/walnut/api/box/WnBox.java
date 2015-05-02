package org.nutz.walnut.api.box;

import java.io.InputStream;
import java.io.OutputStream;

public interface WnBox {

    String id();

    WnBoxStatus status();

    WnBoxRuntime runtime();

    void setup(WnBoxContext bc);

    void run(String cmdLines);

    void setStdout(OutputStream ops);

    void setStderr(OutputStream ops);

    void setStdin(InputStream ins);

    void waitForIdle();

}
