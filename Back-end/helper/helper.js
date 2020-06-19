const faker = require('faker');
const R = require('ramda');
const fetch = require('node-fetch');
const { unique_list } = require('/home/tiago/AppBuild/components/lib/func.js');

(async () => {

  const justWait = time => { return new Promise(rev => { setTimeout(() => { console.log("Oi"); rev() }, time) }) }
  const sequence = v => v.length <= 0 ? new Promise(resolve => resolve(unique_list.new(x => y => x == y))) : new Promise(async resolve => {
    const s = await sequence(v.slice(1, v.length))
    unique_list.insertAll(s, [await (v[0]())])
    resolve(s);
  })

  const repeat = x => y => y <= 0 ? [] : (() => {
    const r = repeat (x) (y-1)
    r.push(x)
    return r;
  }) ()
   
  const resp = () =>
    new Promise(async resolve => {
      const random = Math.round(Math.random())
   //   await justWait(2000)
      console.log("ué")
      resolve(await fetch("https://source.unsplash.com/featured/?{" + (random ? "man" : "woman") + "}"))
    })



  console.log(unique_list.getList((await sequence (repeat(resp)(100)))).map(({url}) => url))

})()
