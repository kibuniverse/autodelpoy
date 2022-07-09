import { createClient } from "redis";
const client = createClient();

async function init() {
  client.on("error", (err) => console.log("Redis Client Error", err));

  await client.connect();

 
  await client.expire('key', 10)
  const value = await client.get("key");
  console.log(value);
}

init();
d