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
const agreement = "https";
const domain = "kizy.cc";

const commitHash = "c3204f5e";

const clonePath = `git@github.com:${userName}/${repoName}.git`;
const keyHash = hash(`${userName}${repoName}${commitHash}`);
const key = keyHash.hex();

async function init() {
  client.on("error", (err) => console.log("Redis Client Error", err));
  await client.connect();
  const isDeploy = await client.get(key);
  if (isDeploy) {
    console.log("isDeploy, key:", key);
    console.log(`url: ${agreement}://${domain}/${key}`);
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
  execSync("nginx -s reload");

  console.log(`url: ${agreement}://${domain}/${key}`);

  execSync(`rm -rf ${repoName}`);
}
init();
