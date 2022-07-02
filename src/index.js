import { execSync } from "child_process";
import { existsSync } from "fs";
import { generateKey } from "./utils";
import express from "express";
const app = express();
const userName = "kibuniverse";
const repoName = "test-autodeploy";

const clonePath = `git@github.com:${userName}/${repoName}.git`;
const commitHash = "ad246b838a30f70a351779a677352ad6968e3da8";
const key = generateKey({ userName, repoName, commitHash });
app.use(express.static(commitHash));
if (!existsSync(repoName)) {
  execSync(`git clone ${clonePath}`);
}
execSync(
  `cd ${repoName} && git fetch && git checkout ${commitHash} && pnpm i && pnpm build`,
  {
    cwd: "./",
  }
);
console.log("build success");
execSync(`cd ${repoName} && cp -r dist/ /var/www/${key}`);

app.listen(3002, () => {
  console.log("启动在3000端口");
});
