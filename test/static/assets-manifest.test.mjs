import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../../", import.meta.url);
const manifestUrl = new URL("assets/manifest.json", projectRoot);

test("核准資產清單只引用可部署的 WebP，且角色主檔不超過 250KB", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  assert.equal(manifest.schemaVersion, 1);
  assert.ok(Array.isArray(manifest.assets));
  assert.ok(manifest.assets.length >= 20);

  const ids = new Set();
  for (const asset of manifest.assets) {
    assert.equal(ids.has(asset.id), false, `重複資產 id：${asset.id}`);
    ids.add(asset.id);
    assert.equal(asset.approved, true);
    assert.match(asset.path, /^assets\/.+\.webp$/);
    assert.equal(asset.path.includes("/candidates/"), false);
    assert.ok(asset.alt);

    const assetStat = await stat(new URL(asset.path, projectRoot));
    assert.ok(assetStat.size > 0);
    if (asset.kind === "character") {
      assert.ok(
        assetStat.size <= 250 * 1024,
        `${asset.id} 超過 250KB：${assetStat.size}`,
      );

      const budgets = new Map([
        [256, 60 * 1024],
        [512, 110 * 1024],
        [1024, 250 * 1024],
      ]);
      assert.deepEqual(
        asset.sources.map(({ width }) => width),
        [...budgets.keys()],
      );
      for (const source of asset.sources) {
        assert.match(source.path, /^assets\/.+\.webp$/);
        const sourceStat = await stat(new URL(source.path, projectRoot));
        assert.ok(
          sourceStat.size <= budgets.get(source.width),
          `${asset.id} ${source.width}w 超過預算：${sourceStat.size}`,
        );
      }
    }
  }
});

test("墨尾行者四狀態成組核准，路徑與狀態皆唯一", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const states = manifest.assets
    .filter(({ characterId }) => characterId === "ink-tail-guide")
    .map(({ state }) => state)
    .sort();

  assert.deepEqual(states, ["celebrate", "focus", "idle", "recover"]);
});

test("三域主要 NPC 各有四狀態與獨立頭像尺寸", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  const characterIds = [
    "ink-cave-spider-seven",
    "wind-valley-green-horn",
    "golden-ridge-tablet-turtle",
  ];

  for (const characterId of characterIds) {
    const assets = manifest.assets.filter(
      (asset) => asset.characterId === characterId,
    );
    assert.deepEqual(
      assets.map(({ state }) => state).sort(),
      ["avatar", "celebrate", "focus", "idle", "recover"],
    );

    const avatar = assets.find(({ state }) => state === "avatar");
    assert.equal(avatar.kind, "avatar");
    assert.deepEqual(
      avatar.sources.map(({ width }) => width),
      [128, 256],
    );
    for (const source of avatar.sources) {
      const sourceStat = await stat(new URL(source.path, projectRoot));
      const budget = source.width === 128 ? 15 * 1024 : 30 * 1024;
      assert.ok(
        sourceStat.size <= budget,
        `${avatar.id} ${source.width}w 超過預算：${sourceStat.size}`,
      );
    }
  }
});
