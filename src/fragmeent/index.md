// oldChildren
[
{ type: 'p' },
{ type: 'div' },
{ type: 'span' }
]

// newChildren

[
{ type: 'span' },
{ type: 'p' },
{ type: 'div' }
]



// oldChildren
[
{ type: 'p', children: '1' },
{ type: 'p', children: '2' },
{ type: 'p', children: '3' },
]

// newChildren
[
{ type: 'p', children: '3' },
{ type: 'p', children: '1' },
{ type: 'p', children: '2' },
]



// oldChildren
[
{ type: 'p', children: '1', key: 1},
{ type: 'p', children: '2' key: 2},
{ type: 'p', children: '3' key: 3},
]

// newChildren
[
{ type: 'p', children: '3', key: 3},
{ type: 'p', children: '1', key: 1},
{ type: 'p', children: '2', key: 2},
]



const oldVNode = { type: 'p', key: 1, children: 'text 1' }
const newVNode = { type: 'p', key: 1, children: 'text 2' }