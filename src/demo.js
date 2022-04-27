const bucket = new WeakMap()
const TriggerType = {
  SET: 'SET',
  ADD: 'ADD',
  DELETE: 'DELETE'
}

const obj = { foo: 1 }
// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
// effect 栈
const effectStack = []

function effect(fn, options = {}) {
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

function cleanup(effectFn) {
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

function track(target, key) {
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

function trigger(target, key, type) {
  const desMap = bucket.get(target)
  if (!desMap) return
  const effects = desMap.get(key)
  const iterateEffects = desMap.get(ITERATE_KEY)
  const effectToRun = new Set()
  effects && effects.forEach(effectFn => {
    effectToRun.add(effectFn)
  })
  if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    iterateEffects && iterateEffects.forEach(effectFn => {
      effectToRun.add(effectFn)
    })
  }
  effectToRun.forEach((effectFn) => {
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
const ITERATE_KEY = Symbol()
const px = new Proxy(obj, {
  // 拦截读取操作
  get(target, key, receiver) {
    // 收集依赖
    track(target, key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, newVal, receiver) {
    const type = Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.Set : TriggerType.ADD
    target[key] = newVal
    // 设置属性值
    const res = Reflect.set(target, key, newVal, receiver)
    // 触发依赖
    trigger(target, key, type)
    return res
  },
  ownKeys(target) {
    track(target, ITERATE_KEY)
    return Reflect.ownKeys(target)
  },
  has(target, key) {
    track(target, key)
    return Reflect.has(target, key)
  },
  deleteProperty(target, key) {
    const hadKey = Object.prototype.hasOwnProperty.call(target, key)
    const res = Reflect.deleteProperty(target, key)
    if (hadKey && res) {
      trigger(target, key, TriggerType.DELETE)
    }
    return res
  }
})

const jobQueue = new Set()
const p = Promise.resolve()
let isFlushing = false

function flushJog() {
  if (isFlushing) return
  isFlushing = true
  p.then(() => {
    jobQueue.forEach((job) => job())
  }).finally(() => {
    isFlushing = false
  })
}

function computed(getter) {
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
    },
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
    },
  }
  return obj
}

function traverse(value, seen = new Set()) {
  if (typeof value !== 'object' || value === null || seen.has(value)) return
  seen.add(value)
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}

function watch(source, cb, options = {}) {
  let getter
  let newValue
  let oldValue
  // cleanup 用来存储用户注册 的过期回调
  let cleanup
  function onInvalidate(fn) {
    // 将过期回调存储到 cleanup 中
    cleanup = fn
  }
  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source)
  }
  // 提取 scheduer 调度函数为一个独立的 job 函数
  const job = () => {
    newValue = effectFn()
    if (cleanup) {
      cleanup()
    }
    cb(newValue, oldValue, onInvalidate)
    oldValue = newValue
  }
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler: () => {
      if (options.flush === 'post') {
        const p = Promise.resolve()
        p.then(job)
      } else {
        job()
      }
    },
  })
  if (options.immediate) {
    // 当immediate 为 true 时立即执行 job，从而触发回调执行
    job()
  } else {
    oldValue = effectFn()
  }
}

let finalData
let fetchA = true
watch(obj, async (newValue, oldValue, onInvalidate) => {
  // 定义一个标志，代表当前副作用函数是否过期，默认为 false ，代表没有过期
  let expired = false
  onInvalidate(() => {
    expired = true
  })
  const requestUrl = fetchA
    ? 'https://www.fastmock.site/mock/eb259ab82df9fa23480763b128dd0b4a/api/api/use-list1'
    : 'https://www.fastmock.site/mock/eb259ab82df9fa23480763b128dd0b4a/api/api/use-list2'

  const res = await fetch(requestUrl).then((res) => {
    return res.json()
  })
  if (!expired) {
    finalData = res.body.userList
    console.log(finalData)
  }
})

effect(() => {
  console.log('effect 执行了')
  for (const key in px) {
    console.log(key)
  }
})
