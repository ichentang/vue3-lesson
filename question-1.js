const person = {
  name: 'guang',
  get aliasName() {
    return this.name + "TOM"
  }
}

let proxyPerson = new Proxy(person, {
  get(target, key, receiver) {
    // receiver是代理对象

    console.info('key :>> ', key);

    // return target[key]
    // return receiver[key]
    return Reflect.get(target, key, receiver)
  }
})

console.info('proxyPerson :>> ', proxyPerson.aliasName);
