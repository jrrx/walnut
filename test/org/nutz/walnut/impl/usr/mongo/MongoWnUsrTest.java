package org.nutz.walnut.impl.usr.mongo;

import org.nutz.walnut.Wnts;
import org.nutz.walnut.api.io.WnNode;
import org.nutz.walnut.impl.usr.BaseIoWnUsrTest;

public class MongoWnUsrTest extends BaseIoWnUsrTest {

    @Override
    protected WnNode _create_top_tree_node() {
        return Wnts.create_tree_node(pp, "mnt-mongo-a");
    }

}