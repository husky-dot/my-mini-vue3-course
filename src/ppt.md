### 什么是代理？

指的是对一个对象的基本语义的代理。它允许我们拦截并重新定义一个对象的基本操作。

```
obj.foo
obj.foo++

const p = new Proxy(obj, {
  get() {},
  set() {}
})
```

```
obj.fn()
```

### 记住

Proxy 只能拦截对一个对象的基本操作

Map  Set