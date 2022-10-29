
const bucket = new Set()

const data = { text: 'hello world'}
// 保存当前被注册副作用函数
let activeEffect
function effect (fn) {
  activeEffect = fn
  fn()
}

const obj = new Proxy(data,  {
  // 拦截读取操作
  get (target, key) {
    bucket.add(activeEffect)
    return target[key]
  },
  set (target, key, newVal) {
    target[key] = newVal
    bucket.forEach(fn => fn())
    return true
  }
})

effect(() => {
  console.log('effect run')
  document.body.innerText = obj.text
})

setTimeout(() => {
  obj.text = 'hello vue3'
}, 3000)