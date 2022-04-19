
const fn = (name) => {
  console.log('我是' + name)
}

const p2 = new Proxy(fn, {
  apply(target, thisArgs, argArray) {
    console.log('apply 被调用了')
    target.call(thisArgs, ...argArray)
  }
})

p2('小智')