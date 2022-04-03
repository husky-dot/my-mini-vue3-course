
const bucket = new WeakMap()

const data = { foo: true, bar: true}
// 保存当前被注册副作用函数
let activeEffect
const effectStack = []

function effect (fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn
    effectStack.push(effectFn)
    fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  effectFn.deps = []
  effectFn()
}

function cleanup (effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

function track (target, key) {
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
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger (target, key) {
  const desMap = bucket.get(target)
  if (!desMap) return
  const effects = desMap.get(key)
  const effectToRun = new Set(effects)
  effectToRun.forEach(effectFn => effectFn())
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

// effect(function effectFn() {
//   console.log('effect run')
//   document.body.innerText = obj.ok ? obj.text : 'not'
// })

// setTimeout(() => {
//   obj.text = 'hello vue3'
// }, 3000)


let tmp1, tmp2

effect(function effectFn1() {
  console.log('effectFn1 执行了')
  effect(function effectFn2() {
    console.log('effectFn2 执行')
    tmp2 = obj.bar
  })
  tmp1 = obj.foo
})

