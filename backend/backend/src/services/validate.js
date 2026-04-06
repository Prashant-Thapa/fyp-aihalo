function validateInput(...data) {
  for (let value of data) {
    if (value === undefined || value === null || value === "") {
      return false;
    }
  }
  return true;
}

module.exports = { validateInput };
