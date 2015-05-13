package org.nutz.walnut.impl.io.local.tree;

import org.nutz.walnut.Wnts;
import org.nutz.walnut.api.io.AbstractWnStoreTest;
import org.nutz.walnut.api.io.WnNode;

public class LocalTreeWnStoreTest extends AbstractWnStoreTest {

    @Override
    protected WnNode _create_top_tree_node() {
        return Wnts.create_tree_node(pp, "mnt-local-a");
    }

}