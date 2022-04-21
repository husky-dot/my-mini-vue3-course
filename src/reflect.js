const obj = { 
  get foo () {
    return this.foo
  }
 }

console.log(Reflect.get(obj, 'foo', { foo: 2}))
