```
effect(effectFn1() {
  effect(effectFn2() {
    // ***
  })
})
```
```
const Foo = {
  render () {
    return // **
  }
}
```

```
effect(() => {
  Foo.render()
})
```

```
const Bar = {
  render () {
    return // **
  }
}
const Foo = {
  render () {
    return <Bar />
  }
}
```