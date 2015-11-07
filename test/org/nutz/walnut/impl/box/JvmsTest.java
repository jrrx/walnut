package org.nutz.walnut.impl.box;

import static org.junit.Assert.*;

import org.junit.Test;

public class JvmsTest {

    @Test
    public void test_split_with_escape_quote() {
        String[] list = Jvms.split("a \"nm:\\\"A\\\"\"", false, ' ');
        assertEquals(2, list.length);
        assertEquals("a", list[0]);
        assertEquals("nm:\"A\"", list[1]);
    }

    @Test
    public void test_split_by_whitespace() {
        String[] list = Jvms.split("  a   b   ", false, ' ');
        assertEquals(2, list.length);
        assertEquals("a", list[0]);
        assertEquals("b", list[1]);
    }

    @Test
    public void test_by_eacape() {
        String[] list = Jvms.split("a\\nb | a\\ b", true, '|');
        assertEquals(2, list.length);
        assertEquals("anb ", list[0]);
        assertEquals(" a b", list[1]);
    }

    @Test
    public void test_by_escape_in_quote() {
        String[] list = Jvms.split("me -set \"PS1=\\u:\\W$\"", true, '|');
        assertEquals(1, list.length);
        assertEquals("me -set \"PS1=\\u:\\W$\"", list[0]);
    }

    @Test
    public void test_pipes_parse2() {
        String[] list = Jvms.split("a | b 'x' | d ", true, '|');
        assertEquals(3, list.length);
        assertEquals("a ", list[0]);
        assertEquals(" b 'x' ", list[1]);
        assertEquals(" d ", list[2]);
    }

    @Test
    public void test_pipes_parse() {
        String[] list = Jvms.split(" a 'x' ", true, '|');
        assertEquals(1, list.length);
        assertEquals(" a 'x' ", list[0]);
    }

    @Test
    public void test_tokens_parse() {
        String[] list = Jvms.split("echo 'a'bc", true, ' ');
        assertEquals(2, list.length);
        assertEquals("echo", list[0]);
        assertEquals("'a'bc", list[1]);

        list = Jvms.split("echo 'a b'", false, ' ');
        assertEquals(2, list.length);
        assertEquals("echo", list[0]);
        assertEquals("a b", list[1]);
    }

}
