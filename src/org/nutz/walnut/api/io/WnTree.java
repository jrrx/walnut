package org.nutz.walnut.api.io;

import java.util.List;

import org.nutz.lang.Each;
import org.nutz.lang.util.Callback;
import org.nutz.lang.util.NutMap;
import org.nutz.walnut.util.UnitTestable;

public interface WnTree extends UnitTestable {

    boolean exists(WnObj p, String path);

    boolean existsId(String id);

    WnObj checkById(String id);

    WnObj check(WnObj p, String path);

    WnObj fetch(WnObj p, String path);

    WnObj fetch(WnObj p, String[] paths, int fromIndex, int toIndex);

    void walk(WnObj p, Callback<WnObj> callback, WalkMode mode);

    WnObj move(WnObj src, String destPath);

    WnObj move(WnObj src, String destPath, int mode);

    WnObj rename(WnObj o, String nm);

    void set(WnObj o, String regex);

    /**
     * 设置某对象的一个值，并直接返回设置前/后的对象元数据
     * 
     * @param id
     *            对象 ID
     * @param map
     *            要修改的值表
     * @param returnNew
     *            如果是 true 返回修改后的值
     * @return 修改前/后 对象
     */
    WnObj setBy(String id, NutMap map, boolean returnNew);

    /**
     * 设置符合条件的某一对象的一组值，并直接返回设置前/后的对象元数据
     * 
     * @param q
     *            对象查询条件
     * @param map
     *            要修改的值表
     * @param returnNew
     *            如果是 true 返回修改后的值
     * @return 修改前/后 对象
     */
    WnObj setBy(WnQuery q, NutMap map, boolean returnNew);

    /**
     * 返回修改前/后值
     * 
     * @see #inc(WnQuery, String, int, boolean)
     */
    int inc(String id, String key, int val, boolean returnNew);

    /**
     * 「同步」修改符合条件的某对象的某个整型元数据，并返回
     * 
     * @param q
     *            对象查询条件
     * @param key
     *            元数据名称
     * @param val
     *            修改的值
     * @param returnNew
     *            如果是 true 返回修改后的值
     * @return 修改前/后的值
     */
    int inc(WnQuery q, String key, int val, boolean returnNew);

    int getInt(String id, String key, int dft);

    long getLong(String id, String key, long dft);

    String getString(String id, String key, String dft);

    <T> T getAs(String id, String key, Class<T> classOfT, T dft);

    WnObj createIfNoExists(WnObj p, String path, WnRace race);

    WnObj create(WnObj p, String path, WnRace race);

    WnObj create(WnObj p, String[] paths, int fromIndex, int toIndex, WnRace race);

    WnObj createById(WnObj p, String id, String name, WnRace race);

    void delete(WnObj o);

    WnObj get(String id);

    WnObj getOne(WnQuery q);

    WnObj getRoot();

    String getRootId();

    boolean isRoot(String id);

    boolean isRoot(WnObj o);

    int each(WnQuery q, Each<WnObj> callback);

    List<WnObj> query(WnQuery q);

    List<WnObj> getChildren(WnObj o, String name);

    long count(WnQuery q);

    boolean hasChild(WnObj p);

}
