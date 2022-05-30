// demo01
// const obj = {
//   val: 0,
//   [Symbol.iterator]() {
//     return {
//       next() {
//         return {
//           value: obj.val++,
//           done: obj.val > 10 ? true : false,
//         }
//       },
//     }
//   },
// }

// for (const value of obj) {
//   console.log(value)
// }

// demo02
// const arr = [1, 2, 3, 4, 5]
// // 获取并调用数组内建的迭代方法
// const itr = arr[Symbol.iterator]()

// console.log(itr.next())
// console.log(itr.next())
// console.log(itr.next())
// console.log(itr.next())
// console.log(itr.next())

