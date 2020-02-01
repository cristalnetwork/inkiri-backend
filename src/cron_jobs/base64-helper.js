exports.toBase64 = (str) => {
  const b = new Buffer.from(str.trim() + ':');
  return 'Basic ' + b.toString('base64');
}