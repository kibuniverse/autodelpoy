export const generateKey = ({ userName, repoName, commitHash }) => {
  const a = `${userName}${repoName}${commitHash}`;
  const b = [];
  const splitNum = 3;
  let index = 0;
  for (let i = 0; i < a.length; i++) {
    index = Math.floor(i / splitNum);
    if (!b[index]) {
      b[index] = [];
    }
    b[index].push(a.charCodeAt(i));
  }
  const ans = b
    .map((item) => {
      const c = item.reduce((acc, cur) => {
        return acc + cur;
      }, 0);
      const d = Math.floor(c / splitNum);
      const e = String.fromCharCode(d);
      return e;
    })
    .join("");
  return ans;
};
