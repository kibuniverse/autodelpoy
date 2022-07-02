import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { generateKey } from "./utils";
import express from "express";
const app = express();
const userName = "kibuniverse";
const repoName = "test-autodeploy";

const commitHash = "f95a7c3";

const clonePath = `git@github.com:${userName}/${repoName}.git`;
const key = generateKey({ userName, repoName, commitHash });

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
// move dist dir
execSync(`cd ${repoName} && cp -r dist/ /var/www/${key}`);
// add nginx conf
const nginxConf = `location /${key} {  
  alias /var/www/${key}/;
}`;
writeFileSync(`/etc/nginx/locations/${key}.conf`, nginxConf);
// restart nginx
console.log("key", key);
execSync("nginx -s reload");
app.listen(3002, () => {
  console.log("启动在3000端口");
});
