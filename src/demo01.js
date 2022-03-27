/**
 * 响应式数据的基本实现
 */
const obj = {
  text: 'vue2'
}
function effect() {
  // 不执行
  document.body.innerHTML = obj.text
}

obj.text = 'vue3'
