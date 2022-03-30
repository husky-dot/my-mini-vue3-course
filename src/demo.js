
const bucket = new WeakMap()

const data = { text: 'hello world'}
// 保存当前被注册副作用函数
let activeEffect

function effect (fn) {
  activeEffect = fn
  fn()
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
}

function trigger (target, key) {
  const desMap = bucket.get(target)
  if (!desMap) return
  const effects = desMap.get(key)
  effects && effects.forEach(fn => fn())
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

effect(function effectFn() {
  console.log('effect run')
  document.body.innerText = obj.text
})

setTimeout(() => {
  obj.text = 'hello vue3'
}, 3000)

