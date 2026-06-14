const hexToOklch = hex => {
  // approximation or just output the css okclh
  return `oklch(from ${hex} l c h)`;
}
console.log(hexToOklch("#C9D0D9"));
