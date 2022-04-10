
const bucket = new WeakMap()

const data = { foo: 1, bar: 4}
// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
// effect 栈
const effectStack = []

function effect (fn, options = {}) {
  const effectFn = () => {
    console.log('effectFn执行了')
    cleanup(effectFn)
    // 当调用副作用函数之前将当前副作用函数压入栈中
    activeEffect = effectFn
    effectStack.push(effectFn)
    const res = fn()
    // 在当前副作用函数执行完毕后，将当前副作用函数弹出栈，并把 activeEffect 还原为之前的值
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.options = options
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  if (!options.lazy) {
    // 执行副作用函数
    effectFn()
  }
  return effectFn
}

function cleanup (effectFn) {
  // 遍历 effectFn.deps 数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    // deps 是依赖集合
    const deps = effectFn.deps[i]
    // 将 effectFn 从依赖依赖中移除
    deps.delete(effectFn)
  }
  // 最后需要重置 effectFn.deps 数组
  effectFn.deps.length = 0
}

function track (target, key) {
  // 没有 activeEffect 直接  return
  if (!activeEffect) return
  let desMap = bucket.get(target)
  if (!desMap) {
    desMap = new Map()
    bucket.set(target, desMap)
  }
  let deps = desMap.get(key)
  if (!deps) {
    deps = new Set()
    desMap.set(key, deps)
  }
  // 把当前激活的副作用函数添加到依赖集合 deps 中
  deps.add(activeEffect)
  // deps 就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到 activeEffect.deps 数组中
  activeEffect.deps.push(deps)
}

function trigger (target, key) {
  const desMap = bucket.get(target)
  if (!desMap) return
  const effects = desMap.get(key)
  const effectToRun = new Set(effects)
  effectToRun.forEach(effectFn => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      if (effectFn !== activeEffect) {
        effectFn()
      }
    }
  })
  // effects && effects.forEach(fn => fn())
}
const obj = new Proxy(data,  {
  // 拦截读取操作
  get (target, key) {
    // 收集依赖
    track(target, key)
    return target[key]
  },
  set (target, key, newVal) {
    target[key] = newVal
    // 触发依赖
    trigger(target, key)
    return true
  }
})

const jobQueue = new Set()
const p = Promise.resolve()
let isFlushing = false

function flushJog () {
  if (isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => job())
  }).finally(() => {
    isFlushing = false
  })
}

function computed (getter) {
  let value
  let dirty = true
  // 把 getter 作为副作用函数，创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      if (!dirty) {
        dirty = true
        trigger(obj, 'value')
      }
  
    }
  })
  const obj = {
    // 当读取 value 时执行 effectFn
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value')
      return value 
    }
  }
  return obj
}

const sumRes = computed(() => obj.foo + obj.bar)

effect(() => {
  console.log(sumRes.value)
})
obj.foo++











