const person = {
  name: 'guang',
  get aliasName() {
    return this.name + "TOM"
  }
}

let proxyPerson = new Proxy(person, {
  get(target, key, recevier) {
    // recevier是代理对象

    console.info('key :>> ', key);

    // return target[key]
    // return recevier[key]
    return Reflect.get(target, key, recevier)
  }
})

console.info('proxyPerson :>> ', proxyPerson.aliasName);
