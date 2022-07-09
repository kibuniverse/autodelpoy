import { execSync } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { hash } from "fnv-plus";
import express from "express";
import expressWs from "express-ws";
import { createClient } from "redis";

const client = createClient();
const app = express();
expressWs(app);

const userName = "kibuniverse";
const repoName = "test-autodeploy";

const commitHash = "f95a7c3";

const clonePath = `git@github.com:${userName}/${repoName}.git`;
const keyHash = hash(`${userName}${repoName}${commitHash}`);
const key = keyHash.hex();

async function init() {
  client.on("error", (err) => console.log("Redis Client Error", err));
  await client.connect();
  const isDeploy = await client.get(key);
  if (isDeploy) {
    console.log("isDeploy, key:", key);
    return;
  }
  await client.set(key, "is deployed");

  // one day
  const expireTime = 60 * 60 * 24 * 2;
  await client.expire(key, expireTime);

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
  app.ws("/deploy", (ws, req) => {
    ws.send("perpare start build");
    ws.on("start", function (msg) {
      console.log(msg);
    });
  });
}
init();
