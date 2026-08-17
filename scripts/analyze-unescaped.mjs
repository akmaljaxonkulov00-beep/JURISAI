// react/no-unescaped-entities xatolarini fayl:qator bilan chiqarish
let s = ''
process.stdin.on('data', (d) => (s += d))
process.stdin.on('end', () => {
  const files = JSON.parse(s)
  for (const f of files) {
    for (const m of f.messages) {
      if (m.ruleId === 'react/no-unescaped-entities') {
        const name = f.filePath.replace(/\\/g, '/').split('/src/')[1]
        console.log(`${name}:${m.line}  ->  ${m.message.slice(0, 90)}`)
      }
    }
  }
})
